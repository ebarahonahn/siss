import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServicioDto } from './dto/create-servicio.dto';

@Injectable()
export class ServiciosService {
  constructor(private prisma: PrismaService) {}

  async obtenerCatalogo() {
    return this.prisma.catServicio.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async crear(dto: CreateServicioDto) {
    return this.prisma.servicio.create({
      data: dto,
    });
  }

  async listarPorEstablecimiento(establecimientoId: number) {
    return this.prisma.servicio.findMany({
      where: { establecimientoId, activo: true },
      include: { catServicio: true },
    });
  }

  async actualizar(id: number, data: any) {
    return this.prisma.servicio.update({
      where: { id },
      data,
    });
  }

  async eliminar(id: number) {
    return this.prisma.servicio.update({
      where: { id },
      data: { activo: false },
    });
  }
}
