import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoginImagesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.imagenLogin.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
      select: {
        id: true,
        nombre: true,
        titulo: true,
        descripcion: true,
        mimetype: true,
        orden: true,
        creadoEn: true,
      },
    });
  }

  async findAllManagement() {
    return this.prisma.imagenLogin.findMany({
      orderBy: { orden: 'asc' },
      select: {
        id: true,
        nombre: true,
        titulo: true,
        descripcion: true,
        mimetype: true,
        activo: true,
        orden: true,
        creadoEn: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.imagenLogin.findUnique({
      where: { id },
    });
  }

  async create(data: {
    nombre: string;
    titulo?: string;
    descripcion?: string;
    mimetype: string;
    datos: Buffer;
    orden?: number;
  }) {
    return this.prisma.imagenLogin.create({
      data: {
        nombre: data.nombre,
        titulo: data.titulo,
        descripcion: data.descripcion,
        mimetype: data.mimetype,
        datos: data.datos as any,
        orden: data.orden || 0,
      },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.imagenLogin.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.imagenLogin.delete({
      where: { id },
    });
  }
}
