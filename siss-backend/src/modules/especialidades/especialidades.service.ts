import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEspecialidadDto {
  @IsString() @IsNotEmpty() codigo: string;
  @IsString() @IsNotEmpty() nombre: string;
  @IsString() @IsOptional() descripcion?: string;
}

@Injectable()
export class EspecialidadesService {
  constructor(private prisma: PrismaService) {}

  async listar(establecimientoId?: number) {
    const where: any = { activa: true };
    
    if (establecimientoId) {
      // Filtrar especialidades que tengan médicos asignados en este establecimiento
      where.OR = [
        { usuarios: { some: { establecimientoId, activo: true } } },
        { asignaciones: { some: { establecimientoId, activo: true } } }
      ];
    }

    return this.prisma.especialidad.findMany({
      where,
      include: {
        _count: { select: { usuarios: true, plantillas: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async crear(dto: CreateEspecialidadDto, usuarioId: number) {
    const existe = await this.prisma.especialidad.findUnique({
      where: { codigo: dto.codigo },
    });
    if (existe) {
      throw new ConflictException(
        `Ya existe la especialidad con código ${dto.codigo}`,
      );
    }

    return this.prisma.especialidad.create({
      data: { ...dto, creadoPorId: usuarioId },
    });
  }

  async actualizar(
    id: number,
    datos: Partial<CreateEspecialidadDto>,
    usuarioId: number,
  ) {
    const esp = await this.prisma.especialidad.findUnique({ where: { id } });
    if (!esp) throw new NotFoundException(`Especialidad ${id} no encontrada`);
    return this.prisma.especialidad.update({
      where: { id },
      data: { ...datos, actualizadoPorId: usuarioId },
    });
  }
}
