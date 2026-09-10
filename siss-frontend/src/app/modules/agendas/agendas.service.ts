import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';

export interface AgendaBase {
  id?: number;
  medicoId: number;
  establecimientoId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export interface ExcepcionAgenda {
  id?: number;
  medicoId: number;
  establecimientoId: number;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  descripcion: string;
  horaInicio?: string;
  horaFin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgendasService {
  private apiUrl = `${environment.apiUrl}/agendas`;

  constructor(private http: HttpClient) {}

  upsertAgendaBase(agenda: AgendaBase): Observable<AgendaBase> {
    return this.http.post<any>(`${this.apiUrl}/base`, agenda).pipe(map(res => res.data));
  }

  createExcepcion(excepcion: ExcepcionAgenda): Observable<ExcepcionAgenda> {
    return this.http.post<any>(`${this.apiUrl}/excepciones`, excepcion).pipe(map(res => res.data));
  }

  getAgendaMedico(medicoId: number, establecimientoId: number): Observable<{ base: AgendaBase[], excepciones: ExcepcionAgenda[] }> {
    return this.http.get<any>(`${this.apiUrl}/medico/${medicoId}/${establecimientoId}`).pipe(map(res => res.data));
  }

  verificarDisponibilidad(medicoId: number, establecimientoId: number, fecha: string): Observable<{ disponible: boolean, mensaje?: string }> {
    return this.http.get<any>(`${this.apiUrl}/verificar/${medicoId}/${establecimientoId}/${fecha}`).pipe(map(res => res.data));
  }

  deleteExcepcion(id: number): Observable<void> {
    return this.http.post<any>(`${this.apiUrl}/excepciones/eliminar/${id}`, {}).pipe(map(res => res.data));
  }

  deleteAgendaBase(medicoId: number, establecimientoId: number, diaSemana: number): Observable<void> {
    return this.http.post<any>(`${this.apiUrl}/base/eliminar/${medicoId}/${establecimientoId}/${diaSemana}`, {}).pipe(map(res => res.data));
  }
}
