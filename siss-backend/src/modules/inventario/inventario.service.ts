import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DateUtils } from '../../common/utils/date-utils';
import {
  AsignarMedicamentoDto,
  ActualizarInventarioDto,
  CargaMasivaInventarioDto,
} from './dto/inventario.dto';

const SELECT_INV = {
  id: true,
  medicamentoId: true,
  establecimientoId: true,
  establecimiento: { select: { id: true, nombre: true, codigo: true } },
  cantidadActual: true,
  cantidadMinima: true,
  lote: true,
  fechaVencimiento: true,
  ubicacion: true,
  activo: true,
  creadoEn: true,
  actualizadoEn: true,
  eliminadoEn: true,
  medicamento: {
    select: {
      id: true,
      codigo: true,
      nombreGenerico: true,
      nombreComercial: true,
      presentacion: true,
      concentracion: true,
      via: true,
      grupoTerapeutico: true,
      requiereReceta: true,
      esControlado: true,
    },
  },
  creadoPor: { select: { id: true, nombres: true, apellidos: true } },
  actualizadoPor: { select: { id: true, nombres: true, apellidos: true } },
  eliminadoPor: { select: { id: true, nombres: true, apellidos: true } },
};

const NO_ELIMINADO = { eliminadoEn: null };

@Injectable()
export class InventarioService {
  constructor(private prisma: PrismaService) {}

  async listar(establecimientoId: number, busqueda?: string) {
    const where: any = { establecimientoId, ...NO_ELIMINADO };
    if (busqueda) {
      where.medicamento = {
        OR: [
          { nombreGenerico: { contains: busqueda } },
          { nombreComercial: { contains: busqueda } },
          { codigo: { contains: busqueda } },
          { grupoTerapeutico: { contains: busqueda } },
        ],
      };
    }
    return this.prisma.inventario.findMany({
      where,
      select: SELECT_INV,
      orderBy: { medicamento: { nombreGenerico: 'asc' } },
    });
  }

  async listarTodos(busqueda?: string, establecimientoId?: number) {
    console.log('listado admin:', { busqueda, establecimientoId });
    const where: any = { ...NO_ELIMINADO };
    if (establecimientoId) where.establecimientoId = establecimientoId;
    if (busqueda) {
      where.medicamento = {
        OR: [
          { nombreGenerico: { contains: busqueda } },
          { nombreComercial: { contains: busqueda } },
          { codigo: { contains: busqueda } },
        ],
      };
    }
    const res = await this.prisma.inventario.findMany({
      where,
      select: {
        ...SELECT_INV,
        establecimiento: { select: { id: true, nombre: true, codigo: true } },
      },
      orderBy: [
        { establecimientoId: 'asc' },
        { medicamento: { nombreGenerico: 'asc' } },
      ],
    });
    console.log('Resultados encontrados:', res.length);
    return res;
  }

  async obtener(id: number) {
    const inv = await this.prisma.inventario.findFirst({
      where: { id, ...NO_ELIMINADO },
      select: SELECT_INV,
    });
    if (!inv)
      throw new NotFoundException('Registro de inventario no encontrado');
    return inv;
  }

  async asignar(dto: AsignarMedicamentoDto, usuarioId: number) {
    const existe = await this.prisma.inventario.findFirst({
      where: {
        medicamentoId: dto.medicamentoId,
        establecimientoId: dto.establecimientoId,
        lote: dto.lote ?? null,
        ...NO_ELIMINADO,
      },
    });
    if (existe) {
      throw new ConflictException(
        'Ya existe un registro de inventario para este medicamento, establecimiento y lote',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const now = DateUtils.getLiteralNow();
      const configuracion = await tx.inventario.findFirst({
        where: { medicamentoId: dto.medicamentoId, establecimientoId: dto.establecimientoId, ...NO_ELIMINADO },
        orderBy: { cantidadMinima: 'desc' },
      });
      const inv = await tx.inventario.create({
        data: {
          medicamentoId: dto.medicamentoId,
          establecimientoId: dto.establecimientoId,
          cantidadActual: dto.cantidadActual,
          cantidadMinima: configuracion?.cantidadMinima ?? dto.cantidadMinima,
          lote: dto.lote,
          fechaVencimiento: dto.fechaVencimiento
            ? new Date(dto.fechaVencimiento)
            : null,
          ubicacion: dto.ubicacion,
          creadoPorId: usuarioId,
          creadoEn: now,
          actualizadoEn: now,
        },
        select: SELECT_INV,
      });

      await tx.movimientoInventario.create({
        data: {
          inventarioId: inv.id,
          tipo: 'ENTRADA',
          cantidad: inv.cantidadActual,
          usuarioId,
          motivo: 'Asignación inicial de medicamento',
          fecha: now,
        },
      });

      return inv;
    });
  }

