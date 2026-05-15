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
    if (!permisoRequerido) {
      console.log(`[PERMISSIONS] No se requiere permiso para: ${context.getHandler().name}`);
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    console.log(`[PERMISSIONS] Validando '${permisoRequerido}' para usuario: ${user?.correo} | DNI: ${user?.dni} | Permisos: ${JSON.stringify(user?.permisos)}`);

    if (!user || !user.permisos) {
      console.log('[PERMISSIONS] Usuario sin permisos');
      throw new ForbiddenException(
        'No se encontraron permisos para el usuario',
      );
    }

    const permisos = user.permisos;

    // Soporte para nuevo formato (array plano de strings)
    if (Array.isArray(permisos)) {
      const hasPermission = permisos.includes('all') || permisos.includes(permisoRequerido);
      console.log(`[PERMISSIONS] Evaluando array. Requerido: ${permisoRequerido} | Resultado: ${hasPermission}`);
      if (hasPermission) return true;
      console.log(`[PERMISSIONS] Denegado: ${permisoRequerido} no está en ${permisos}`);
      throw new ForbiddenException(
        `No tiene el permiso necesario (${permisoRequerido}) para realizar esta acción`,
      );
    }

    // Soporte para formato antiguo (objeto)
    if (permisos && typeof permisos === 'object') {
      console.log('[PERMISSIONS] Evaluando objeto');
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

    console.log('[PERMISSIONS] Denegado al final');
    throw new ForbiddenException(
      `No tiene el permiso necesario (${permisoRequerido}) para realizar esta acción`,
    );
  }
}
