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
    const startMsg = `[START-CREAR] Usuario: ${usuarioId}, Roles: ${JSON.stringify(roles)}, DTO: ${JSON.stringify(dto)}\n`;
    require('fs').appendFileSync('citas_debug.log', startMsg);
    // 1. Un médico no puede agendar citas para otro médico
    if (roles.includes('MEDICO') && dto.medicoId !== usuarioId) {
      throw new ForbiddenException(
        'Como médico, solo puede agendar citas para usted mismo',
      );
    }

    const fechaSolicitada = new Date(dto.fechaHora);
    const ahora = DateUtils.getLiteralNow();

    // Reglas específicas para PACIENTES (Autogestión móvil)
    if (roles.includes('PACIENTE')) {
      // 1. Solo pueden agendar para el día actual
      const hoyString = ahora.toISOString().split('T')[0];
      const solicitadaString = fechaSolicitada.toISOString().split('T')[0];
      
      if (hoyString !== solicitadaString) {
        throw new ConflictException('Solo se pueden agendar citas para el día de hoy mediante la aplicación móvil.');
      }

      // 2. No se puede agendar para una hora que ya pasó (margen de 5 min)
      if (fechaSolicitada.getTime() < ahora.getTime() - 300000) {
        throw new ConflictException('No puede agendar una cita en un horario pasado.');
      }

      // 3. Validar límite diario de citas por médico (desde parámetros)
      const paramCitas = await this.prisma.parametroSistema.findUnique({
        where: { clave: 'MAX_CITAS_PACIENTE_DIA' },
      });
      const maxCitas = parseInt(paramCitas?.valor || '3');

      const { inicio, fin } = DateUtils.getLocalDayRange(solicitadaString);

      const citasHoy = await this.prisma.cita.findMany({
        where: {
          medicoId: dto.medicoId,
          fechaHora: { gte: inicio, lte: fin },
          estado: { notIn: [EstadoCita.CANCELADA] },
        },
      });

      const countCitasHoy = citasHoy.length;

      const debugMsg = `[${new Date().toISOString()}] Medico: ${dto.medicoId}, Hoy: ${solicitadaString}, CountTotal: ${countCitasHoy}, Max: ${maxCitas}\n`;
      require('fs').appendFileSync('citas_debug.log', debugMsg);

      if (countCitasHoy >= maxCitas) {
        throw new ConflictException(`El médico ya ha alcanzado el límite de ${maxCitas} citas para hoy.`);
      }

      // 4. Un paciente solo puede tener UNA cita al día en el mismo centro médico
      const citasPacienteHoy = await this.prisma.cita.count({
        where: {
          pacienteId: dto.pacienteId,
          establecimientoId: establecimientoId,
          fechaHora: { gte: inicio, lte: fin },
          estado: { notIn: [EstadoCita.CANCELADA] },
        },
      });

      if (citasPacienteHoy > 0) {
        throw new ConflictException('Usted ya tiene una cita agendada para hoy en este centro médico. Solo se permite una cita por día por paciente.');
      }
    }

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
        creadoPorId: roles.includes('PACIENTE') ? null : usuarioId,
      },
      include: {
        paciente: { select: { nombres: true, apellidos: true, dni: true } },
        medico: { select: { nombres: true, apellidos: true } },
        especialidad: { select: { nombre: true } },
      },
    });
  }

  async listar(
    establecimientoId: number | null,
    roles: string[],
    usuarioId: number,
    fecha?: string,
    dni?: string,
  ) {
    const where: any = {};

    if (establecimientoId) {
      where.establecimientoId = establecimientoId;
    }

    // Si es médico, solo ve sus citas en este establecimiento
    if (roles.includes('MEDICO')) {
      where.medicoId = usuarioId;
    }

    // Si es paciente, filtramos por su registro de paciente vinculado al DNI
    if (roles.includes('PACIENTE')) {
      if (!dni) return []; // Seguridad: Sin DNI no hay citas
      
      const paciente = await this.prisma.paciente.findUnique({
        where: { dni },
        select: { id: true }
      });

      if (!paciente) return []; // No tiene registro de paciente aún
      
      where.pacienteId = paciente.id;

      // Si no se especifica fecha, filtramos para mostrar solo lo relevante (dashboard)
      if (!fecha) {
        // Excluimos explícitamente estados terminales negativos
        where.estado = { notIn: [EstadoCita.CANCELADA, EstadoCita.NO_ASISTIO] };
        
        // Excluimos citas que ya pasaron (hace más de 1 hora) y siguen en estado PROGRAMADA/CONFIRMADA
        // porque se consideran "perdidas" o "no atendidas a tiempo"
        const haceUnaHora = DateUtils.getLiteralNow();
        haceUnaHora.setHours(haceUnaHora.getHours() - 1);
        
        where.OR = [
          { fechaHora: { gte: haceUnaHora } }, // Citas futuras o recientes
          { estado: EstadoCita.EN_SALA }       // O pacientes esperando
        ];
      }
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
            especialidad: { select: { nombre: true } }
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
    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    const updated = await this.prisma.cita.update({
      where: { id },
      data: { estado: EstadoCita.NO_ASISTIO },
    });

    require('fs').appendFileSync('citas_debug.log', `[NO-ASISTIO] Cita ${id} actualizada a NO_ASISTIO. Nuevo estado: ${updated.estado}\n`);
    return updated;
  }

  async obtenerSiguienteHorarioDisponible(
    medicoId: number,
    fecha: string,
    establecimientoId: number,
  ) {
    if (!establecimientoId) {
      throw new Error('El ID del establecimiento es obligatorio para buscar disponibilidad.');
    }

    const { inicio, fin } = DateUtils.getLocalDayRange(fecha);

    // 1. Obtener la jornada laboral para este día y médico
    const partes = fecha.includes('-') ? fecha.split('-') : fecha.split('/');
    const d = new Date(Date.UTC(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]), 12, 0, 0)); 
    const diaSemana = d.getUTCDay();

    const jornada = await this.prisma.agendaBase.findFirst({
      where: { 
        medicoId: Number(medicoId), 
        establecimientoId: Number(establecimientoId), 
        diaSemana, 
        activo: true 
      },
      orderBy: { horaInicio: 'asc' },
    });

    if (!jornada) {
      throw new ConflictException(
        'El médico seleccionado no tiene una jornada laboral programada para este día en este establecimiento.',
      );
    }

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

      if (jornada) {
        const [h, m] = jornada.horaInicio.split(':');
        const [hf, mf] = jornada.horaFin.split(':');
        const inicioJornada = new Date(`${fecha}T${h}:${m}:00.000Z`);
        const finJornada = new Date(`${fecha}T${hf}:${mf}:00.000Z`);
        const ahoraLiteral = DateUtils.getLiteralNow();
        
        let sugerencia = inicioJornada;
        if (ahoraLiteral > inicioJornada) {
          sugerencia = ahoraLiteral;
          const mins = sugerencia.getMinutes();
          sugerencia.setMinutes(Math.ceil((mins + 1) / 10) * 10);
          sugerencia.setSeconds(0);
          sugerencia.setMilliseconds(0);
        }

        // VALIDACIÓN CRÍTICA: ¿La hora sugerida está fuera de la jornada?
        if (sugerencia >= finJornada) {
          throw new ConflictException(
            `La jornada laboral del médico para hoy ya ha finalizado (terminó a las ${jornada.horaFin}).`,
          );
        }

        return { siguienteHoraISO: sugerencia.toISOString() };
      }

      // Si no hay jornada programada, informar al cliente
      throw new ConflictException(
        'El médico seleccionado no tiene una jornada laboral programada para este día en este establecimiento.',
      );
    }

    let siguienteHora = new Date(
      ultimaCita.fechaHora.getTime() + minutosEntreConsultas * 60000,
    );

    const ahoraLiteral = DateUtils.getLiteralNow();
    if (ahoraLiteral > siguienteHora) {
      siguienteHora = ahoraLiteral;
      const mins = siguienteHora.getMinutes();
      siguienteHora.setMinutes(Math.ceil((mins + 1) / 10) * 10);
      siguienteHora.setSeconds(0);
      siguienteHora.setMilliseconds(0);
    }

    // Validar que la siguiente hora sugerida no se salga de la jornada
    const [hf, mf] = jornada.horaFin.split(':');
    const finJornada = new Date(`${fecha}T${hf}:${mf}:00.000Z`);

    if (siguienteHora >= finJornada) {
      throw new ConflictException(
        `Ya no hay espacios disponibles para hoy. La jornada del médico terminó a las ${jornada.horaFin}.`,
      );
    }

    return {
      siguienteHoraISO: siguienteHora.toISOString(),
      ultimaCitaHora: ultimaCita.fechaHora.toISOString(),
    };
  }
}