  async actualizar(
    id: number,
    dto: ActualizarInventarioDto,
    usuarioId: number,
  ) {
    const actual = await this.obtener(id);
    if (dto.lote !== undefined && dto.lote !== actual.lote) {
      throw new BadRequestException('El número de lote no puede modificarse. Registre un nuevo lote.');
    }
    const { motivoAjuste, cantidadMinima, lote, ...cambios } = dto;
    if (dto.cantidadActual !== undefined && dto.cantidadActual !== actual.cantidadActual && !motivoAjuste?.trim()) {
      throw new BadRequestException('Debe indicar el motivo del ajuste de cantidad.');
    }

    return this.prisma.$transaction(async (tx) => {
      const now = DateUtils.getLiteralNow();
      const updated = await tx.inventario.update({
        where: { id },
        data: {
          ...cambios,
          fechaVencimiento: dto.fechaVencimiento
            ? new Date(dto.fechaVencimiento)
            : undefined,
          actualizadoPorId: usuarioId,
          actualizadoEn: now,
        },
        select: SELECT_INV,
      });

      // Registrar movimiento si cambió la cantidad
      if (
        dto.cantidadActual !== undefined &&
        dto.cantidadActual !== actual.cantidadActual
      ) {
        const diferencia = dto.cantidadActual - actual.cantidadActual;
        await tx.movimientoInventario.create({
          data: {
            inventarioId: id,
            tipo: 'AJUSTE',
            cantidad: diferencia,
            usuarioId,
            motivo: motivoAjuste!.trim(),
            fecha: now,
          },
        });
      }

      if (cantidadMinima !== undefined) {
        await tx.inventario.updateMany({
          where: { medicamentoId: actual.medicamentoId, establecimientoId: actual.establecimientoId, ...NO_ELIMINADO },
          data: { cantidadMinima, actualizadoPorId: usuarioId, actualizadoEn: now },
        });
      }
      return { ...updated, cantidadMinima: cantidadMinima ?? updated.cantidadMinima };
    });
  }

  async eliminar(id: number, usuarioId: number) {
    await this.obtener(id);
    const now = DateUtils.getLiteralNow();
    return this.prisma.inventario.update({
      where: { id },
      data: {
        eliminadoEn: now,
        actualizadoEn: now,
        eliminadoPorId: usuarioId,
        actualizadoPorId: usuarioId,
        activo: false,
      },
      select: SELECT_INV,
    });
  }

  async stockBajo(establecimientoId: number) {
    return this.prisma.inventario
      .findMany({
        where: {
          establecimientoId,
          ...NO_ELIMINADO,
          activo: true,
        },
        select: SELECT_INV,
        orderBy: { cantidadActual: 'asc' },
      })
      .then((items) => {
        const grupos = new Map<number, (typeof items)[number]>();
        for (const item of items) {
          const grupo = grupos.get(item.medicamentoId);
          if (grupo) {
            grupo.cantidadActual += item.cantidadActual;
            grupo.cantidadMinima = Math.max(grupo.cantidadMinima, item.cantidadMinima);
          } else grupos.set(item.medicamentoId, { ...item, lote: null, fechaVencimiento: null });
        }
        return [...grupos.values()].filter(i => i.cantidadActual <= i.cantidadMinima);
      });
  }

