import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsHn from '@angular/common/locales/es-HN';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { offlineInterceptor } from './core/interceptors/offline.interceptor';

registerLocaleData(localeEsHn);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([offlineInterceptor, jwtInterceptor]),
    ),
    { provide: LOCALE_ID, useValue: 'es-HN' },
  ],
};
