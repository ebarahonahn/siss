import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../common/services/mail.service';
import { DateUtils } from '../../common/utils/date-utils';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  async login(dto: LoginDto) {
    let userType: 'INSTITUCIONAL' | 'PACIENTE' = 'INSTITUCIONAL';
    
    // 1. Buscar en Usuarios Institucionales
    let usuario: any = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { correo: dto.identificador },
          { numeroEmpleado: dto.identificador },
        ],
        activo: true,
      },
      include: {
        rol: true,
        asignaciones: {
          where: { activo: true },
          include: {
            establecimiento: true,
            servicio: { include: { catServicio: true } },
            rol: true,
            especialidad: true,
          },
        },
      },
    });

    // 2. Si no es institucional, buscar en Usuarios de Pacientes
    if (!usuario) {
      usuario = await this.prisma.pacienteUsuario.findFirst({
        where: {
          OR: [
            { correo: dto.identificador },
            { dni: dto.identificador },
          ],
        },
        include: { paciente: true }
      });
      if (usuario) userType = 'PACIENTE';
    }

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const contrasenaHash = usuario.contrasenaHash;
    const contrasenaValida = await bcrypt.compare(dto.contrasena, contrasenaHash);

    if (!contrasenaValida) {
      if (userType === 'INSTITUCIONAL') await this.registrarIntentoFallido(usuario.id);
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // ── Lógica para PACIENTES (Aislada) ──────────────────────────────────────
    if (userType === 'PACIENTE') {
      const payload = {
        sub: usuario.id,
        userType: 'PACIENTE',
        correo: usuario.correo,
        dni: usuario.dni,
        pacienteId: usuario.pacienteId,
        rol: 'PACIENTE',
        permisos: ['citas:leer', 'citas:crear', 'pacientes:leer', 'historia_clinica:leer', 'recetas:leer', 'notificaciones:leer', 'establecimientos:leer', 'especialidades:leer', 'inventario:leer', 'control_prenatal:leer'],
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
      const refreshToken = this.jwtService.sign(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      });

      await this.prisma.sesionPaciente.create({
        data: {
          pacienteUsuarioId: usuario.id,
          refreshTokenHash: await bcrypt.hash(refreshToken, 10),
          expiresAt: new Date(DateUtils.getLiteralNow().getTime() + 7 * 24 * 60 * 60 * 1000),
          ip: dto.ip ?? null,
          userAgent: dto.userAgent ?? null,
        },
      });

      await this.prisma.pacienteUsuario.update({
        where: { id: usuario.id },
        data: { ultimoAcceso: DateUtils.getLiteralNow() }
      });

      return {
        accessToken,
        refreshToken,
        requiereCambioContrasena: usuario.requiereCambioContrasena,
        usuario: {
          id: usuario.id,
          nombres: usuario.paciente?.nombres || 'Usuario',
          apellidos: usuario.paciente?.apellidos || 'Móvil',
          correo: usuario.correo,
          rol: 'PACIENTE',
          pacienteId: usuario.pacienteId,
        },
      };
    }

    // ── Lógica de Multi-Asignación (Solo para INSTITUCIONAL) ──────────────────
    const asignaciones = usuario.asignaciones;
    if (asignaciones.length === 0) {
      throw new UnauthorizedException('El usuario no tiene asignaciones activas');
    }

    let asignacionSeleccionada: any = null;
    if (dto.asignacionId) {
      asignacionSeleccionada = asignaciones.find((a) => a.id == dto.asignacionId);
    } else if (asignaciones.length === 1) {
      asignacionSeleccionada = asignaciones[0];
    }

    if (!asignacionSeleccionada) {
      if (asignaciones.length > 1 && !dto.asignacionId) {
        return {
          requiereSeleccion: true,
          usuario: {
            id: usuario.id,
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            correo: usuario.correo,
          },
          asignaciones: asignaciones.map((a) => ({
            id: a.id,
            establecimiento: a.establecimiento.nombre,
            servicio: a.servicio?.catServicio?.nombre || 'General',
            rol: a.rol?.nombre || usuario.rol?.nombre,
            especialidad: a.especialidad?.nombre || 'General',
          })),
        };
      }
      throw new UnauthorizedException('Asignación inválida o no seleccionada');
    }

    // ── Bloqueo por Agenda (Médicos con Permiso/Vacaciones) ──────────────────
    const rolNombre = (asignacionSeleccionada?.rol?.nombre || usuario.rol?.nombre || '').toUpperCase();
    const esMedico = rolNombre.includes('MEDICO');

    console.log(`[AUTH] Validando acceso para: ${usuario.correo} | Rol: ${rolNombre} | esMedico: ${esMedico}`);

    if (esMedico && asignacionSeleccionada) {
      const ahora = new Date();
      
      // Calculamos el desfase de Honduras (UTC-6) de forma dinámica
      // getTimezoneOffset() devuelve minutos. Honduras es -6h = -360m (pero el signo es invertido en JS)
      const offsetHondurasMinutos = 360; 
      const offsetServidorMinutos = ahora.getTimezoneOffset();
      const diffMins = offsetServidorMinutos - offsetHondurasMinutos;
      
      const ahoraHonduras = new Date(ahora.getTime() + (diffMins * 60 * 1000));
      
      const hours = ahoraHonduras.getHours();
      const minutes = ahoraHonduras.getMinutes();
      const diaSemana = ahoraHonduras.getDay(); // 0-6 (Domingo-Sábado)
      const minsActual = hours * 60 + minutes;

      // 1. Validar Excepciones (Usamos la fecha para el rango)
      const excepcion = await this.prisma.excepcionAgenda.findFirst({
        where: {
          medicoId: usuario.id,
          establecimientoId: asignacionSeleccionada.establecimientoId,
          fechaInicio: { lte: ahoraHonduras },
          fechaFin: { gte: ahoraHonduras },
        },
      });

      if (excepcion) {
        const tipo = excepcion.tipo.toLowerCase().replace(/_/g, ' ');
        console.log(`[AUTH] Bloqueado por excepción activa: ${tipo}`);
        throw new UnauthorizedException(
          `ACCESO DENEGADO: Actualmente tiene un registro de "${tipo.toUpperCase()}" activo en este establecimiento.`,
        );
      }

      // 2. Validar Jornada Base
      const agenda = await this.prisma.agendaBase.findFirst({
        where: {
          medicoId: usuario.id,
          establecimientoId: asignacionSeleccionada.establecimientoId,
          diaSemana,
          activo: true,
        },
      });

      if (!agenda) {
        console.log(`[AUTH] No se encontró jornada base para el día ${diaSemana}`);
        throw new UnauthorizedException(
          `ACCESO DENEGADO: No tiene una jornada laboral programada para hoy en este establecimiento.`,
        );
      }

      const [hI, mI] = agenda.horaInicio.split(':').map(Number);
      const [hF, mF] = agenda.horaFin.split(':').map(Number);
      const minsInicio = hI * 60 + mI;
      const minsFin = hF * 60 + mF;

      const paramMargen = await this.prisma.parametroSistema.findUnique({ where: { clave: 'MARGEN_LOGIN_MINUTOS' } });
      const margen = paramMargen ? parseInt(paramMargen.valor) : 30;

      console.log(`[AUTH] Horario: ${agenda.horaInicio}-${agenda.horaFin} | MinsActual: ${minsActual} | MinsRange: ${minsInicio-margen} a ${minsFin+margen}`);

      if (minsActual < (minsInicio - margen) || minsActual > (minsFin + margen)) {
        console.log(`[AUTH] Bloqueado por estar fuera de horario`);
        throw new UnauthorizedException(
          `ACCESO DENEGADO: Su jornada laboral en este centro es de ${agenda.horaInicio} a ${agenda.horaFin}. Actualmente se encuentra fuera del horario permitido.`,
        );
      }
    }

    // ── Generación de Token con Contexto ─────────────────────────────────────
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { 
        ultimoAcceso: DateUtils.getLiteralNow(),
        // Si el usuario acaba de entrar con clave temporal y logra loguearse, 
        // pero queremos que la cambie, no la reseteamos aquí aún,
        // la resetearemos cuando el usuario efectivamente la cambie.
      },
    });

    const payload = {
      sub: usuario.id,
      userType: 'INSTITUCIONAL',
      correo: usuario.correo,
      rol: asignacionSeleccionada?.rol?.nombre || usuario.rol?.nombre,
      permisos: this.mergePermisos(
        asignacionSeleccionada?.rol?.permisos || usuario.rol?.permisos,
        asignacionSeleccionada?.permisos,
      ),
      establecimientoId: asignacionSeleccionada?.establecimientoId || null,
      servicioId: asignacionSeleccionada?.servicioId || null,
      asignacionId: asignacionSeleccionada?.id || null,
      especialidadId:
        asignacionSeleccionada?.especialidadId || usuario.especialidadId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h', 
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    await this.prisma.sesion.create({
      data: {
        usuarioId: usuario.id,
        refreshTokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(DateUtils.getLiteralNow().getTime() + 7 * 24 * 60 * 60 * 1000),
        ip: dto.ip ?? null,
        userAgent: dto.userAgent ?? null,
      },
    });

    return {
      accessToken,
      refreshToken,
      requiereCambioContrasena: usuario.requiereCambioContrasena,
      usuario: {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        rol: payload.rol,
        permisos: payload.permisos,
        establecimientoId: payload.establecimientoId,
        servicioId: payload.servicioId,
        especialidadId: payload.especialidadId,
        establecimientoNombre: asignacionSeleccionada?.establecimiento?.nombre || 'SISS Global',
        servicioNombre: asignacionSeleccionada?.servicio?.catServicio?.nombre || 'General',
      },
    };
  }

  async renovarToken(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const isPatient = payload.userType === 'PACIENTE';
    let sesionValida = false;

    if (isPatient) {
      const sesiones = await this.prisma.sesionPaciente.findMany({
        where: {
          pacienteUsuarioId: payload.sub,
          creadoEn: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });
      for (const s of sesiones) {
        if (await bcrypt.compare(refreshToken, s.refreshTokenHash)) {
          sesionValida = true;
          break;
        }
      }
    } else {
      const sesiones = await this.prisma.sesion.findMany({
        where: {
          usuarioId: payload.sub,
          expiresAt: { gt: DateUtils.getLiteralNow() },
        },
      });
      for (const s of sesiones) {
        if (await bcrypt.compare(refreshToken, s.refreshTokenHash)) {
          sesionValida = true;
          break;
        }
      }
    }

    if (!sesionValida) {
      throw new UnauthorizedException('Sesión expirada. Inicie sesión nuevamente.');
    }

    // Generar nuevo access token manteniendo el payload original (excepto iat/exp)
    const { iat, exp, ...newPayload } = payload;
    const nuevoAccessToken = this.jwtService.sign(newPayload, { expiresIn: '1h' });

    return { accessToken: nuevoAccessToken };
  }

  async cerrarSesion(userId: number, userType: string) {
    if (userType === 'PACIENTE') {
      await this.prisma.sesionPaciente.deleteMany({ where: { pacienteUsuarioId: userId } });
    } else {
      await this.prisma.sesion.deleteMany({ where: { usuarioId: userId } });
    }
    return { mensaje: 'Sesión cerrada correctamente' };
  }

  private async registrarIntentoFallido(usuarioId: number) {
    await this.prisma.auditLog.create({
      data: {
        accion: 'LOGIN_FALLIDO',
        entidad: 'Usuario',
        entidadId: usuarioId,
        detalle: 'Contraseña incorrecta',
        timestamp: DateUtils.getLiteralNow(),
      },
    });
  }

  private mergePermisos(rolPermisos: any, asignacionPermisos: any): string[] {
    let p1: string[] = [];
    if (rolPermisos && typeof rolPermisos === 'object' && !Array.isArray(rolPermisos)) {
      if (rolPermisos['all']) p1.push('all');
      for (const modulo in rolPermisos) {
        if (Array.isArray(rolPermisos[modulo])) {
          rolPermisos[modulo].forEach((accion: string) => {
            p1.push(`${modulo}:${accion}`);
          });
        }
      }
    } else if (Array.isArray(rolPermisos)) {
      p1 = rolPermisos;
    }
    const p2 = Array.isArray(asignacionPermisos) ? asignacionPermisos : [];
    return [...new Set([...p1, ...p2])];
  }

  async solicitarRecuperacion(identificador: string) {
    // 1. Buscar en Usuarios Institucionales
    let usuario: any = await this.prisma.usuario.findFirst({
      where: { OR: [{ correo: identificador }, { numeroEmpleado: identificador }], activo: true },
    });

    let userType: 'INSTITUCIONAL' | 'PACIENTE' = 'INSTITUCIONAL';

    // 2. Si no, buscar en Pacientes
    if (!usuario) {
      usuario = await this.prisma.pacienteUsuario.findFirst({
        where: { correo: identificador, activo: true },
        include: { paciente: true }
      });
      if (usuario) userType = 'PACIENTE';
    }

    if (!usuario) {
      return { mensaje: 'Si el usuario existe, recibirá un correo con instrucciones.' };
    }

    const claveTemporal = crypto.randomBytes(4).toString('hex');
    const hash = await bcrypt.hash(claveTemporal, 10);

    if (userType === 'INSTITUCIONAL') {
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { contrasenaHash: hash, requiereCambioContrasena: true },
      });
    } else {
      await this.prisma.pacienteUsuario.update({
        where: { id: usuario.id },
        data: { contrasenaHash: hash, requiereCambioContrasena: true },
      });
    }

    const nombre = userType === 'INSTITUCIONAL' ? usuario.nombres : (usuario.paciente?.nombres || 'Usuario');
    await this.enviarCorreoRecuperacion(usuario.correo, nombre, claveTemporal);

    return { mensaje: 'Si el usuario existe, recibirá un correo con instrucciones.' };
  }

  private async enviarCorreoRecuperacion(correo: string, nombre: string, clave: string) {
    const subject = 'Recuperación de Contraseña - SISS';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h2 style="color: #2563eb;">Recuperación de Contraseña</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Se ha solicitado la recuperación de tu contraseña en el SISS.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">Tu clave temporal es:</p>
          <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold; color: #1e293b; letter-spacing: 2px;">${clave}</p>
        </div>
        <p>Por favor, cámbiala inmediatamente al iniciar sesión.</p>
      </div>
    `;
    await this.mailService.sendMail(correo, subject, 'Clave temporal: ' + clave, html);
  }

  async cambiarContrasena(userId: number, nuevaContrasena: string, userType: string) {
    const hash = await bcrypt.hash(nuevaContrasena, 10);
    if (userType === 'PACIENTE') {
      await this.prisma.pacienteUsuario.update({
        where: { id: userId },
        data: { contrasenaHash: hash, requiereCambioContrasena: false },
      });
    } else {
      await this.prisma.usuario.update({
        where: { id: userId },
        data: { contrasenaHash: hash, requiereCambioContrasena: false },
      });
    }
    return { mensaje: 'Contraseña actualizada correctamente.' };
  }
}
