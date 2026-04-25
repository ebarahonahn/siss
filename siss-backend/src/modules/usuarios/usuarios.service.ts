import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';

const SELECT_USUARIO = {
  id: true,
  numeroEmpleado: true,
  nombres: true,
  apellidos: true,
  correo: true,
  telefono: true,
  activo: true,
  ultimoAcceso: true,
  numeroColegiado: true,
  rol: { select: { id: true, nombre: true } },
  establecimiento: { select: { id: true, nombre: true } },
  especialidad: { select: { id: true, nombre: true } },
  asignaciones: {
    where: { activo: true },
    select: {
      id: true,
      establecimiento: { select: { id: true, nombre: true } },
      servicio: {
        select: { id: true, catServicio: { select: { nombre: true } } },
      },
      rol: { select: { id: true, nombre: true } },
      especialidad: { select: { id: true, nombre: true } },
      permisos: true,
    },
  },
};

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async listar(
    pagina = 1,
    limite = 20,
    busqueda = '',
    establecimientoId?: number,
    rol?: string,
  ) {
    const skip = (pagina - 1) * limite;
    const where: any = {};

    if (busqueda) {
      where.OR = [
        { nombres: { contains: busqueda } },
        { apellidos: { contains: busqueda } },
        { correo: { contains: busqueda } },
        { numeroEmpleado: { contains: busqueda } },
      ];
    }

    // Scoping para ADMIN_ESTABLECIMIENTO: incluir usuarios del centro (por campo directo O por asignación activa)
    if (rol === 'ADMIN_ESTABLECIMIENTO' && establecimientoId) {
      where.OR = [
        ...(where.OR || []), // preservar cualquier búsqueda de texto existente
        // usuarios cuyo establecimiento principal sea este
        { establecimientoId },
        // usuarios con asignación activa en este establecimiento
        { asignaciones: { some: { establecimientoId, activo: true } } },
      ];
      // Si había un OR de búsqueda de texto, necesitamos AND para ambas condiciones
      if (busqueda) {
        const textSearch = where.OR.filter(
          (c: any) => c.nombres || c.apellidos || c.correo || c.numeroEmpleado,
        );
        const scopeSearch = [
          { establecimientoId },
          { asignaciones: { some: { establecimientoId, activo: true } } },
        ];
        delete where.OR;
        where.AND = [{ OR: textSearch }, { OR: scopeSearch }];
      } else {
        where.OR = [
          { establecimientoId },
          { asignaciones: { some: { establecimientoId, activo: true } } },
        ];
      }
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limite,
        select: SELECT_USUARIO,
        orderBy: [{ activo: 'desc' }, { apellidos: 'asc' }],
      }),
    ]);

    return { total, pagina, limite, items };
  }

  async obtener(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: SELECT_USUARIO,
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async crear(dto: CrearUsuarioDto, creatorEstablecimientoId?: number) {
    const existe = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ correo: dto.correo }, { numeroEmpleado: dto.numeroEmpleado }],
      },
    });
    if (existe)
      throw new ConflictException(
        'Ya existe un usuario con ese correo o número de empleado',
      );

    const rol = await this.prisma.rol.findFirst({ where: { nombre: dto.rol } });
    if (!rol) throw new NotFoundException('Rol no encontrado');

    const hash = await bcrypt.hash(dto.contrasena, 12);

    const esMedico = dto.rol === 'MEDICO';

    const usuario = await this.prisma.usuario.create({
      data: {
        numeroEmpleado: dto.numeroEmpleado,
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        correo: dto.correo,
        contrasenaHash: hash,
        telefono: dto.telefono,
        rolId: rol.id,
        establecimientoId:
          creatorEstablecimientoId ?? dto.asignaciones[0].establecimientoId,
        especialidadId: esMedico ? (dto.especialidadId ?? null) : null,
        numeroColegiado: esMedico ? (dto.numeroColegiado ?? null) : null,
        asignaciones: {
          create: dto.asignaciones.map((a) => ({
            establecimientoId: a.establecimientoId,
            servicioId: esMedico ? a.servicioId || null : null,
            especialidadId: esMedico ? a.especialidadId || null : null,
            rolId: a.rolId || rol.id,
            activo: true,
          })),
        },
      },
      select: SELECT_USUARIO,
    });

    return usuario;
  }

  async agregarAsignacion(
    usuarioId: number,
    data: { establecimientoId: number; servicioId?: number; rolId?: number },
  ) {
    let rolId = data.rolId;
    let esMedico = false;

    const user = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { rol: true },
    });

    if (!rolId) {
      rolId = user?.rolId || 1;
    }

    if (user?.rol?.nombre === 'MEDICO') {
      esMedico = true;
    }

    return this.prisma.asignacionUsuario.create({
      data: {
        usuarioId,
        establecimientoId: data.establecimientoId,
        servicioId: esMedico ? data.servicioId : null,
        especialidadId: esMedico ? (data as any).especialidadId : null,
        rolId: rolId,
        activo: true,
      },
      include: {
        establecimiento: { select: { nombre: true } },
        servicio: { include: { catServicio: true } },
        rol: { select: { nombre: true } },
        especialidad: { select: { nombre: true } },
      },
    });
  }

  async quitarAsignacion(id: number) {
    return this.prisma.asignacionUsuario.update({
      where: { id },
      data: { activo: false },
    });
  }

  async actualizar(id: number, dto: ActualizarUsuarioDto) {
    const usuario = await this.obtener(id);
    const esMedico = usuario.rol?.nombre === 'MEDICO';

    const data: any = { ...dto };
    delete data.contrasena;

    if (!esMedico) {
      data.especialidadId = null;
      data.numeroColegiado = null;
    }

    if (dto.contrasena) {
      data.contrasenaHash = await bcrypt.hash(dto.contrasena, 12);
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: SELECT_USUARIO,
    });
  }

  async toggleActivo(id: number) {
    const usuario = await this.obtener(id);
    return this.prisma.usuario.update({
      where: { id },
      data: { activo: !usuario.activo },
      select: SELECT_USUARIO,
    });
  }

  async listarMedicosPorEstablecimiento(establecimientoId: number) {
    console.log('Buscando médicos para establecimiento:', establecimientoId);
    if (!establecimientoId) return [];

    const medicos = await this.prisma.usuario.findMany({
      where: {
        OR: [
          { establecimientoId },
          {
            asignaciones: {
              some: {
                establecimientoId,
                rol: { nombre: 'MEDICO' },
                activo: true,
              },
            },
          },
        ],
        rol: { nombre: 'MEDICO' },
        activo: true,
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        numeroColegiado: true,
        especialidad: { select: { id: true, nombre: true } },
        asignaciones: {
          where: {
            establecimientoId,
            activo: true,
            especialidadId: { not: null },
          },
          select: {
            especialidad: { select: { id: true, nombre: true } },
          },
        },
      },
      orderBy: { apellidos: 'asc' },
    });

    // Enriquecer cada médico con la lista única de especialidades que atiende en este centro
    return medicos.map((m) => {
      const espFromAsignaciones = m.asignaciones
        .map((a) => a.especialidad)
        .filter((e): e is { id: number; nombre: string } => e !== null);

      // Unificar: especialidad principal + especialidades de asignaciones
      const todas = new Map<number, { id: number; nombre: string }>();
      if (m.especialidad) todas.set(m.especialidad.id, m.especialidad);
      espFromAsignaciones.forEach((e) => todas.set(e.id, e));

      return {
        id: m.id,
        nombres: m.nombres,
        apellidos: m.apellidos,
        numeroColegiado: m.numeroColegiado,
        especialidad: m.especialidad, // especialidad principal
        especialidades: Array.from(todas.values()), // todas las especialidades que atiende aquí
      };
    });
  }

  async actualizarPermisosAsignacion(id: number, permisos: string[]) {
    return this.prisma.asignacionUsuario.update({
      where: { id },
      data: { permisos },
    });
  }
}
