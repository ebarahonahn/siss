import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PediatriaService {
  private apiUrl = `${environment.apiUrl}/pediatria`;

  constructor(private http: HttpClient) { }

  registrarControl(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/control-nino-sano`, dto);
  }

  getHistorialCrecimiento(pacienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/paciente/${pacienteId}/historial-crecimiento`);
  }

  getControles(pacienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/paciente/${pacienteId}/controles`);
  }

  getRoadmapVacunacion(pacienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/paciente/${pacienteId}/roadmap-vacunas`);
  }

  eliminarControl(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/control/${id}/eliminar`, {});
  }

  generarPdf(pacienteId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/paciente/${pacienteId}/pdf`, { responseType: 'blob' });
  }

  generarPdfControl(controlId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/control/${controlId}/pdf`, { responseType: 'blob' });
  }
}


