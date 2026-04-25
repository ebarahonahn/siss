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

  /** Citas del día pendientes de triaje para el establecimiento */
  async citasPendientes(establecimientoId: number, fecha?: string) {
    // Si no viene fecha, usamos hoy (Local)
    const fechaString = fecha || DateUtils.getHoyLocalString();

    const { inicio, fin } = DateUtils.getLocalDayRange(fechaString);

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
