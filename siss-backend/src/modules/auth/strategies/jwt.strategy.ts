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
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub, activo: true },
      select: { id: true, correo: true, activo: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    return {
      id: payload.sub,
      correo: payload.correo,
      rol: payload.rol,
      permisos: payload.permisos,
      establecimientoId: payload.establecimientoId,
      servicioId: payload.servicioId,
      asignacionId: payload.asignacionId,
      especialidadId: payload.especialidadId,
    };
  }
}
