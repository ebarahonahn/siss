import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ControlPrenatalService {
  private apiUrl = `${environment.apiUrl}/control-prenatal`;

  constructor(private http: HttpClient) { }

  captarEmbarazo(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/captacion`, dto);
  }

  registrarControl(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/control`, dto);
  }

  getEmbarazoActivo(pacienteId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/paciente/${pacienteId}/activo`);
  }

  getEmbarazoById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getHistorial(pacienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/paciente/${pacienteId}/historial`);
  }

  exportarSip(embarazoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/export/${embarazoId}/sip`);
  }

  exportarPdf(embarazoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/${embarazoId}/pdf`, { responseType: 'blob' });
  }

  getEmbarazosActivos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/lista/activos`);
  }

  buscar(termino: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/buscar`, { params: { q: termino } });
  }

  finalizarEmbarazo(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/finalizar`, dto);
  }

  actualizarGestacion(id: number, dto: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/gestacion`, dto);
  }
}
