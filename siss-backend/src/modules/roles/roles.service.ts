import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarRolDto } from './dto/actualizar-rol.dto';
import { CrearRolDto } from './dto/crear-rol.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async listar() {
    const roles = await this.prisma.rol.findMany({
      include: { _count: { select: { usuarios: true } } },
      orderBy: { id: 'asc' },
    });
    return roles.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      permisos: r.permisos,
      totalUsuarios: r._count.usuarios,
    }));
  }

  async obtener(id: number) {
    const rol = await this.prisma.rol.findUnique({
      where: { id },
      include: { _count: { select: { usuarios: true } } },
    });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    return {
      id: rol.id,
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      permisos: rol.permisos,
      totalUsuarios: rol._count.usuarios,
    };
  }

  async actualizar(id: number, dto: ActualizarRolDto) {
    await this.obtener(id);

    // No permitir editar permisos del rol ADMIN (all: true)
    const rol = await this.prisma.rol.findUnique({ where: { id } });
    if (rol?.nombre === 'ADMIN' && dto.permisos !== undefined) {
      throw new BadRequestException(
        'Los permisos del rol ADMIN no pueden modificarse',
      );
    }

    return this.prisma.rol.update({
      where: { id },
      data: {
        descripcion: dto.descripcion,
        permisos: dto.permisos as any,
      },
    });
  }

  async crear(dto: CrearRolDto) {
    const existe = await this.prisma.rol.findUnique({
      where: { nombre: dto.nombre },
    });
    if (existe) {
      throw new BadRequestException(`El rol '${dto.nombre}' ya existe`);
    }

    const rol = await this.prisma.rol.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion || '',
        permisos: {},
      },
    });

    return {
      id: rol.id,
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      permisos: rol.permisos,
      totalUsuarios: 0,
    };
  }
}
