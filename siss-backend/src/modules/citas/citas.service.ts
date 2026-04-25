import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { EstadoCita } from '@prisma/client';
import { DateUtils } from '../../common/utils/date-utils';
import { AgendasService } from '../agendas/agendas.service';

@Injectable()
export class CitasService {
  constructor(
    private prisma: PrismaService,
    private agendasService: AgendasService,
  ) {}

  async crear(
    dto: CreateCitaDto,
    establecimientoId: number,
    usuarioId: number,
    roles: string[],
  ) {
    // 1. Un médico no puede agendar citas para otro médico
    if (roles.includes('MEDICO') && dto.medicoId !== usuarioId) {
      throw new ForbiddenException(
        'Como médico, solo puede agendar citas para usted mismo',
      );
    }

    // Se confía en la configuración de fecha y zona horaria enviada por el cliente
    const fechaSolicitada = new Date(dto.fechaHora);

    // 1.5 Validar disponibilidad en la agenda del médico (específico para este establecimiento)
    const disponibilidad = await this.agendasService.verificarDisponibilidad(
      dto.medicoId,
      establecimientoId,
      fechaSolicitada,
    );

    if (!disponibilidad.disponible) {
      throw new ConflictException(disponibilidad.mensaje);
    }

    // 2. Validar conflicto de horario considerando los minutos entre consultas
    const parametro = await this.prisma.parametroSistema.findUnique({
      where: { clave: 'MINUTOS_ENTRE_CONSULTAS' },
    });
    const minutosEntreConsultas = parseInt(parametro?.valor || '20');

    const inicioRango = new Date(
      fechaSolicitada.getTime() - (minutosEntreConsultas - 1) * 60000,
    );
    const finRango = new Date(
      fechaSolicitada.getTime() + (minutosEntreConsultas - 1) * 60000,
    );

    const existe = await this.prisma.cita.findFirst({
      where: {
        medicoId: dto.medicoId,
        fechaHora: {
          gte: inicioRango,
          lte: finRango,
        },
        estado: { notIn: [EstadoCita.CANCELADA, EstadoCita.NO_ASISTIO] },
      },
    });

    if (existe) {
      throw new ConflictException(
        `El médico ya tiene una cita programada en un horario cercano (requiere un margen de ${minutosEntreConsultas} minutos)`,
      );
    }

    return this.prisma.cita.create({
      data: {
        ...dto,
        fechaHora: fechaSolicitada,
        establecimientoId,
        creadoPorId: usuarioId,
      },
      include: {
        paciente: { select: { nombres: true, apellidos: true, dni: true } },
        medico: { select: { nombres: true, apellidos: true } },
        especialidad: { select: { nombre: true } },
      },
    });
  }

