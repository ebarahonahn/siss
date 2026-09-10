import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ReportesService } from './reportes.service';

export const ReportePermitido = (slug: string) => SetMetadata('reporteSlug', slug);

@Injectable()
export class ReporteAccesoGuard implements CanActivate {
  constructor(private reflector: Reflector, private reportes: ReportesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const slug = this.reflector.get<string>('reporteSlug', context.getHandler());
    if (!slug) return true;
    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('No tiene acceso a este reporte');
    const disponibles = await this.reportes.getMisReportes(user.id, user.rol, user.permisos, user.asignacionId, user.establecimientoId);
    if (!disponibles.some((reporte: { slug: string }) => reporte.slug === slug)) {
      throw new ForbiddenException('No tiene autorizado este reporte');
    }
    return true;
  }
}
