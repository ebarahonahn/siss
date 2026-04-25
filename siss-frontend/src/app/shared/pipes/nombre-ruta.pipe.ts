import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'nombreRutaActiva', standalone: true, pure: false })
export class NombreRutaActivaPipe implements PipeTransform {
  transform(items: any[], rutaActual: string): string {
    if (!items) return 'Dashboard';
    const item = items.find(i => {
      if (i.ruta === '/dashboard') return rutaActual === '/dashboard';
      return rutaActual.startsWith(i.ruta);
    });
    return item?.label ?? 'Dashboard';
  }
}
