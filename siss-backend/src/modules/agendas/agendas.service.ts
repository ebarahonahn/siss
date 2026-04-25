import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAgendaBaseDto } from './dto/create-agenda.dto';
import { CreateExcepcionDto } from './dto/create-excepcion.dto';

@Injectable()
export class AgendasService {
  constructor(private prisma: PrismaService) {}

  async upsertAgendaBase(dto: CreateAgendaBaseDto) {
    return this.prisma.agendaBase.upsert({
      where: {
        medicoId_establecimientoId_diaSemana_horaInicio: {
          medicoId: dto.medicoId,
          establecimientoId: dto.establecimientoId,
          diaSemana: dto.diaSemana,
          horaInicio: dto.horaInicio,
        },
      },
      update: { ...dto },
      create: { ...dto },
    });
  }

  async createExcepcion(dto: CreateExcepcionDto, usuarioId?: number) {
    // Forzamos que la fecha inicio sea al inicio del día (00:00:00) 
    // y la fecha fin sea al final del día (23:59:59) para cubrir el rango completo
    const inicio = new Date(dto.fechaInicio);
    const fin = new Date(dto.fechaFin);
    fin.setUTCHours(23, 59, 59, 999);

    return this.prisma.excepcionAgenda.create({
      data: {
        ...dto,
        fechaInicio: inicio,
        fechaFin: fin,
        creadoPorId: usuarioId,
      },
    });
  }

  async eliminarExcepcion(id: number) {
    return this.prisma.excepcionAgenda.delete({
      where: { id },
    });
  }

  async eliminarAgendaBase(medicoId: number, establecimientoId: number, diaSemana: number) {
    return this.prisma.agendaBase.deleteMany({
      where: { medicoId, establecimientoId, diaSemana },
    });
  }

  async listarAgendaMedico(medicoId: number, establecimientoId: number) {
    const [base, excepciones] = await Promise.all([
      this.prisma.agendaBase.findMany({
        where: { medicoId, establecimientoId, activo: true },
        orderBy: { diaSemana: 'asc' },
      }),
      this.prisma.excepcionAgenda.findMany({
        where: { medicoId, establecimientoId },
        orderBy: { fechaInicio: 'asc' },
      }),
    ]);

    return { base, excepciones };
  }

  async verificarDisponibilidad(medicoId: number, establecimientoId: number, fechaHora: Date) {
    const d = new Date(fechaHora);
    const diaSemana = d.getUTCDay();
    const horaStr = d.getUTCHours().toString().padStart(2, '0') + ':' + 
                    d.getUTCMinutes().toString().padStart(2, '0');

    console.log(`[Diagnóstico Agenda] Médico: ${medicoId}, Centro: ${establecimientoId}`);
    console.log(`[Diagnóstico Agenda] Literal Detectado - Día: ${diaSemana}, Hora: ${horaStr}`);

    // 1. Verificar si el médico tiene jornada en ESTE establecimiento
    const jornada = await this.prisma.agendaBase.findFirst({
      where: {
        medicoId: Number(medicoId),
        establecimientoId: Number(establecimientoId),
        diaSemana: diaSemana,
        activo: true,
        horaInicio: { lte: horaStr },
        horaFin: { gte: horaStr },
      },
    });

    if (!jornada) {
      return {
        disponible: false,
        mensaje:
          'El médico no tiene jornada laboral programada en este establecimiento para este horario.',
      };
    }

    // 2. Verificar excepciones en ESTE establecimiento
    const excepcion = await this.prisma.excepcionAgenda.findFirst({
      where: {
        medicoId,
        establecimientoId,
        fechaInicio: { lte: fechaHora },
        fechaFin: { gte: fechaHora },
      },
    });

    if (excepcion) {
      const tipo = excepcion.tipo
        .toLowerCase()
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return {
        disponible: false,
        mensaje: `El médico no está disponible en este establecimiento debido a: ${tipo}`,
      };
    }

    return { disponible: true };
  }
}
