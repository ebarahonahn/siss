import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DiagnosticosService {
  constructor(private prisma: PrismaService) {}

  async buscar(q: string) {
    if (!q || q.trim().length < 2) return [];
    const termino = q.trim();
    return this.prisma.catDiagnostico.findMany({
      where: {
        activo: true,
        OR: [
          { codigo: { contains: termino } },
          { descripcion: { contains: termino } },
        ],
      },
      orderBy: { codigo: 'asc' },
      take: 20,
    });
  }

  async listar(pagina: number, limite: number, busqueda?: string) {
    const where: any = {};
    if (busqueda) {
      where.OR = [
        { codigo: { contains: busqueda } },
        { descripcion: { contains: busqueda } },
        { capitulo: { contains: busqueda } },
      ];
    }
    const [total, data] = await Promise.all([
      this.prisma.catDiagnostico.count({ where }),
      this.prisma.catDiagnostico.findMany({
        where,
        orderBy: { codigo: 'asc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
    ]);
    return { data, total, pagina, limite };
  }

  async crear(dto: { codigo: string; descripcion: string; capitulo?: string }) {
    return this.prisma.catDiagnostico.create({ data: dto });
  }

  async actualizar(
    id: number,
    dto: {
      codigo?: string;
      descripcion?: string;
      capitulo?: string;
      activo?: boolean;
    },
  ) {
    return this.prisma.catDiagnostico.update({ where: { id }, data: dto });
  }
}
