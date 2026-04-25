
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegistrarVacunacionDto } from './dto/registrar-vacunacion.dto';
import { CrearLoteDto } from './dto/crear-lote.dto';
import { DateUtils } from '../../common/utils/date-utils';

@Injectable()
export class VacunacionService {
  constructor(private prisma: PrismaService) {}

  async listarVacunas() {
    return this.prisma.catVacuna.findMany({
      where: { activo: true },
      include: { esquemas: true },
      orderBy: { nombre: 'asc' }
    });
  }

  async obtenerLotes(establecimientoId?: number, vacunaId?: number) {
    const where: any = { activo: true };
    if (establecimientoId) where.establecimientoId = establecimientoId;
    if (vacunaId) where.vacunaId = vacunaId;

    return this.prisma.loteVacuna.findMany({
      where,
      include: { vacuna: true },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  async actualizarLote(id: number, dto: any) {
    const loteActual = await this.prisma.loteVacuna.findUnique({ where: { id } });
    if (!loteActual) throw new NotFoundException('Lote no encontrado');
    
    let nuevaCantidadActual: number | undefined = undefined;
    if (dto.cantidadInicial !== undefined) {
      const diferencia = dto.cantidadInicial - loteActual.cantidadInicial;
      nuevaCantidadActual = loteActual.cantidadActual + diferencia;
    }

    return this.prisma.loteVacuna.update({
      where: { id },
      data: {
        ...dto,
        cantidadActual: nuevaCantidadActual,
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : undefined
      }
    });
  }

  async eliminarLote(id: number) {
    // Marcamos como inactivo en lugar de borrar físicamente para mantener trazabilidad
    return this.prisma.loteVacuna.update({
      where: { id },
      data: { activo: false }
    });
  }

  async registrarAplicacion(dto: RegistrarVacunacionDto, usuarioId: number) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verificar lote y disponibilidad
      const lote = await tx.loteVacuna.findUnique({
        where: { id: dto.loteId }
      });

      if (!lote || lote.cantidadActual <= 0) {
        throw new BadRequestException('El lote seleccionado no tiene existencias o no existe.');
      }

      if (new Date(lote.fechaVencimiento) < new Date()) {
        throw new BadRequestException('El lote seleccionado está vencido.');
      }

      const now = DateUtils.getLiteralNow();
      // 2. Registrar la aplicación
      const registro = await tx.vacunacionRegistro.create({
        data: {
          pacienteId: dto.pacienteId,
          vacunaId: dto.vacunaId,
          esquemaId: dto.esquemaId,
          loteId: dto.loteId,
          sitioAplicacion: dto.sitioAplicacion,
          viaAplicacion: dto.viaAplicacion,
          observaciones: dto.observaciones,
          establecimientoId: dto.establecimientoId,
          aplicadoPorId: usuarioId,
          fechaAplicacion: dto.fechaAplicacion ? new Date(dto.fechaAplicacion) : now
        }
      });

      // 3. Descontar del lote
      await tx.loteVacuna.update({
        where: { id: lote.id },
        data: { cantidadActual: { decrement: 1 } }
      });

      // 4. Registrar movimiento
      await tx.movimientoVacuna.create({
        data: {
          loteId: lote.id,
          tipo: 'APLICACION',
          cantidad: -1,
          usuarioId: usuarioId,
          motivo: `Aplicación a paciente ID: ${dto.pacienteId}`,
          fecha: now,
        }
      });

      return registro;
    });
  }

  async obtenerHistorialPaciente(pacienteId: number) {
    return this.prisma.vacunacionRegistro.findMany({
      where: { pacienteId },
      include: {
        vacuna: true,
        esquema: true,
        lote: true,
        establecimiento: { select: { nombre: true } },
        aplicadoPor: { select: { nombres: true, apellidos: true } }
      },
      orderBy: { fechaAplicacion: 'desc' }
    });
  }

  async crearLote(dto: CrearLoteDto, usuarioId: number) {
    return this.prisma.$transaction(async (tx) => {
      const now = DateUtils.getLiteralNow();
      const lote = await tx.loteVacuna.create({
        data: {
          ...dto,
          fechaVencimiento: new Date(dto.fechaVencimiento),
          cantidadActual: dto.cantidadInicial,
          creadoEn: now
        }
      });

      await tx.movimientoVacuna.create({
        data: {
          loteId: lote.id,
          tipo: 'ENTRADA',
          cantidad: dto.cantidadInicial,
          usuarioId: usuarioId,
          motivo: 'Carga inicial de lote',
          fecha: now
        }
      });

      return lote;
    });
  }

  async registrarMovimientoManual(dto: { loteId: number, tipo: any, cantidad: number, motivo: string }, usuarioId: number) {
    return this.prisma.$transaction(async (tx) => {
      const lote = await tx.loteVacuna.findUnique({ where: { id: dto.loteId } });
      if (!lote) throw new NotFoundException('Lote no encontrado');

      const now = DateUtils.getLiteralNow();
      // Actualizar stock
      await tx.loteVacuna.update({
        where: { id: dto.loteId },
        data: { cantidadActual: { increment: dto.cantidad } }
      });

      // Registrar movimiento
      return tx.movimientoVacuna.create({
        data: {
          loteId: dto.loteId,
          tipo: dto.tipo,
          cantidad: dto.cantidad,
          usuarioId: usuarioId,
          motivo: dto.motivo,
          fecha: now
        }
      });
    });
  }

  async obtenerMovimientos(loteId: number) {
    return this.prisma.movimientoVacuna.findMany({
      where: { loteId },
      include: { 
        usuario: { select: { nombres: true, apellidos: true } }
      },
      orderBy: { fecha: 'desc' }
    });
  }
}
