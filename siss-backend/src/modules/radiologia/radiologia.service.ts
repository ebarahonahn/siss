import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  EstudioRadiologicoDto,
  AsignarEstudiosDto,
  FiltroEstudioDto,
} from './dto/radiologia.dto';

@Injectable()
export class RadiologiaService {
  constructor(private prisma: PrismaService) {}

  async listarCatalogo(filtro: FiltroEstudioDto) {
    const { busqueda, categoria, establecimientoId } = filtro;

    return this.prisma.catExamenRadiologico.findMany({
      where: {
        activo: true,
        AND: [
          busqueda
            ? {
                OR: [
                  { nombre: { contains: busqueda } },
                  { codigo: { contains: busqueda } },
                ],
              }
            : {},
          categoria ? { categoria } : {},
          establecimientoId
            ? {
                establecimientos: {
                  some: { establecimientoId },
                },
              }
            : {},
        ],
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async listarCategorias() {
    const result = await this.prisma.catExamenRadiologico.groupBy({
      by: ['categoria'],
      where: { activo: true },
      _count: { categoria: true },
    });
    return result.map((r) => r.categoria);
  }

  async crearEstudio(dto: EstudioRadiologicoDto) {
    return this.prisma.catExamenRadiologico.create({
      data: dto,
    });
  }

  async actualizarEstudio(id: number, dto: EstudioRadiologicoDto) {
    return this.prisma.catExamenRadiologico.update({
      where: { id },
      data: dto,
    });
  }

  async asignarAEstablecimiento(dto: AsignarEstudiosDto) {
    const { establecimientoId, estudiosIds } = dto;

    // Primero eliminamos las asignaciones actuales para este centro
    await this.prisma.estudioRadiologicoEstablecimiento.deleteMany({
      where: { establecimientoId },
    });

    // Creamos las nuevas asignaciones
    if (estudiosIds.length > 0) {
      await this.prisma.estudioRadiologicoEstablecimiento.createMany({
        data: estudiosIds.map((estudioId) => ({
          establecimientoId,
          estudioId,
        })),
      });
    }

    return { message: 'Asignación actualizada exitosamente' };
  }

  async obtenerAsignaciones(establecimientoId: number) {
    if (!establecimientoId || isNaN(establecimientoId)) return [];

    const asignaciones =
      await this.prisma.estudioRadiologicoEstablecimiento.findMany({
        where: { establecimientoId: Number(establecimientoId) },
        select: { estudioId: true },
      });
    return asignaciones.map((a) => a.estudioId);
  }
}
