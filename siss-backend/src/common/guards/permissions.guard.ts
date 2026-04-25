import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permisoRequerido = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no se requiere permiso específico, permitir acceso (o usar RolesGuard si existe)
    if (!permisoRequerido) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.permisos) {
      throw new ForbiddenException(
        'No se encontraron permisos para el usuario',
      );
    }

    const permisos = user.permisos;

    // Soporte para nuevo formato (array plano)
    if (Array.isArray(permisos)) {
      if (permisos.includes('all')) return true;
      if (permisos.includes(permisoRequerido)) return true;
      throw new ForbiddenException(
        `No tiene el permiso necesario (${permisoRequerido}) para realizar esta acción`,
      );
    }

    // Soporte para formato antiguo (objeto)
    if (permisos && typeof permisos === 'object') {
      if (permisos.all === true) return true;
      const [modulo, accion] = permisoRequerido.split(':');
      const permisosModulo = permisos[modulo];
      if (
        permisosModulo &&
        Array.isArray(permisosModulo) &&
        permisosModulo.includes(accion)
      ) {
        return true;
      }
    }

    throw new ForbiddenException(
      `No tiene el permiso necesario (${permisoRequerido}) para realizar esta acción`,
    );
  }
}
