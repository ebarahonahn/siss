
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
}
