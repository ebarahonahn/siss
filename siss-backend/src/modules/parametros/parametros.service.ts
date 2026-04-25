import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ParametrosService {
  constructor(private prisma: PrismaService) {}

  async obtenerPorClave(clave: string) {
    const parametro = await this.prisma.parametroSistema.findUnique({
      where: { clave },
    });

    if (!parametro) {
      throw new NotFoundException(`Parámetro ${clave} no encontrado`);
    }

    return parametro;
  }

  async listarTodos() {
    return this.prisma.parametroSistema.findMany();
  }
}
