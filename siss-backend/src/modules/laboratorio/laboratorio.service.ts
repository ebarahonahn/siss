import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsignarExamenDto, FiltroExamenDto } from './dto/laboratorio.dto';

@Injectable()
export class LaboratorioService {
  constructor(private prisma: PrismaService) {}

  async listarCatalogo(filtro: FiltroExamenDto) {
    const { busqueda, categoria, establecimientoId } = filtro;
    const where: any = { activo: true };

    if (categoria) where.categoria = categoria;
    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda } },
        { codigo: { contains: busqueda } },
      ];
    }

    if (establecimientoId) {
      where.establecimientos = {
        some: { establecimientoId },
      };
    }

    return this.prisma.catExamenLaboratorio.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });
  }

  async listarCategorias() {
    const categorias = await this.prisma.catExamenLaboratorio.groupBy({
      by: ['categoria'],
      where: { activo: true },
    });
    return categorias.map((c) => c.categoria);
  }

  async listarPorEstablecimiento(establecimientoId: number) {
    const asignaciones = await this.prisma.examenEstablecimiento.findMany({
      where: { establecimientoId },
      include: { examen: true },
      orderBy: { examen: { nombre: 'asc' } },
    });
    return asignaciones.map((a) => a.examen);
  }

  async asignarExamenes(dto: AsignarExamenDto) {
    const { establecimientoId, examenIds } = dto;

    // Verificar si el establecimiento existe
    const existe = await this.prisma.establecimiento.findUnique({
      where: { id: establecimientoId },
    });
    if (!existe)
      throw new NotFoundException(
        `Establecimiento ${establecimientoId} no encontrado`,
      );

    return this.prisma.$transaction(async (tx) => {
      // 1. Eliminar asignaciones previas
      await tx.examenEstablecimiento.deleteMany({
        where: { establecimientoId },
      });

      // 2. Crear nuevas asignaciones
      if (examenIds.length > 0) {
        await tx.examenEstablecimiento.createMany({
          data: examenIds.map((id) => ({
            establecimientoId,
            examenId: id,
          })),
        });
      }

      return { count: examenIds.length };
    });
  }
}
