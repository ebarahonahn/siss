import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEstablecimientoDto } from './dto/create-establecimiento.dto';
import { UpdateEstablecimientoDto } from './dto/update-establecimiento.dto';

@Injectable()
export class EstablecimientosService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CreateEstablecimientoDto) {
    const { servicios, ...data } = dto;
    return this.prisma.establecimiento.create({
      data: {
        ...data,
        servicios: {
          create:
            servicios?.map((s) => ({
              catServicioId: s.catServicioId,
            })) || [],
        },
      },
      include: {
        servicios: {
          include: { catServicio: true },
        },
        municipio: true,
        departamento: true,
      },
    });
  }

  async listar() {
    return this.prisma.establecimiento.findMany({
      where: { eliminadoEn: null },
      orderBy: { nombre: 'asc' },
      include: {
        municipio: true,
        departamento: true,
        servicios: {
          where: { activo: true },
        },
      },
    });
  }

  async listarSimplificado() {
    return this.prisma.establecimiento.findMany({
      where: { eliminadoEn: null, activo: true },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async obtenerPorId(id: number) {
    const establecimiento = await this.prisma.establecimiento.findUnique({
      where: { id },
      include: {
        servicios: {
          where: { activo: true },
          include: { catServicio: true },
        },
        municipio: true,
        departamento: true,
      },
    });

    if (!establecimiento || establecimiento.eliminadoEn) {
      throw new NotFoundException(`Establecimiento con ID ${id} no encontrado`);
    }

    return establecimiento;
  }

  async actualizar(id: number, dto: UpdateEstablecimientoDto) {
    const { servicios, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (servicios) {
        // Obtener servicios actuales activos
        const actuales = await tx.servicio.findMany({
          where: { establecimientoId: id, activo: true },
        });
        // Sincronizar servicios: Desactivar los que ya no están en la lista recibida
        const actualesCatIds = actuales.map((s) => s.catServicioId);
        const recibidosCatIds = servicios.map((s) => s.catServicioId);

        const aDesactivarCatIds = actualesCatIds.filter(
          (cid) => !recibidosCatIds.includes(cid),
        );
        if (aDesactivarCatIds.length > 0) {
          await tx.servicio.updateMany({
            where: {
              establecimientoId: id,
              catServicioId: { in: aDesactivarCatIds },
            },
            data: { activo: false },
          });
        }

        // Actualizar o crear de forma inteligente
        for (const s of servicios) {
          // Buscamos si ya existe una relación previa para este catálogo y establecimiento
          const existe = await tx.servicio.findFirst({
            where: {
              establecimientoId: id,
              catServicioId: s.catServicioId,
            },
          });

          if (existe) {
            // Si existe, simplemente nos aseguramos de que esté activo
            await tx.servicio.update({
              where: { id: existe.id },
              data: { activo: true },
            });
          } else {
            // Si no existe, lo creamos
            await tx.servicio.create({
              data: {
                catServicioId: s.catServicioId,
                establecimientoId: id,
              },
            });
          }
        }
      }

      return tx.establecimiento.update({
        where: { id },
        data,
        include: {
          servicios: {
            where: { activo: true },
            include: { catServicio: true },
          },
          municipio: true,
          departamento: true,
        },
      });
    });
  }

  async eliminar(id: number, usuarioId: number) {
    return this.prisma.establecimiento.update({
      where: { id },
      data: {
        activo: false,
        eliminadoEn: new Date(),
        eliminadoPorId: usuarioId,
      },
    });
  }
}
