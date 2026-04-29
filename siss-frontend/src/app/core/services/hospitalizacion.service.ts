import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';

export interface Sala {
  id: number;
  nombre: string;
  codigo?: string;
  servicioId: number;
  activo: boolean;
  _count?: { habitaciones: number };
}

export interface Habitacion {
  id: number;
  numero: string;
  salaId: number;
  tipoHabitacionId: number;
  activo: boolean;
  tipoHabitacion?: { nombre: string };
  _count?: { camas: number };
}

export interface Cama {
  id: number;
  codigo: string;
  habitacionId: number;
  tipoCamaId: number;
  estado: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO' | 'LIMPIEZA';
  activo: boolean;
  tipoCama?: { nombre: string };
}

@Injectable({
  providedIn: 'root'
})
export class HospitalizacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hospitalizacion`;

  // Catálogos
  listarTiposHabitacion(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/tipos-habitacion`).pipe(map(r => r.data ?? r));
  }

  listarTiposCama(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/tipos-cama`).pipe(map(r => r.data ?? r));
  }

  // Salas
  listarSalas(servicioId: number): Observable<Sala[]> {
    return this.http.get<any>(`${this.apiUrl}/salas/${servicioId}`).pipe(map(r => r.data ?? r));
  }

  crearSala(data: any): Observable<Sala> {
    return this.http.post<Sala>(`${this.apiUrl}/salas`, data);
  }

  actualizarSala(id: number, data: any): Observable<Sala> {
    return this.http.patch<Sala>(`${this.apiUrl}/salas/${id}`, data);
  }

  eliminarSala(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/salas/${id}`);
  }

  // Habitaciones
  listarHabitaciones(salaId: number): Observable<Habitacion[]> {
    return this.http.get<any>(`${this.apiUrl}/habitaciones/${salaId}`).pipe(map(r => r.data ?? r));
  }

  crearHabitacion(data: any): Observable<Habitacion> {
    return this.http.post<Habitacion>(`${this.apiUrl}/habitaciones`, data);
  }

  actualizarHabitacion(id: number, data: any): Observable<Habitacion> {
    return this.http.patch<Habitacion>(`${this.apiUrl}/habitaciones/${id}`, data);
  }

  eliminarHabitacion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/habitaciones/${id}`);
  }

  // Camas
  listarCamas(habitacionId: number): Observable<Cama[]> {
    return this.http.get<any>(`${this.apiUrl}/camas/${habitacionId}`).pipe(map(r => r.data ?? r));
  }

  crearCama(data: any): Observable<Cama> {
    return this.http.post<Cama>(`${this.apiUrl}/camas`, data);
  }

  actualizarCama(id: number, data: any): Observable<Cama> {
    return this.http.patch<Cama>(`${this.apiUrl}/camas/${id}`, data);
  }

  eliminarCama(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/camas/${id}`);
  }

  // ── GESTIÓN CLÍNICA (ADMISIÓN, EGRESO, TRASLADOS) ────────────────────────

  admitirPaciente(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admisiones`, data);
  }

  listarIngresosActivos(servicioId?: number): Observable<any[]> {
    const url = servicioId ? `${this.apiUrl}/ingresos-activos?servicioId=${servicioId}` : `${this.apiUrl}/ingresos-activos`;
    return this.http.get<any>(url).pipe(map(r => r.data ?? r));
  }

  registrarEgreso(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/egresos`, data);
  }

  liberarCama(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/camas/${id}/liberar`, {});
  }

  trasladarPaciente(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/traslados`, data);
  }

  listarCamasDisponibles(servicioId?: number): Observable<any[]> {
    const url = servicioId ? `${this.apiUrl}/camas-disponibles?servicioId=${servicioId}` : `${this.apiUrl}/camas-disponibles`;
    return this.http.get<any>(url).pipe(map(r => r.data ?? r));
  }

  listarHistorialEgresos(servicioId?: number): Observable<any[]> {
    const url = servicioId ? `${this.apiUrl}/historial-egresos?servicioId=${servicioId}` : `${this.apiUrl}/historial-egresos`;
    return this.http.get<any>(url).pipe(map(r => r.data ?? r));
  }

  listarNotasEvolucion(ingresoId: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/seguimiento/${ingresoId}`).pipe(map(r => r.data ?? r));
  }

  obtenerMapaCamas(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/mapa-camas`).pipe(map(r => r.data ?? r));
  }

  descargarNotasPdf(ingresoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reporte-notas/${ingresoId}`, { responseType: 'blob' });
  }

  descargarKardexPdf(ingresoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reporte-kardex/${ingresoId}`, { responseType: 'blob' });
  }

  registrarNotaEvolucion(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/notas`, data).pipe(map(r => r.data ?? r));
  }

  // Kardex
  listarKardex(ingresoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/kardex/${ingresoId}`).pipe(map(r => r.data ?? r));
  }

  registrarAdministracion(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/kardex`, data);
  }

  // Signos Vitales
  listarSignosVitales(ingresoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/signos-vitales/${ingresoId}`).pipe(map(r => r.data ?? r));
  }

  registrarSignosVitales(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/signos-vitales`, data);
  }

  obtenerEstadisticas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas`).pipe(map(r => r.data ?? r));
  }
}
