import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rolesRequeridos) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!rolesRequeridos.includes(user.rol)) {
      throw new ForbiddenException(
        `Su rol (${user.rol}) no tiene permiso para esta acción`,
      );
    }

    return true;
  }
}
