import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReferenciasService {
  constructor(private prisma: PrismaService) {}

  async crear(data: any) {
    return await this.prisma.referido.create({
      data: {
        historiaId: data.historiaId,
        establecimientoOrigenId: data.establecimientoOrigenId,
        establecimientoDestinoId: data.establecimientoDestinoId,
        especialidadDestino: data.especialidadDestino,
        motivo: data.motivo,
        urgente: data.urgente || false,
        estado: 'EMITIDO',
      },
    });
  }

  async obtenerPorHistoria(historiaId: number) {
    return await this.prisma.referido.findMany({
      where: { historiaId },
      include: {
        historia: {
          include: {
            paciente: true,
          },
        },
      },
    });
  }

  async obtenerPorPaciente(pacienteId: number) {
    return await this.prisma.referido.findMany({
      where: {
        historia: {
          pacienteId,
        },
      },
      orderBy: { creadoEn: 'desc' },
    });
  }
}
