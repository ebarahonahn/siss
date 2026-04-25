import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';

@Injectable()
export class PacientesService {
  constructor(private prisma: PrismaService) {}

  async crear(
    dto: CreatePacienteDto,
    usuarioId: number,
    establecimientoId: number,
  ) {
    const existe = await this.prisma.paciente.findUnique({
      where: { dni: dto.dni },
    });

    if (existe) {
      throw new ConflictException(`Ya existe un paciente con DNI ${dto.dni}`);
    }

    const numeroExpediente =
      await this.generarNumeroExpediente(establecimientoId);

    return this.prisma.paciente.create({
      data: {
        ...dto,
        nombres: dto.nombres.toUpperCase(),
        apellidos: dto.apellidos.toUpperCase(),
        fechaNacimiento: new Date(dto.fechaNacimiento),
        numeroExpediente,
        establecimientoId,
        creadoPorId: usuarioId,
        actualizadoPorId: usuarioId,
      },
    });
  }

  async buscar(
    termino: string,
    pagina = 1,
    limite = 20,
    establecimientoId?: number,
    rol?: string,
  ) {
    const skip = (pagina - 1) * limite;

    const filtro: any = {
      OR: [
        { nombres: { contains: termino } },
        { apellidos: { contains: termino } },
        { dni: { contains: termino } },
        { numeroExpediente: { contains: termino } },
      ],
      activo: true,
    };

    // Scoping para ADMIN_ESTABLECIMIENTO
    if (rol === 'ADMIN_ESTABLECIMIENTO' && establecimientoId) {
      filtro.establecimientoId = establecimientoId;
    }

    const [total, pacientes] = await Promise.all([
      this.prisma.paciente.count({ where: filtro }),
      this.prisma.paciente.findMany({
        where: filtro,
        select: {
          id: true,
          numeroExpediente: true,
          nombres: true,
          apellidos: true,
          dni: true,
          fechaNacimiento: true,
          telefono: true,
          establecimientoId: true,
          sexoId: true,
          tipoSangreId: true,
          departamentoId: true,
          municipioId: true,
          escolaridadId: true,
          ocupacionId: true,
          estadoCivilId: true,
          direccion: true,
          sexo: { select: { nombre: true } },
          tipoSangre: { select: { nombre: true } },
          departamento: { select: { nombre: true } },
          municipio: { select: { nombre: true } },
          establecimiento: { select: { nombre: true } },
        },
        skip,
        take: limite,
        orderBy: { apellidos: 'asc' },
      }),
    ]);

    return {
      data: pacientes,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  async obtenerPerfil(id: number) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id },
      include: {
        alergias: true,
        citas: {
          take: 5,
          orderBy: { fechaHora: 'desc' },
          include: {
            medico: {
              select: {
                nombres: true,
                apellidos: true,
                especialidad: { select: { nombre: true } },
              },
            },
          },
        },
        historialClinico: {
          take: 10,
          orderBy: { fecha: 'desc' },
          select: {
            id: true,
            fecha: true,
            analisis: true,
            medico: { select: { nombres: true, apellidos: true } },
            diagnosticos: {
              select: { codigoCIE10: true, descripcion: true, tipo: true },
            },
          },
        },
        medicamentosActivos: {
          where: { fin: null },
          include: { paciente: false },
        },
      },
    });

    if (!paciente) {
      throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
    }

    return paciente;
  }

  async actualizar(
    id: number,
    datos: Partial<CreatePacienteDto>,
    usuarioId: number,
    establecimientoId: number,
  ) {
    const existe = await this.prisma.paciente.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException(`Paciente ${id} no encontrado`);

    // Solo se puede editar un paciente que pertenezca al establecimiento actual
    if (existe.establecimientoId !== establecimientoId) {
      throw new ForbiddenException(
        'No tiene permiso para modificar pacientes registrados en otro establecimiento',
      );
    }

    // Si se está cambiando el DNI, verificar que no esté en uso por otro paciente
    if (datos.dni && datos.dni !== existe.dni) {
      const duplicado = await this.prisma.paciente.findFirst({
        where: {
          dni: datos.dni,
          id: { not: id },
        },
      });
      if (duplicado) {
        throw new ConflictException(
          `Ya existe otro paciente registrado con el DNI ${datos.dni}`,
        );
      }
    }

    // Preparar datos para la actualización
    const dataUpdate: any = {
      ...datos,
      actualizadoPorId: usuarioId,
    };

    // Asegurar que fechaNacimiento sea un objeto Date
    if (datos.fechaNacimiento) {
      dataUpdate.fechaNacimiento = new Date(datos.fechaNacimiento);
    }

    if (datos.nombres) {
      dataUpdate.nombres = datos.nombres.toUpperCase();
    }

    if (datos.apellidos) {
      dataUpdate.apellidos = datos.apellidos.toUpperCase();
    }

    return this.prisma.paciente.update({
      where: { id },
      data: dataUpdate,
    });
  }

  async eliminar(id: number, usuarioId: number, establecimientoId: number) {
    const existe = await this.prisma.paciente.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException(`Paciente ${id} no encontrado`);

    // Solo se puede eliminar/archivar un paciente del mismo establecimiento
    if (existe.establecimientoId !== establecimientoId) {
      throw new ForbiddenException(
        'No tiene permiso para archivar pacientes registrados en otro establecimiento',
      );
    }

    return this.prisma.paciente.update({
      where: { id },
      data: {
        activo: false,
        eliminadoEn: new Date(),
        eliminadoPorId: usuarioId,
        actualizadoPorId: usuarioId,
      },
    });
  }

  private async generarNumeroExpediente(
    establecimientoId: number,
  ): Promise<string> {
    const anio = new Date().getFullYear();
    const total = await this.prisma.paciente.count({
      where: { establecimientoId },
    });
    const secuencia = String(total + 1).padStart(6, '0');
    return `${establecimientoId}-${anio}-${secuencia}`;
  }
}
