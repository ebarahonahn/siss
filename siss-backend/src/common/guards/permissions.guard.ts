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

    if (user?.rol === 'ADMIN') {
      return true;
    }

    if (!user || !user.permisos) {
      console.log('[PERMISSIONS] Usuario sin permisos');
      throw new ForbiddenException(
        'No se encontraron permisos para el usuario',
      );
    }

    const permisos = user.permisos;

    const permisosRequeridos = permisoRequerido.split(',');

    // Soporte para formato array (ej. ['pediatria:leer', 'pediatria'])
    if (Array.isArray(permisos)) {
      if (permisos.includes('all')) return true;
      const hasPermission = permisosRequeridos.some(req => {
        const modulo = req.split(':')[0];
        return (
          permisos.includes(req) ||
          permisos.includes(modulo) ||
          permisos.some(p => p === modulo || p.startsWith(`${modulo}:`))
        );
      });
      console.log(`[PERMISSIONS] Evaluando array. Requeridos: ${permisosRequeridos} | Resultado: ${hasPermission}`);
      if (hasPermission) return true;
      console.log(`[PERMISSIONS] Denegado: ninguno de ${permisosRequeridos} está en ${permisos}`);
      throw new ForbiddenException(
        `No tiene el permiso necesario (${permisoRequerido}) para realizar esta acción`,
      );
    }

    // Soporte para formato objeto (ej. { pediatria: ['leer'] })
    if (permisos && typeof permisos === 'object') {
      console.log('[PERMISSIONS] Evaluando objeto');
      if (permisos.all === true) return true;
      
      const hasPermission = permisosRequeridos.some(req => {
        const [modulo, accion] = req.split(':');
        const permisosModulo = permisos[modulo];
        // Tener asignado el módulo (objeto no vacío / true) otorga acceso total a cualquier acción del módulo
        if (!permisosModulo) return false;
        if (Array.isArray(permisosModulo)) return permisosModulo.length > 0;
        return !!permisosModulo;
      });

      if (hasPermission) return true;
    }

    console.log('[PERMISSIONS] Denegado al final');
    throw new ForbiddenException(
      `No tiene el permiso necesario (${permisoRequerido}) para realizar esta acción`,
    );
  }
}