  async listar(
    establecimientoId: number,
    roles: string[],
    usuarioId: number,
    fecha?: string,
  ) {
    const where: any = {
      establecimientoId,
    };

    // Si es médico, solo ve sus citas en este establecimiento
    if (roles.includes('MEDICO')) {
      where.medicoId = usuarioId;
    }

    if (fecha) {
      const { inicio, fin } = DateUtils.getLocalDayRange(fecha);
      where.fechaHora = { gte: inicio, lte: fin };
    }

    return this.prisma.cita.findMany({
      where,
      include: {
        paciente: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            dni: true,
            numeroExpediente: true,
            fechaNacimiento: true,
          },
        },
        medico: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            especialidadId: true,
          },
        },
        establecimiento: { select: { nombre: true } },
        especialidad: { select: { nombre: true } },
        triaje: {
          select: {
            id: true,
            categoria: true,
            motivoConsulta: true,
            presionSistolica: true,
            presionDiastolica: true,
            frecuenciaCardiaca: true,
            frecuenciaRespiratoria: true,
            temperatura: true,
            saturacionO2: true,
            glucometria: true,
            peso: true,
            talla: true,
            escalaDolor: true,
            nivelConciencia: true,
            observaciones: true,
            creadoEn: true,
            enfermera: { select: { nombres: true, apellidos: true } },
          },
        },
        historia: { select: { id: true } },
      },
      orderBy: { fechaHora: 'asc' },
    });
  }

  async cancelar(id: number, usuarioId: number) {
    const cita = await this.prisma.cita.findUnique({ where: { id } });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    return this.prisma.cita.update({
      where: { id },
      data: { estado: EstadoCita.CANCELADA, canceladoPorId: usuarioId },
    });
  }

  async noAsistio(id: number, usuarioId: number) {
    const cita = await this.prisma.cita.findUnique({ where: { id } });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    return this.prisma.cita.update({
      where: { id },
      data: { estado: EstadoCita.NO_ASISTIO },
    });
  }

  async obtenerSiguienteHorarioDisponible(
    medicoId: number,
    fecha: string,
    establecimientoId: number,
  ) {
    const { inicio, fin } = DateUtils.getLocalDayRange(fecha);

    const ultimaCita = await this.prisma.cita.findFirst({
      where: {
        medicoId,
        fechaHora: { gte: inicio, lte: fin },
        estado: { notIn: [EstadoCita.CANCELADA, EstadoCita.NO_ASISTIO] },
      },
      orderBy: { fechaHora: 'desc' },
    });

    const parametro = await this.prisma.parametroSistema.findUnique({
      where: { clave: 'MINUTOS_ENTRE_CONSULTAS' },
    });
    const minutosEntreConsultas = parseInt(parametro?.valor || '20');

    if (!ultimaCita) {
      console.log(`[Diagnóstico Siguiente] RAW Fecha recibida: "${fecha}"`);
      // Si no hay citas, sugerir el inicio de la jornada laboral del médico
      // Manejar diferentes separadores y asegurar que tenemos números válidos
      const partes = fecha.includes('-') ? fecha.split('-') : fecha.split('/');
      const year = parseInt(partes[0]);
      const month = parseInt(partes[1]);
      const day = parseInt(partes[2]);
      
      const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)); 
      const diaSemana = d.getUTCDay();

      console.log(`[Diagnóstico Siguiente] Procesado -> Año: ${year}, Mes: ${month}, Día: ${day}, JS_DíaSemana: ${diaSemana}`);

      console.log(`[Diagnóstico Siguiente] Buscando jornada para Médico: ${medicoId}, Centro: ${establecimientoId}, Día: ${diaSemana}`);

      const jornada = await this.prisma.agendaBase.findFirst({
        where: { 
          medicoId: Number(medicoId), 
          establecimientoId: Number(establecimientoId), 
          diaSemana, 
          activo: true 
        },
        orderBy: { horaInicio: 'asc' },
      });

      if (jornada) {
        const [h, m] = jornada.horaInicio.split(':');
        const sugerencia = new Date(`${fecha}T${h}:${m}:00.000Z`);
        return { siguienteHoraISO: sugerencia.toISOString() };
      }

      // Si no hay jornada programada, informar al cliente
      throw new ConflictException(
        'El médico seleccionado no tiene una jornada laboral programada para este día en este establecimiento.',
      );
    }

    const siguienteHora = new Date(
      ultimaCita.fechaHora.getTime() + minutosEntreConsultas * 60000,
    );

    // Validar que la siguiente hora sugerida no se salga de la jornada
    const disponibilidad = await this.agendasService.verificarDisponibilidad(
      medicoId,
      establecimientoId,
      siguienteHora,
    );

    if (!disponibilidad.disponible) {
      // Si la siguiente hora calculada se sale de la jornada, buscar si hay otra jornada más tarde el mismo día
      // o simplemente dejar de sugerir/sugerir el inicio de la siguiente jornada (esto es más complejo, 
      // por ahora devolvemos la hora calculada pero el frontend/backend bloquearán el guardado)
    }

    return {
      siguienteHoraISO: siguienteHora.toISOString(),
      ultimaCitaHora: ultimaCita.fechaHora.toISOString(),
    };
  }
}
