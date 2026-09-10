import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { DateUtils } from '../../common/utils/date-utils';
import { periodoPrescrito } from './tratamientos';

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
    sexoId?: number,
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

    if (sexoId) {
      filtro.sexoId = sexoId;
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
          latitud: true,
          longitud: true,
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
      include: this.getPerfilInclude(),
    });

    if (!paciente) {
      throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
    }

    return paciente;
  }

  async obtenerPerfilPorDni(dni: string) {
    if (!dni) throw new BadRequestException('DNI no proporcionado');

    console.log(`[PACIENTES] Buscando perfil para DNI: ${dni}...`);
    try {
      const paciente = await this.prisma.paciente.findUnique({
        where: { dni },
        include: this.getPerfilInclude(),
      });
      console.log(`[PACIENTES] Resultado de búsqueda: ${paciente ? 'Encontrado' : 'No encontrado'}`);

      if (!paciente) {
        throw new NotFoundException(`No se encontró un registro de paciente para el DNI ${dni}`);
      }

      const detalles = await this.prisma.detalleReceta.findMany({
        where: { receta: { pacienteId: paciente.id, estado: { not: 'CANCELADA' } } },
        include: { medicamento: true, receta: { include: { historia: { select: { fecha: true } } } } },
        orderBy: { id: 'desc' },
      });
      const hoy = DateUtils.getHoyLocalString();
      const tratamientosActuales = [
        ...paciente.medicamentosActivos.map(m => ({
          nombre: m.medicamento.nombreGenerico,
          dosis: m.dosis, frecuencia: m.frecuencia,
          inicio: m.inicio.toISOString().slice(0, 10),
          fin: m.fin?.toISOString().slice(0, 10) ?? null,
          indicaciones: null as string | null, recetaId: null as number | null,
          periodoPrescrito: false,
        })),
        ...detalles.flatMap(d => {
          const periodo = periodoPrescrito(d.receta.historia.fecha, d.duracion, hoy);
          return periodo ? [{
            nombre: d.medicamento.nombreGenerico,
            dosis: d.dosis, frecuencia: d.frecuencia, ...periodo,
            indicaciones: d.indicaciones, recetaId: d.recetaId,
            periodoPrescrito: true,
          }] : [];
        }),
      ];
      return { ...paciente, tratamientosActuales };
    } catch (error) {
      console.error(`[PACIENTES] Error al buscar perfil para DNI ${dni}:`, error);
      throw error;
    }
  }

  private getPerfilInclude() {
    return {
      alergias: true,
      sexo: { select: { nombre: true } },
      tipoSangre: { select: { nombre: true } },
      establecimiento: { select: { nombre: true } },
      citas: {
        take: 5,
        orderBy: { fechaHora: 'desc' as const },
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
        take: 20,
        orderBy: { fecha: 'desc' as const },
        select: {
          id: true,
          fecha: true,
          analisis: true,
          medico: { 
            select: { 
              nombres: true, 
              apellidos: true,
              establecimiento: { select: { nombre: true } },
            } 
          },
          diagnosticos: {
            select: { codigoCIE10: true, descripcion: true, tipo: true },
          },
          presionSistolica: true,
          presionDiastolica: true,
          frecuenciaCardiaca: true,
          temperatura: true,
          peso: true,
          talla: true,
          saturacionO2: true,
        },
      },
      medicamentosActivos: {
        where: {
          inicio: { lte: new Date(`${DateUtils.getHoyLocalString()}T00:00:00Z`) },
          OR: [{ fin: null }, { fin: { gte: new Date(`${DateUtils.getHoyLocalString()}T00:00:00Z`) } }],
        },
        include: { medicamento: true },
      },
      recetas: {
        orderBy: { creadaEn: 'desc' as const },
        include: {
          establecimiento: { select: { nombre: true } },
          detalles: { include: { medicamento: true } },
        },
      },
    };
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