  async cargaMasiva(dto: CargaMasivaInventarioDto, usuarioId: number) {
    // 0. Validar establecimiento
    const establecimiento = await this.prisma.establecimiento.findUnique({
      where: { id: dto.establecimientoId },
    });
    if (!establecimiento) {
      throw new NotFoundException(
        `El establecimiento con ID ${dto.establecimientoId} no existe.`,
      );
    }

    const codigos = dto.items.map((i) => i.codigoMedicamento);

    // 1. Mapear códigos a IDs de medicamentos existentes
    const medicamentos = await this.prisma.medicamento.findMany({
      where: { codigo: { in: codigos }, ...NO_ELIMINADO },
      select: { id: true, codigo: true },
    });

    const medMap = new Map(medicamentos.map((m) => [m.codigo, m.id]));
    const resultados = {
      total: dto.items.length,
      exitosos: 0,
      fallidos: 0,
      errores: [] as string[],
    };

    // 2. Procesar cada item
    for (const item of dto.items) {
      const medicamentoId = medMap.get(item.codigoMedicamento);

      if (!medicamentoId) {
        resultados.fallidos++;
        resultados.errores.push(
          `Código '${item.codigoMedicamento}' no encontrado`,
        );
        continue;
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          const now = DateUtils.getLiteralNow();
          const configuracion = await tx.inventario.findFirst({
            where: { medicamentoId, establecimientoId: dto.establecimientoId, ...NO_ELIMINADO },
            orderBy: { cantidadMinima: 'desc' },
          });
          const inv = await tx.inventario.upsert({
            where: {
              medicamentoId_establecimientoId_lote: {
                medicamentoId,
                establecimientoId: dto.establecimientoId,
                lote: item.lote || (null as any),
              },
            },
            update: {
              cantidadActual: { increment: item.cantidadActual },
              cantidadMinima: configuracion?.cantidadMinima ?? item.cantidadMinima,
              fechaVencimiento: item.fechaVencimiento
                ? new Date(item.fechaVencimiento)
                : undefined,
              ubicacion: item.ubicacion,
              actualizadoPorId: usuarioId,
              actualizadoEn: now,
              activo: true,
              eliminadoEn: null,
            },
            create: {
              medicamentoId,
              establecimientoId: dto.establecimientoId,
              cantidadActual: item.cantidadActual,
              cantidadMinima: configuracion?.cantidadMinima ?? item.cantidadMinima,
              lote: item.lote,
              fechaVencimiento: item.fechaVencimiento
                ? new Date(item.fechaVencimiento)
                : undefined,
              ubicacion: item.ubicacion,
              creadoPorId: usuarioId,
              creadoEn: now,
              actualizadoEn: now,
            },
          });

          await tx.movimientoInventario.create({
            data: {
              inventarioId: inv.id,
              tipo: 'ENTRADA',
              cantidad: item.cantidadActual,
              usuarioId,
              motivo: 'Carga masiva de inventario',
              fecha: now,
            },
          });
        });

        resultados.exitosos++;
      } catch (e: any) {
        resultados.fallidos++;
        resultados.errores.push(`${item.codigoMedicamento}: ${e.message}`);
      }
    }

    return resultados;
  }

  async listarMovimientos(inventarioId: number) {
    await this.obtener(inventarioId);
    return this.prisma.movimientoInventario.findMany({
      where: { inventarioId },
      include: {
        usuario: { select: { id: true, nombres: true, apellidos: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async productosConHistorial(establecimientoId: number) {
    if (!establecimientoId) throw new BadRequestException('Debe seleccionar un establecimiento');
    const lotes = await this.prisma.inventario.findMany({
      where: { establecimientoId }, select: SELECT_INV,
      orderBy: { medicamento: { nombreGenerico: 'asc' } },
    });
    const productos = new Map<number, any>();
    for (const lote of lotes) {
      const producto = productos.get(lote.medicamentoId) ?? {
        medicamentoId: lote.medicamentoId, medicamento: lote.medicamento, cantidadActual: 0,
      };
      if (lote.activo && !lote.eliminadoEn) producto.cantidadActual += lote.cantidadActual;
      productos.set(lote.medicamentoId, producto);
    }
    return [...productos.values()];
  }

  async movimientosPorProducto(medicamentoId: number, establecimientoId: number) {
    if (!establecimientoId) throw new BadRequestException('Debe seleccionar un establecimiento');
    return this.prisma.movimientoInventario.findMany({
      where: { inventario: { medicamentoId, establecimientoId } },
      include: {
        usuario: { select: { id: true, nombres: true, apellidos: true } },
        inventario: { select: { lote: true } },
      },
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
    });
  }

  async buscarExistenciasGlobal(busqueda: string) {
    if (!busqueda || busqueda.length < 2) return [];

    const items = await this.prisma.inventario.findMany({
      where: {
        ...NO_ELIMINADO,
        activo: true,
        medicamento: {
          OR: [
            { nombreGenerico: { contains: busqueda } },
            { nombreComercial: { contains: busqueda } },
            { codigo: { contains: busqueda } },
          ],
        },
      },
      select: {
        cantidadActual: true,
        establecimiento: {
          select: {
            id: true,
            nombre: true,
            departamento: { select: { nombre: true } },
          },
        },
        medicamento: {
          select: {
            id: true,
            codigo: true,
            nombreGenerico: true,
            nombreComercial: true,
            presentacion: true,
            concentracion: true,
          },
        },
      },
      orderBy: { establecimiento: { nombre: 'asc' } },
    });

    // Agrupar por medicamento y luego por establecimiento para evitar duplicados por lotes
    const agrupado: any[] = [];

    items.forEach((item) => {
      let med = agrupado.find((m) => m.medicamentoId === item.medicamento.id);
      if (!med) {
        med = {
          medicamentoId: item.medicamento.id,
          codigo: item.medicamento.codigo,
          nombre: item.medicamento.nombreGenerico,
          comercial: item.medicamento.nombreComercial,
          presentacion: item.medicamento.presentacion,
          concentracion: item.medicamento.concentracion,
          existencias: [],
        };
        agrupado.push(med);
      }

      let est = med.existencias.find(
        (e: any) => e.id === item.establecimiento.id,
      );
      if (!est) {
        est = {
          id: item.establecimiento.id,
          nombre: item.establecimiento.nombre,
          departamento: item.establecimiento.departamento?.nombre,
          cantidad: 0,
        };
        med.existencias.push(est);
      }
      est.cantidad += item.cantidadActual;
    });

    return agrupado;
  }
}
