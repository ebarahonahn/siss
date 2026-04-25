import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface DispensacionDetalle {
  detalleRecetaId: number;
  cantidad: number;
}

export interface CreateDispensacion {
  recetaId: number;
  detalles: DispensacionDetalle[];
}

@Injectable({
  providedIn: 'root'
})
export class DispensacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dispensacion`;

  buscarRecetasPendientes(identificador: string) {
    return this.http.get<any[]>(`${this.apiUrl}/recetas-pendientes`, {
      params: { identificador }
    });
  }

  dispensar(dto: CreateDispensacion) {
    return this.http.post<any>(this.apiUrl, dto);
  }

  validarPendiente(pacienteId: number, medicamentoId: number) {
    return this.http.get<any>(`${this.apiUrl}/validar-pendiente`, {
      params: { pacienteId, medicamentoId }
    });
  }

  obtenerVigencia() {
    return this.http.get<number>(`${this.apiUrl}/config/vigencia`);
  }
}
