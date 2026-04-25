import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, merge, throttleTime, Subscription, timer } from 'rxjs';
import { AuthService } from './auth.service';
import { ParametrosService } from './parametros.service';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private auth = inject(AuthService);
  private router = inject(Router);
  private paramsSvc = inject(ParametrosService);
  private zone = inject(NgZone);

  private timeoutMinutes = 30; // Default
  private timerSubscription?: Subscription;
  private activitySubscription?: Subscription;

  constructor() {
    this.init();
  }

  private init() {
    // Escuchar cambios en el estado de autenticación
    this.auth.usuario$.subscribe(usuario => {
      if (usuario) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }
    });
  }

  private startMonitoring() {
    this.stopMonitoring();

    // Cargar el tiempo desde los parámetros del sistema
    this.paramsSvc.obtenerPorClave('MINUTOS_INACTIVIDAD_SESION').subscribe({
      next: (val) => {
        // El servicio devuelve el objeto completo, extraemos 'valor'
        const minutosStr = val?.valor;
        if (minutosStr && !isNaN(Number(minutosStr))) {
          this.timeoutMinutes = Number(minutosStr);
        }
        console.log(`[InactivityService] Monitoreo iniciado. Tiempo de espera: ${this.timeoutMinutes} minutos.`);
        this.setupTimer();
      },
      error: () => {
        console.warn(`[InactivityService] Error al cargar parámetro, usando default: ${this.timeoutMinutes} mins`);
        this.setupTimer();
      }
    });

    // Detectar actividad del usuario (throttled para performance)
    this.zone.runOutsideAngular(() => {
      const activity$ = merge(
        fromEvent(window, 'mousemove'),
        fromEvent(window, 'mousedown'),
        fromEvent(window, 'keydown'),
        fromEvent(window, 'scroll'),
        fromEvent(window, 'touchstart')
      ).pipe(throttleTime(5000)); // Revisar cada 5 segundos máximo

      this.activitySubscription = activity$.subscribe(() => {
        this.zone.run(() => this.resetTimer());
      });
    });
  }

  private setupTimer() {
    if (this.timerSubscription) this.timerSubscription.unsubscribe();
    
    // El timer se dispara después de X minutos de inactividad
    this.timerSubscription = timer(this.timeoutMinutes * 60 * 1000).subscribe(() => {
      console.log('[InactivityService] Tiempo de inactividad alcanzado. Cerrando sesión...');
      this.logoutDueToInactivity();
    });
  }

  private resetTimer() {
    // Solo loguear si estamos en modo debug o si queremos ver actividad
    // console.log('[InactivityService] Actividad detectada. Reiniciando temporizador.');
    this.setupTimer();
  }

  private stopMonitoring() {
    if (this.timerSubscription) this.timerSubscription.unsubscribe();
    if (this.activitySubscription) this.activitySubscription.unsubscribe();
  }

  private logoutDueToInactivity() {
    this.stopMonitoring();
    this.auth.cerrarSesion();
    // Redirigir con un mensaje explicativo
    this.router.navigate(['/login'], { 
      queryParams: { reason: 'inactivity', minutes: this.timeoutMinutes } 
    });
  }
}
