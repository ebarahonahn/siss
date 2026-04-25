import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private authService = inject(AuthService);
  private socket: Socket | null = null;

  llegadaPaciente$ = new Subject<{ paciente: string; citaId: number }>();
  stockBajo$ = new Subject<{ medicamento: string; cantidad: number }>();
  resultadoLab$ = new Subject<{ paciente: string; prueba: string }>();
  alertaEpidemiologica$ = new Subject<{ enfermedad: string; municipio: string; casos: number }>();

  conectar() {
    const token = this.authService.obtenerToken();
    if (!token || this.socket?.connected) return;

    this.socket = io(`${environment.socketUrl}/notificaciones`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('paciente:llegada', (d) => this.llegadaPaciente$.next(d));
    this.socket.on('farmacia:stock_bajo', (d) => this.stockBajo$.next(d));
    this.socket.on('laboratorio:resultado', (d) => this.resultadoLab$.next(d));
    this.socket.on('epidemiologia:alerta', (d) => this.alertaEpidemiologica$.next(d));

    this.socket.on('connect_error', (err) => {
      console.warn('Socket desconectado:', err.message);
    });
  }

  desconectar() {
    this.socket?.disconnect();
    this.socket = null;
  }
}
