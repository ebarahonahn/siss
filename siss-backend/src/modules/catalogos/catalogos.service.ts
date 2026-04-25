import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CatalogosService {
  constructor(private prisma: PrismaService) {}

  async listarSexos() {
    return this.prisma.sexo.findMany({ orderBy: { nombre: 'asc' } });
  }

  async listarTiposSangre() {
    return this.prisma.tipoSangre.findMany({ orderBy: { id: 'asc' } });
  }

  async listarEscolaridades() {
    return this.prisma.escolaridad.findMany({ orderBy: { id: 'asc' } });
  }

  async listarEstadosCiviles() {
    return this.prisma.estadoCivil.findMany({ orderBy: { nombre: 'asc' } });
  }

  async listarOcupaciones() {
    return this.prisma.ocupacion.findMany({ orderBy: { nombre: 'asc' } });
  }

  async obtenerTodos() {
    const [sexos, tiposSangre, escolaridades, estadosCiviles, ocupaciones] =
      await Promise.all([
        this.listarSexos(),
        this.listarTiposSangre(),
        this.listarEscolaridades(),
        this.listarEstadosCiviles(),
        this.listarOcupaciones(),
      ]);

    return {
      sexos,
      tiposSangre,
      escolaridades,
      estadosCiviles,
      ocupaciones,
    };
  }
}
