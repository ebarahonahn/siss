import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') as string,
    } as any);
  }

  async validate(payload: any) {
    console.log('[JWT STRATEGY] Validando payload:', JSON.stringify(payload));
    const isPatient = payload.userType === 'PACIENTE';
    let usuario: any;

    const userId = Number(payload.sub);
    try {
      if (isPatient) {
        console.log('[JWT STRATEGY] Buscando en PacienteUsuario con id:', userId);
        usuario = await this.prisma.pacienteUsuario.findUnique({
          where: { id: userId, activo: true },
          select: { id: true, correo: true, activo: true },
        });
      } else {
        console.log('[JWT STRATEGY] Buscando en Usuario con id:', userId);
        usuario = await this.prisma.usuario.findUnique({
          where: { id: userId, activo: true },
          select: { id: true, correo: true, activo: true },
        });
      }
    } catch (error) {
      console.error('[JWT STRATEGY] Error en búsqueda de base de datos:', error);
      throw new UnauthorizedException('Error al validar sesión en base de datos');
    }

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    return {
      id: userId,
      sub: userId, // Aseguramos que sub esté disponible como número
      userType: payload.userType,
      correo: payload.correo,
      dni: payload.dni,
      rol: payload.rol,
      permisos: payload.permisos,
      establecimientoId: payload.establecimientoId,
      servicioId: payload.servicioId,
      asignacionId: payload.asignacionId,
      especialidadId: payload.especialidadId,
      pacienteId: payload.pacienteId,
    };
  }
}
