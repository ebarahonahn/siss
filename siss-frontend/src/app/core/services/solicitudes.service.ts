import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface SolicitudUsuario {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  justificacion: string | null;
  latitud?: number;
  longitud?: number;
  estado: EstadoSolicitud;
  observaciones: string | null;
  creadaEn: string;
  procesadaEn: string | null;
  procesadaPor?: { id: number; nombres: string; apellidos: string };
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/solicitudes-usuario`;

  listar(estado?: EstadoSolicitud) {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    
    return this.http.get<ApiResponse<SolicitudUsuario[]>>(this.base, { params })
      .pipe(map(res => res.data));
  }

  obtener(id: number) {
    return this.http.get<ApiResponse<SolicitudUsuario>>(`${this.base}/${id}`)
      .pipe(map(res => res.data));
  }

  procesar(id: number, data: { estado: EstadoSolicitud; observaciones?: string }) {
    return this.http.patch<ApiResponse<SolicitudUsuario>>(`${this.base}/${id}/procesar`, data)
      .pipe(map(res => res.data));
  }

  crear(payload: any) {
    return this.http.post<ApiResponse<SolicitudUsuario>>(this.base, payload)
      .pipe(map(res => res.data));
  }
}
