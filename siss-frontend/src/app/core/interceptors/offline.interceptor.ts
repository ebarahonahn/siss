import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  const esMutacion = ['POST', 'PUT', 'PATCH'].includes(req.method);

  if (esMutacion && !navigator.onLine) {
    // Guardar en localStorage como cola de sincronización offline
    const cola: any[] = JSON.parse(localStorage.getItem('offline_queue') ?? '[]');
    cola.push({ url: req.urlWithParams, method: req.method, body: req.body, ts: Date.now() });
    localStorage.setItem('offline_queue', JSON.stringify(cola));

    return of(
      new HttpResponse({
        status: 202,
        body: { ok: true, data: { offline: true, mensaje: 'Guardado localmente' } },
      }),
    );
  }

  return next(req);
};
