import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handlerName = context.getHandler()?.name || 'unknown';
    console.log(`[TRANSFORM] Interceptando respuesta para: ${handlerName}`);

    return next.handle().pipe(
      map((data) => {
        try {
          // Evitar doble envoltura
          if (data && typeof data === 'object' && 'ok' in data && 'data' in data) {
            return data;
          }

          console.log(`[TRANSFORM] Mapeando datos para: ${handlerName}`);
          return {
            ok: true,
            data: data ?? null,
          };
        } catch (error) {
          console.error(`[TRANSFORM] ERROR FATAL en mapeo para ${handlerName}:`, error);
          throw error;
        }
      }),
    );
  }
}
