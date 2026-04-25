import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CitaPendienteTriaje {
  id: number;
  fechaHora: string;
  tipo: string;
  estado: string;
  motivo: string | null;
  paciente: { id: number; nombres: string; apellidos: string; dni: string; numeroExpediente: string; fechaNacimiento: string };
  medico: { id: number; nombres: string; apellidos: string };
  triaje: { id: number; categoria: string; creadoEn: string } | null;
}

export interface CrearTriajePayload {
  citaId: number;
  motivoConsulta: string;
  presionSistolica?: number;
  presionDiastolica?: number;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
  temperatura?: number;
  saturacionO2?: number;
  glucometria?: number;
  peso?: number;
  talla?: number;
  escalaDolor?: number;
  nivelConciencia: string;
  categoria: string;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class TriajeService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/triaje`;

  citasPendientes(fecha?: string) {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<any>(this.base + '/citas-pendientes', { params })
      .pipe(map(r => r.data as CitaPendienteTriaje[]));
  }

  crear(payload: CrearTriajePayload) {
    return this.http.post<any>(this.base, payload).pipe(map(r => r.data));
  }

  obtenerPorCita(citaId: number) {
    return this.http.get<any>(`${this.base}/cita/${citaId}`).pipe(map(r => r.data));
  }
}
