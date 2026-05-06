import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      // Registrar error para depuración
      console.error('[JWT AUTH GUARD] Error:', err);
      console.error('[JWT AUTH GUARD] Info:', info);
      console.error('[JWT AUTH GUARD] User:', user);

      if (info && info.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
      }
      
      throw new UnauthorizedException(
        err?.message || 'Token inválido o expirado. Inicie sesión nuevamente.',
      );
    }
    return user;
  }
}
