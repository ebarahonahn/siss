import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificacionEpidemiologica {
  id?: number;
  pacienteId: number;
  historiaId: number;
  diagnosticoCIE10: string;
  latitud?: number;
  longitud?: number;
  direccionDetallada?: string;
  fechaInicioSintomas?: string;
  antecedentesViaje?: string;
  lugaresVisitados?: string;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class EpidemiologiaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/epidemiologia`;

  notificar(dto: NotificacionEpidemiologica) {
    return this.http.post<any>(`${this.base}/notificar`, dto).pipe(map(r => r.data ?? r));
  }

  obtenerPorHistoria(historiaId: number) {
    return this.http.get<any>(`${this.base}/historia/${historiaId}`).pipe(map(r => r.data ?? r));
  }

  listar(establecimientoId?: number) {
    const params: any = {};
    if (establecimientoId) params.establecimientoId = establecimientoId;
    return this.http.get<any>(`${this.base}/listado`, { params }).pipe(map(r => r.data ?? r));
  }

  obtenerMapaCalor() {
    return this.http.get<any>(`${this.base}/dashboard/mapa-calor`).pipe(map(r => r.data ?? r));
  }

  obtenerCanalEndemico(anio?: number) {
    const params: any = {};
    if (anio) params.anio = anio;
    return this.http.get<any>(`${this.base}/dashboard/canal-endemico`, { params }).pipe(map(r => r.data ?? r));
  }

  obtenerAlertas() {
    return this.http.get<any>(`${this.base}/dashboard/alertas`).pipe(map(r => r.data ?? r));
  }

  gestionar(id: number, estado: string) {
    return this.http.post<any>(`${this.base}/${id}/gestionar`, { estado }).pipe(map(r => r.data ?? r));
  }
}
