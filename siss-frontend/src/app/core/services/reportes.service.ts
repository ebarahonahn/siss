import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';

export interface DashboardKPIs {
  consultasHoy: number | null;
  pacientesNuevos: number | null;
  stockCritico: number | null;
  citasPendientes: number | null;
  fechaActualizacion: string;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);

  getDashboardKPIs(establecimientoId?: number, inicio?: string, fin?: string): Observable<DashboardKPIs> {
    let url = `${environment.apiUrl}/reportes/dashboard-kpis?`;
    if (establecimientoId) url += `establecimientoId=${establecimientoId}&`;
    if (inicio) url += `inicio=${inicio}&`;
    if (fin) url += `fin=${fin}&`;
    
    return this.http.get<{ ok: boolean, data: DashboardKPIs }>(url).pipe(
      map(res => res.data)
    );
  }

  descargarExcel(tipo: string, inicio: string, fin: string, establecimientoId?: number): Observable<Blob> {
    let url = `${environment.apiUrl}/reportes/excel/${tipo}?inicio=${inicio}&fin=${fin}`;
    if (establecimientoId) url += `&establecimientoId=${establecimientoId}`;
    
    return this.http.get(url, { responseType: 'blob' });
  }

  getMorbilidad(inicio: string, fin: string, establecimientoId?: number): Observable<any[]> {
    let url = `${environment.apiUrl}/reportes/morbilidad?inicio=${inicio}&fin=${fin}`;
    if (establecimientoId) url += `&establecimientoId=${establecimientoId}`;
    
    return this.http.get<any>(url).pipe(
      map(res => res.data || [])
    );
  }

  getCobertura(inicio: string, fin: string, establecimientoId?: number): Observable<any[]> {
    let url = `${environment.apiUrl}/reportes/cobertura?inicio=${inicio}&fin=${fin}`;
    if (establecimientoId) url += `&establecimientoId=${establecimientoId}`;
    
    return this.http.get<any>(url).pipe(
      map(res => res.data || [])
    );
  }

  obtenerReportesDisponibles(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiUrl}/reportes/disponibles`).pipe(
      map(res => res.data)
    );
  }

  obtenerMisReportes(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiUrl}/reportes/mis-reportes`).pipe(
      map(res => res.data || [])
    );
  }

  obtenerReportesUsuario(usuarioId: number): Observable<number[]> {
    return this.http.get<any>(`${environment.apiUrl}/reportes/usuario/${usuarioId}`).pipe(
      map(res => res.data || [])
    );
  }

  asignarReportesUsuario(usuarioId: number, reporteIds: number[]): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/reportes/usuario/${usuarioId}`, { reporteIds });
  }

  crearReporte(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/reportes/disponibles`, data);
  }

  actualizarReporte(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/reportes/disponibles/${id}`, data);
  }

  eliminarReporte(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/reportes/disponibles/${id}`);
  }
}
