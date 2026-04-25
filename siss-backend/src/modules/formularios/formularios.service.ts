import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlantillaDto } from './dto/create-plantilla.dto';
import { CreateSeccionDto } from './dto/create-seccion.dto';
import { CreateCampoDto } from './dto/create-campo.dto';

@Injectable()
export class FormulariosService {
  constructor(private prisma: PrismaService) {}

  async crearPlantilla(dto: CreatePlantillaDto, usuarioId: number) {
    const especialidad = await this.prisma.especialidad.findUnique({
      where: { id: dto.especialidadId },
    });
    if (!especialidad) {
      throw new NotFoundException(
        `Especialidad ${dto.especialidadId} no encontrada`,
      );
    }

    const ultimaVersion = await this.prisma.plantillaFormulario.findFirst({
      where: { especialidadId: dto.especialidadId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    return this.prisma.plantillaFormulario.create({
      data: {
        especialidadId: dto.especialidadId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        version: (ultimaVersion?.version ?? 0) + 1,
        activa: false,
        creadoPorId: usuarioId,
      },
      include: {
        especialidad: { select: { nombre: true, codigo: true } },
        creadoPor: { select: { nombres: true, apellidos: true } },
        secciones: { include: { campos: true } },
      },
    });
  }

  async listarPlantillas(especialidadId?: number) {
    return this.prisma.plantillaFormulario.findMany({
      where: especialidadId ? { especialidadId } : undefined,
      include: {
        especialidad: { select: { nombre: true } },
        creadoPor: { select: { nombres: true, apellidos: true } },
        _count: { select: { secciones: true } },
      },
      orderBy: [{ especialidadId: 'asc' }, { version: 'desc' }],
    });
  }

  async obtenerPlantilla(id: number) {
    const plantilla = await this.prisma.plantillaFormulario.findUnique({
      where: { id },
      include: {
        especialidad: true,
        creadoPor: { select: { nombres: true, apellidos: true } },
        secciones: {
          orderBy: { orden: 'asc' },
          include: { campos: { orderBy: { orden: 'asc' } } },
        },
      },
    });

    if (!plantilla) {
      throw new NotFoundException(`Plantilla ${id} no encontrada`);
    }

    return plantilla;
  }

  async obtenerPlantillaActivaPorEspecialidad(especialidadId: number) {
    const plantilla = await this.prisma.plantillaFormulario.findFirst({
      where: { especialidadId, activa: true },
      include: {
        especialidad: true,
        secciones: {
          where: { visible: true },
          orderBy: { orden: 'asc' },
          include: {
            campos: {
              where: { visible: true },
              orderBy: { orden: 'asc' },
            },
          },
        },
      },
    });

    if (!plantilla) {
      throw new NotFoundException(
        `No hay plantilla activa para la especialidad ${especialidadId}`,
      );
    }

    return plantilla;
  }

  async activarPlantilla(id: number) {
    const plantilla = await this.prisma.plantillaFormulario.findUnique({
      where: { id },
    });
    if (!plantilla) throw new NotFoundException('Plantilla no encontrada');

    return this.prisma.$transaction([
      this.prisma.plantillaFormulario.updateMany({
        where: { especialidadId: plantilla.especialidadId },
        data: { activa: false },
      }),
      this.prisma.plantillaFormulario.update({
        where: { id },
        data: { activa: true },
      }),
    ]);
  }

  async duplicarPlantilla(id: number, usuarioId: number) {
    const original = await this.obtenerPlantilla(id);

    const ultimaVersion = await this.prisma.plantillaFormulario.findFirst({
      where: { especialidadId: original.especialidadId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    return this.prisma.plantillaFormulario.create({
      data: {
        especialidadId: original.especialidadId,
        nombre: `${original.nombre} (copia)`,
        descripcion: original.descripcion,
        version: (ultimaVersion?.version ?? 0) + 1,
        activa: false,
        creadoPorId: usuarioId,
        secciones: {
          create: original.secciones.map((sec) => ({
            nombre: sec.nombre,
            descripcion: sec.descripcion,
            orden: sec.orden,
            colapsable: sec.colapsable,
            campos: {
              create: sec.campos.map((campo) => ({
                tipo: campo.tipo,
                etiqueta: campo.etiqueta,
                clave: campo.clave,
                placeholder: campo.placeholder,
                ayuda: campo.ayuda,
                requerido: campo.requerido,
                orden: campo.orden,
                ancho: campo.ancho,
                configuracion: campo.configuracion ?? undefined,
                condicionVisibilidad: campo.condicionVisibilidad ?? undefined,
              })),
            },
          })),
        },
      },
      include: { secciones: { include: { campos: true } } },
    });
  }

  async eliminarPlantilla(id: number) {
    const plantilla = await this.prisma.plantillaFormulario.findUnique({
      where: { id },
    });
    if (!plantilla) throw new NotFoundException('Plantilla no encontrada');

    if (plantilla.activa) {
      throw new BadRequestException(
        'No se puede eliminar una plantilla activa. Desactívela primero.',
      );
    }

    return this.prisma.plantillaFormulario.delete({ where: { id } });
  }

  async actualizarPlantilla(id: number, dto: Partial<CreatePlantillaDto>) {
    const plantilla = await this.prisma.plantillaFormulario.findUnique({
      where: { id },
    });
    if (!plantilla)
      throw new NotFoundException(`Plantilla ${id} no encontrada`);

    if (dto.especialidadId) {
      const especialidad = await this.prisma.especialidad.findUnique({
        where: { id: dto.especialidadId },
      });
      if (!especialidad) {
        throw new NotFoundException(
          `Especialidad ${dto.especialidadId} no encontrada`,
        );
      }
    }

    return this.prisma.plantillaFormulario.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        especialidadId: dto.especialidadId,
      },
      include: {
        especialidad: { select: { nombre: true } },
      },
    });
  }

  async crearSeccion(dto: CreateSeccionDto) {
    const ultimoOrden = await this.prisma.seccionFormulario.findFirst({
      where: { plantillaId: dto.plantillaId },
      orderBy: { orden: 'desc' },
      select: { orden: true },
    });

    return this.prisma.seccionFormulario.create({
      data: {
        plantillaId: dto.plantillaId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        colapsable: dto.colapsable ?? false,
        orden: (ultimoOrden?.orden ?? -1) + 1,
      },
      include: { campos: true },
    });
  }

  async actualizarSeccion(id: number, datos: Partial<CreateSeccionDto>) {
    const seccion = await this.prisma.seccionFormulario.findUnique({
      where: { id },
    });
    if (!seccion) throw new NotFoundException(`Sección ${id} no encontrada`);
    const { plantillaId: _omit, ...rest } = datos as any;
    return this.prisma.seccionFormulario.update({ where: { id }, data: rest });
  }

  async eliminarSeccion(id: number) {
    const seccion = await this.prisma.seccionFormulario.findUnique({
      where: { id },
    });
    if (!seccion) throw new NotFoundException(`Sección ${id} no encontrada`);
    return this.prisma.seccionFormulario.delete({ where: { id } });
  }

  async reordenarSecciones(items: { id: number; orden: number }[]) {
    const ops = items.map(({ id, orden }) =>
      this.prisma.seccionFormulario.update({ where: { id }, data: { orden } }),
    );
    return this.prisma.$transaction(ops);
  }

  async crearCampo(dto: CreateCampoDto) {
    const clave = dto.clave ?? this.generarClave(dto.etiqueta);

    const claveExiste = await this.prisma.campoFormulario.findFirst({
      where: { clave, seccion: { plantillaId: dto.plantillaId } },
    });

    if (claveExiste) {
      throw new ConflictException(
        `Ya existe un campo con la clave "${clave}" en esta plantilla`,
      );
    }

    const ultimoOrden = await this.prisma.campoFormulario.findFirst({
      where: { seccionId: dto.seccionId },
      orderBy: { orden: 'desc' },
      select: { orden: true },
    });

    return this.prisma.campoFormulario.create({
      data: {
        seccionId: dto.seccionId,
        tipo: dto.tipo,
        etiqueta: dto.etiqueta,
        clave,
        placeholder: dto.placeholder,
        ayuda: dto.ayuda,
        requerido: dto.requerido ?? false,
        orden: (ultimoOrden?.orden ?? -1) + 1,
        ancho: dto.ancho ?? 'COMPLETO',
        configuracion: dto.configuracion ?? undefined,
        condicionVisibilidad: dto.condicionVisibilidad ?? undefined,
      },
    });
  }

  async actualizarCampo(id: number, datos: Partial<CreateCampoDto>) {
    const campo = await this.prisma.campoFormulario.findUnique({
      where: { id },
    });
    if (!campo) throw new NotFoundException(`Campo ${id} no encontrado`);

    const { plantillaId: _p, seccionId: _s, ...datosLimpios } = datos as any;
    return this.prisma.campoFormulario.update({
      where: { id },
      data: datosLimpios,
    });
  }

  async eliminarCampo(id: number) {
    const campo = await this.prisma.campoFormulario.findUnique({
      where: { id },
    });
    if (!campo) throw new NotFoundException(`Campo ${id} no encontrado`);

    const tieneRespuestas = await this.prisma.respuestaFormulario.count({
      where: {
        plantilla: { secciones: { some: { campos: { some: { id } } } } },
      },
    });

    if (tieneRespuestas > 0) {
      return this.prisma.campoFormulario.update({
        where: { id },
        data: { visible: false },
      });
    }

    return this.prisma.campoFormulario.delete({ where: { id } });
  }

  async reordenarCampos(items: { id: number; orden: number }[]) {
    const ops = items.map(({ id, orden }) =>
      this.prisma.campoFormulario.update({ where: { id }, data: { orden } }),
    );
    return this.prisma.$transaction(ops);
  }

  async guardarRespuesta(
    historiaId: number,
    plantillaId: number,
    respuestas: Record<string, any>,
    completado = true,
  ) {
    return this.prisma.respuestaFormulario.upsert({
      where: { historiaId },
      create: { historiaId, plantillaId, respuestas, completado },
      update: { respuestas, completado, actualizadoEn: new Date() },
    });
  }

  async obtenerRespuesta(historiaId: number) {
    return this.prisma.respuestaFormulario.findUnique({
      where: { historiaId },
      include: {
        plantilla: {
          select: {
            nombre: true,
            version: true,
            especialidad: { select: { nombre: true } },
          },
        },
      },
    });
  }

  private generarClave(etiqueta: string): string {
    return etiqueta
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }
}
