import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReferenciasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/referencias`;

  crear(data: any) {
    return this.http.post<any>(this.apiUrl, data);
  }

  obtenerPorPaciente(pacienteId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/paciente/${pacienteId}`);
  }

  obtenerPorHistoria(historiaId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/historia/${historiaId}`);
  }
}
