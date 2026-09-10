
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VacunacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/vacunacion`;

  obtenerCatalogo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/catalogo`);
  }

  obtenerLotes(establecimientoId: number, vacunaId?: number): Observable<any[]> {
    let url = `${this.apiUrl}/lotes/${establecimientoId}`;
    if (vacunaId) url += `?vacunaId=${vacunaId}`;
    return this.http.get<any[]>(url);
  }

  registrarAplicacion(datos: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/registrar`, datos);
  }

  obtenerHistorial(pacienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/historial/${pacienteId}`);
  }

  crearLote(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/lotes`, datos);
  }

  actualizarLote(id: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/lotes/${id}`, datos);
  }

  eliminarLote(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/lotes/${id}`);
  }

  registrarMovimiento(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/lotes/movimiento`, datos);
  }

  obtenerMovimientos(loteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/lotes/${loteId}/movimientos`);
  }

  // --- METODOS DE MANTENIMIENTO ---

  listarVacunasMantenimiento(page: number = 1, limit: number = 20, search?: string): Observable<any> {
    let url = `${this.apiUrl}/mantenimiento?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.http.get<any>(url);
  }

  obtenerVacunaMantenimiento(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/mantenimiento/${id}`);
  }

  crearVacuna(datos: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/mantenimiento`, datos);
  }

  actualizarVacuna(id: number, datos: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/mantenimiento/${id}`, datos);
  }

  desactivarVacuna(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/mantenimiento/${id}`);
  }

  crearEsquema(vacunaId: number, datos: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/mantenimiento/${vacunaId}/esquemas`, datos);
  }

  actualizarEsquema(vacunaId: number, esquemaId: number, datos: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/mantenimiento/${vacunaId}/esquemas/${esquemaId}`, datos);
  }

  eliminarEsquema(vacunaId: number, esquemaId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/mantenimiento/${vacunaId}/esquemas/${esquemaId}`);
  }
}
