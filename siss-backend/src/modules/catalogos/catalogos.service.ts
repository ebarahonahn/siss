import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TipoCita, EstadoCita } from '@prisma/client';

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

  async listarTiposCita() {
    return Object.values(TipoCita);
  }

  async listarEstadosCita() {
    return Object.values(EstadoCita);
  }

  async obtenerTodos() {
    const [sexos, tiposSangre, escolaridades, estadosCiviles, ocupaciones, tiposCita, estadosCita] =
      await Promise.all([
        this.listarSexos(),
        this.listarTiposSangre(),
        this.listarEscolaridades(),
        this.listarEstadosCiviles(),
        this.listarOcupaciones(),
        this.listarTiposCita(),
        this.listarEstadosCita(),
      ]);

    return {
      sexos,
      tiposSangre,
      escolaridades,
      estadosCiviles,
      ocupaciones,
      tiposCita,
      estadosCita,
    };
  }
}
