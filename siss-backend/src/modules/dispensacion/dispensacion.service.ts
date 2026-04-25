import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDispensacionDto } from './dto/create-dispensacion.dto';

@Injectable()
export class DispensacionService {
  constructor(private prisma: PrismaService) {}

  async buscarRecetasPendientes(
    identificador: string,
    establecimientoId: number,
  ) {
    const term = identificador.trim();
    const vigenciaDias = await this.obtenerVigenciaReceta();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - vigenciaDias);

    // 1. "Lazy update" de recetas que han expirado
    await this.prisma.receta.updateMany({
      where: {
        establecimientoId,
        estado: { in: ['PENDIENTE', 'PARCIAL'] },
        OR: [
          {
            AND: [{ estado: 'PENDIENTE' }, { creadaEn: { lt: fechaLimite } }],
          },
          {
            AND: [{ estado: 'PARCIAL' }, { dispensadaEn: { lt: fechaLimite } }],
          },
        ],
      },
      data: {
        estado: 'DEMANDA_INSATISFECHA',
      },
    });

    // 2. Buscar recetas activas actuales
    return this.prisma.receta.findMany({
      where: {
        establecimientoId,
        estado: { in: ['PENDIENTE', 'PARCIAL'] },
        paciente: {
          OR: [
            { dni: { contains: term } },
            { numeroExpediente: { contains: term } },
            { nombres: { contains: term } },
            { apellidos: { contains: term } },
          ],
        },
      },
      include: {
        paciente: {
          select: {
            nombres: true,
            apellidos: true,
            numeroExpediente: true,
            dni: true,
          },
        },
        detalles: {
          include: {
            medicamento: true,
          },
        },
      },
      orderBy: { creadaEn: 'desc' },
    });
  }

  async dispensar(
    dto: CreateDispensacionDto,
    usuarioId: number,
    establecimientoId: number,
  ) {
    const receta = await this.prisma.receta.findUnique({
      where: { id: dto.recetaId },
      include: { detalles: true },
    });

    if (!receta) throw new NotFoundException('Receta no encontrada');
    if (receta.establecimientoId !== establecimientoId) {
      throw new BadRequestException(
        'Esta receta pertenece a otro establecimiento',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const dispensacion = await tx.dispensacion.create({
        data: {
          recetaId: dto.recetaId,
          usuarioId,
          establecimientoId,
        },
      });

      for (const itemDto of dto.detalles) {
        const detalle = receta.detalles.find(
          (d) => d.id === itemDto.detalleRecetaId,
        );
        if (!detalle)
          throw new NotFoundException(
            `Detalle de receta ${itemDto.detalleRecetaId} no encontrado`,
          );

        const pendiente = detalle.cantidad - detalle.cantidadEntregada;
        if (itemDto.cantidad > pendiente) {
          throw new BadRequestException(
            `La cantidad a dispensar (${itemDto.cantidad}) supera lo pendiente (${pendiente}) para el medicamento ${detalle.medicamentoId}`,
          );
        }

        let cantidadPorEntregar = itemDto.cantidad;
        const lotesDisponibles = await tx.inventario.findMany({
          where: {
            medicamentoId: detalle.medicamentoId,
            establecimientoId,
            cantidadActual: { gt: 0 },
            activo: true,
          },
          orderBy: { fechaVencimiento: 'asc' },
        });

        const stockTotal = lotesDisponibles.reduce(
          (sum, l) => sum + l.cantidadActual,
          0,
        );
        if (stockTotal < itemDto.cantidad) {
          throw new BadRequestException(
            `No hay suficiente stock para el medicamento ${detalle.medicamentoId}. Disponible: ${stockTotal}`,
          );
        }

        for (const lote of lotesDisponibles) {
          if (cantidadPorEntregar <= 0) break;

          const aDescontar = Math.min(lote.cantidadActual, cantidadPorEntregar);

          await tx.inventario.update({
            where: { id: lote.id },
            data: { cantidadActual: { decrement: aDescontar } },
          });

          await tx.movimientoInventario.create({
            data: {
              inventarioId: lote.id,
              tipo: 'DISPENSACION',
              cantidad: aDescontar,
              motivo: `Dispensación Receta #${receta.id}`,
              usuarioId,
            },
          });

          await tx.dispensacionDetalle.create({
            data: {
              dispensacionId: dispensacion.id,
              detalleRecetaId: detalle.id,
              inventarioId: lote.id,
              cantidad: aDescontar,
            },
          });

          cantidadPorEntregar -= aDescontar;
        }

        await tx.detalleReceta.update({
          where: { id: detalle.id },
          data: {
            cantidadEntregada: { increment: itemDto.cantidad },
            ultimaDispensacion: new Date(),
          },
        });
      }

      const detallesActualizados = await tx.detalleReceta.findMany({
        where: { recetaId: receta.id },
      });

      const todosCompletos = detallesActualizados.every(
        (d) => d.cantidadEntregada === d.cantidad,
      );
      const algunoEntregado = detallesActualizados.some(
        (d) => d.cantidadEntregada > 0,
      );

      await tx.receta.update({
        where: { id: receta.id },
        data: {
          estado: todosCompletos
            ? 'DISPENSADA'
            : algunoEntregado
              ? 'PARCIAL'
              : 'PENDIENTE',
          dispensadaEn: todosCompletos ? new Date() : null,
        },
      });

      return dispensacion;
    });
  }

  async revisarMedicamentoPendiente(pacienteId: number, medicamentoId: number) {
    console.log(
      `[ValidarPendiente] Paciente: ${pacienteId}, Med: ${medicamentoId}`,
    );

    const receta = await this.prisma.receta.findFirst({
      where: {
        pacienteId,
        estado: { in: ['PENDIENTE', 'PARCIAL'] },
        detalles: {
          some: { medicamentoId },
        },
      },
      include: {
        establecimiento: { select: { nombre: true } },
        detalles: {
          where: { medicamentoId },
          select: {
            medicamentoId: true,
            cantidad: true,
            cantidadEntregada: true,
            duracion: true,
          },
        },
      },
    });

    if (!receta) {
      console.log(
        `[ValidarPendiente] No se encontró receta para Med ${medicamentoId}`,
      );
      return null;
    }

    console.log(
      `[ValidarPendiente] Receta encontrada: ${receta.id}. Detalles:`,
      receta.detalles,
    );

    // Verificar si realmente tiene cantidad pendiente para ESE medicamento
    const detalle = receta.detalles.find(
      (d) =>
        d.medicamentoId === medicamentoId && d.cantidad > d.cantidadEntregada,
    );

    if (!detalle) {
      console.log(
        `[ValidarPendiente] El medicamento ${medicamentoId} ya fue entregado en la receta ${receta.id}`,
      );
      return null;
    }

    // --- NUEVA LÓGICA DE VALIDACIÓN POR DURACIÓN ---
    const diasMatch = detalle.duracion ? detalle.duracion.match(/\d+/) : null;
    if (diasMatch) {
      const diasTratamiento = parseInt(diasMatch[0]);
      const fechaFinEstimada = new Date(receta.creadaEn);
      fechaFinEstimada.setDate(fechaFinEstimada.getDate() + diasTratamiento);

      const hoy = new Date();
      const margenDias = await this.obtenerMargenTraslape();

      const milisegundosFaltantes = fechaFinEstimada.getTime() - hoy.getTime();
      const diasFaltantes = milisegundosFaltantes / (1000 * 60 * 60 * 24);

      console.log(`[ValidarPendiente] Debug:`, {
        creadaEn: receta.creadaEn,
        diasTratamiento,
        fechaFinEstimada,
        hoy,
        diasFaltantes,
        margenDias,
      });

      if (diasFaltantes < margenDias) {
        console.log(
          `[ValidarPendiente] Omite alerta: Tratamiento dentro del margen de traslape (${diasFaltantes.toFixed(1)} días restantes, Margen: ${margenDias})`,
        );
        return null;
      }
    } else {
      console.log(
        `[ValidarPendiente] No se pudo extraer días de la duración: "${detalle.duracion}"`,
      );
    }
    // -----------------------------------------------

    const resultado = {
      recetaId: receta.id,
      establecimiento: receta.establecimiento.nombre,
      cantidadPendiente: detalle.cantidad - detalle.cantidadEntregada,
      creadaEn: receta.creadaEn,
      duracion: detalle.duracion,
    };

    console.log(`[ValidarPendiente] Retornando duplicado:`, resultado);
    return resultado;
  }

  async obtenerVigenciaReceta() {
    const param = await this.prisma.parametroSistema.findUnique({
      where: { clave: 'DIAS_VIGENCIA_RECETA' },
    });
    return param ? parseInt(param.valor) : 30;
  }

  async obtenerMargenTraslape() {
    const param = await this.prisma.parametroSistema.findUnique({
      where: { clave: 'MARGEN_DIAS_TRASLAPE_RECETA' },
    });
    return param ? parseInt(param.valor) : 2;
  }
}
