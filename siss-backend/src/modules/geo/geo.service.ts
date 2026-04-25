import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  async listarDepartamentos() {
    return this.prisma.departamento.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async listarMunicipiosPorDepto(departamentoId: number) {
    return this.prisma.municipio.findMany({
      where: { departamentoId },
      orderBy: { nombre: 'asc' },
    });
  }
}
