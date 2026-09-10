import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/citas`;
  private usersUrl = `${environment.apiUrl}/usuarios`;

  crear(dto: any) {
    return this.http.post<any>(this.apiUrl, dto).pipe(map(res => res.data));
  }

  listar(fecha?: string) {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    
    return this.http.get<any>(this.apiUrl, { params }).pipe(map(res => res.data));
  }

  confirmar(id: number) {
    return this.http.patch<any>(`${this.apiUrl}/${id}/confirmar`, {}).pipe(map(res => res.data));
  }

  cancelar(id: number) {
    return this.http.patch<any>(`${this.apiUrl}/${id}/cancelar`, {}).pipe(map(res => res.data));
  }

  marcarNoAsistio(id: number) {
    if (!id || isNaN(Number(id))) {
      console.error('[CITAS SERVICE] ID inválido:', id);
      throw new Error('ID de cita inválido');
    }
    const url = `${this.apiUrl}/${id}/no-asistio`;
    console.log('[CITAS SERVICE] Patch URL:', url);
    return this.http.patch<any>(url, {}).pipe(map(res => res.data));
  }

  // Nuevo método para listar médicos del establecimiento del usuario actual
  listarMedicosDelCentro() {
    return this.http.get<any>(`${this.usersUrl}/medicos-establecimiento`).pipe(map(res => res.data));
  }

  obtenerHorarioDisponible(medicoId: number, fecha: string) {
    const params = new HttpParams().set('medicoId', medicoId.toString()).set('fecha', fecha);
    return this.http.get<any>(`${this.apiUrl}/horario-disponible`, { params }).pipe(map(res => res.data));
  }
}
