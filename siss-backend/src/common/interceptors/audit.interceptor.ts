import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { DateUtils } from '../../common/utils/date-utils';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, ip } = req;

    const esMutacion = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (!esMutacion || !user) return next.handle();

    const inicio = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duracion = Date.now() - inicio;
        const entidad = url.split('/')[3] ?? 'desconocido';

        this.prisma.auditLog
          .create({
            data: {
              usuarioId: user.id,
              accion: method,
              entidad,
              ip: ip ?? null,
              duracionMs: duracion,
              timestamp: DateUtils.getLiteralNow(),
            },
          })
          .catch(() => {});
      }),
    );
  }
}
