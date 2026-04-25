import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';

const SELECT_MED = {
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
  activo: true,
  creadoEn: true,
  actualizadoEn: true,
  eliminadoEn: true,
  creadoPor: { select: { id: true, nombres: true, apellidos: true } },
  actualizadoPor: { select: { id: true, nombres: true, apellidos: true } },
  eliminadoPor: { select: { id: true, nombres: true, apellidos: true } },
};

// Filtro base: excluye registros con soft delete
const NO_ELIMINADO = { eliminadoEn: null };

@Injectable()
export class MedicamentosService {
  constructor(private prisma: PrismaService) {}

  async buscar(q: string, establecimientoId?: number) {
    if (!q || q.trim().length < 2) return [];
    const t = q.trim();

    const select: any = { ...SELECT_MED };
    if (establecimientoId) {
      select.inventario = {
        where: { establecimientoId, ...NO_ELIMINADO },
        select: { cantidadActual: true },
      };
    }

    const meds = await this.prisma.medicamento.findMany({
      where: {
        ...NO_ELIMINADO,
        activo: true,
        OR: [
          { nombreGenerico: { contains: t } },
          { nombreComercial: { contains: t } },
          { codigo: { contains: t } },
        ],
      },
      select,
      orderBy: { nombreGenerico: 'asc' },
      take: 20,
    });

    if (establecimientoId) {
      return meds.map((m: any) => {
        const stock =
          m.inventario?.reduce(
            (sum: number, i: any) => sum + i.cantidadActual,
            0,
          ) || 0;
        const { inventario, ...rest } = m;
        return { ...rest, stock };
      });
    }

    return meds;
  }

  async listar(pagina: number, limite: number, busqueda?: string) {
    const where: any = { ...NO_ELIMINADO };
    if (busqueda) {
      where.OR = [
        { nombreGenerico: { contains: busqueda } },
        { nombreComercial: { contains: busqueda } },
        { codigo: { contains: busqueda } },
        { grupoTerapeutico: { contains: busqueda } },
      ];
    }
    const [total, data] = await Promise.all([
      this.prisma.medicamento.count({ where }),
      this.prisma.medicamento.findMany({
        where,
        select: SELECT_MED,
        orderBy: [{ activo: 'desc' }, { nombreGenerico: 'asc' }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
    ]);
    return {
      data,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  async obtener(id: number) {
    const med = await this.prisma.medicamento.findFirst({
      where: { id, ...NO_ELIMINADO },
      select: SELECT_MED,
    });
    if (!med) throw new NotFoundException('Medicamento no encontrado');
    return med;
  }

  async crear(dto: CreateMedicamentoDto, usuarioId: number) {
    const existe = await this.prisma.medicamento.findFirst({
      where: { codigo: dto.codigo, ...NO_ELIMINADO },
    });
    if (existe)
      throw new ConflictException(
        `Ya existe un medicamento con el código ${dto.codigo}`,
      );
    return this.prisma.medicamento.create({
      data: { ...dto, creadoPorId: usuarioId },
      select: SELECT_MED,
    });
  }

  async actualizar(
    id: number,
    dto: Partial<CreateMedicamentoDto>,
    usuarioId: number,
  ) {
    await this.obtener(id);
    if (dto.codigo) {
      const dup = await this.prisma.medicamento.findFirst({
        where: { codigo: dto.codigo, id: { not: id }, ...NO_ELIMINADO },
      });
      if (dup)
        throw new ConflictException(`El código ${dto.codigo} ya está en uso`);
    }
    return this.prisma.medicamento.update({
      where: { id },
      data: { ...dto, actualizadoPorId: usuarioId },
      select: SELECT_MED,
    });
  }

  async toggleActivo(id: number, usuarioId: number) {
    const med = await this.obtener(id);
    return this.prisma.medicamento.update({
      where: { id },
      data: { activo: !med.activo, actualizadoPorId: usuarioId },
      select: SELECT_MED,
    });
  }

  async eliminar(id: number, usuarioId: number) {
    await this.obtener(id);
    return this.prisma.medicamento.update({
      where: { id },
      data: {
        eliminadoEn: new Date(),
        eliminadoPorId: usuarioId,
        activo: false,
      },
      select: SELECT_MED,
    });
  }

  async listarPorEstablecimiento(establecimientoId: number, busqueda?: string) {
    const where: any = {
      establecimientoId,
      cantidadActual: { gt: 0 },
      medicamento: { ...NO_ELIMINADO },
    };
    if (busqueda) {
      where.medicamento = {
        ...NO_ELIMINADO,
        OR: [
          { nombreGenerico: { contains: busqueda } },
          { nombreComercial: { contains: busqueda } },
          { codigo: { contains: busqueda } },
        ],
      };
    }
    return this.prisma.inventario.findMany({
      where,
      select: {
        id: true,
        cantidadActual: true,
        cantidadMinima: true,
        lote: true,
        fechaVencimiento: true,
        medicamento: { select: SELECT_MED },
      },
      orderBy: { medicamento: { nombreGenerico: 'asc' } },
    });
  }
}
