import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearTriajeDto } from './dto/crear-triaje.dto';
import { EstadoCita } from '@prisma/client';
import { DateUtils } from '../../common/utils/date-utils';

const INCLUDE_TRIAJE = {
  cita: {
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
      medico: { select: { id: true, nombres: true, apellidos: true } },
    },
  },
  enfermera: { select: { id: true, nombres: true, apellidos: true } },
};

@Injectable()
export class TriajeService {
  constructor(private prisma: PrismaService) {}

  /** Citas del día pendientes de triaje para el establecimiento, filtradas por rol */
  async citasPendientes(user: any, fecha?: string) {
    const establecimientoId: number = user.establecimientoId;

    // Si no viene fecha, usamos hoy (Local)
    const fechaString = fecha || DateUtils.getHoyLocalString();

    const { inicio, fin } = DateUtils.getLocalDayRange(fechaString);

    // ── Determinar el filtro adicional según el rol del usuario ──────────────
    const rolNombre: string = (user.rol || '').toUpperCase();

    // Roles que pueden ver todas las citas del establecimiento (sin filtro extra)
    const ROL_ADMIN = ['ADMINISTRADOR', 'RECEPCIONISTA', 'DIRECTOR', 'COORDINADOR', 'SUPERADMIN'];
    const esAdmin = ROL_ADMIN.some((r) => rolNombre.includes(r));

    // Filtro extra por médico: si el usuario tiene citas asignadas a él
    const esMedico =
      rolNombre.includes('MEDICO') ||
      rolNombre.includes('ODONTOLOGO') ||
      rolNombre.includes('ODONTOLOGÍA') ||
      rolNombre.includes('ODONTOLOGIA') ||
      rolNombre.includes('DOCTOR');

    const filtroExtra: Record<string, any> = {};

    if (!esAdmin) {
      if (esMedico) {
        // El médico/odontólogo solo ve sus propias citas
        filtroExtra.medicoId = Number(user.sub);
      } else if (user.especialidadId) {
        // Enfermera/auxiliar asignada a una especialidad: ver citas de esa especialidad
        filtroExtra.especialidadId = Number(user.especialidadId);
      } else if (user.servicioId) {
        // Asignada a un servicio específico
        filtroExtra.medico = {
          asignaciones: {
            some: {
              establecimientoId,
              servicioId: Number(user.servicioId),
              activo: true,
            },
          },
        };
      }
      // Si no es admin pero tampoco tiene especialidad/servicio → puede ver todas (enfermera general)
    }

    const citas = await this.prisma.cita.findMany({
      where: {
        establecimientoId,
        fechaHora: { gte: inicio, lte: fin },
        estado: {
          in: [
            EstadoCita.PROGRAMADA,
            EstadoCita.CONFIRMADA,
            EstadoCita.EN_SALA,
          ],
        },
        ...filtroExtra,
      },
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
        medico: { select: { id: true, nombres: true, apellidos: true } },
        especialidad: { select: { id: true, nombre: true } },
        triaje: { select: { id: true, categoria: true, creadoEn: true } },
      },
      orderBy: { fechaHora: 'asc' },
    });

    return citas;
  }

  async crear(dto: CrearTriajeDto, enfermeraId: number) {
    const cita = await this.prisma.cita.findUnique({
      where: { id: dto.citaId },
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    const existe = await this.prisma.triaje.findUnique({
      where: { citaId: dto.citaId },
    });
    if (existe)
      throw new ConflictException('Esta cita ya tiene un triaje registrado');

    try {
      const [triaje] = await this.prisma.$transaction([
        this.prisma.triaje.create({
          data: {
            citaId: dto.citaId,
            pacienteId: cita.pacienteId,
            enfermeraId,
            motivoConsulta: dto.motivoConsulta,
            presionSistolica: dto.presionSistolica,
            presionDiastolica: dto.presionDiastolica,
            frecuenciaCardiaca: dto.frecuenciaCardiaca,
            frecuenciaRespiratoria: dto.frecuenciaRespiratoria,
            temperatura: dto.temperatura,
            saturacionO2: dto.saturacionO2,
            glucometria: dto.glucometria,
            peso: dto.peso,
            talla: dto.talla,
            escalaDolor: dto.escalaDolor,
            nivelConciencia: dto.nivelConciencia as any,
            categoria: dto.categoria as any,
            observaciones: dto.observaciones,
            creadoEn: dto.creadoEn ? new Date(dto.creadoEn) : new Date(),
          },
          include: INCLUDE_TRIAJE,
        }),
        this.prisma.cita.update({
          where: { id: dto.citaId },
          data: { estado: EstadoCita.EN_SALA },
        }),
      ]);
      return triaje;
    } catch (error) {
      console.error('Error al crear triaje:', error);
      throw error;
    }
  }

  async obtener(id: number) {
    const t = await this.prisma.triaje.findUnique({
      where: { id },
      include: INCLUDE_TRIAJE,
    });
    if (!t) throw new NotFoundException('Triaje no encontrado');
    return t;
  }

  async obtenerPorCita(citaId: number) {
    return this.prisma.triaje.findUnique({
      where: { citaId },
      include: INCLUDE_TRIAJE,
    });
  }
}
