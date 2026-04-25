import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Servicio {
  id?: number;
  catServicioId: number;
  catServicio?: { id: number; nombre: string };
  activo?: boolean;
}

export interface Establecimiento {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  departamentoId: number;
  municipioId: number;
  telefono?: string;
  activo: boolean;
  municipio?: { id: number; nombre: string };
  departamento?: { id: number; nombre: string };
  servicios?: Servicio[];
}

@Injectable({ providedIn: 'root' })
export class EstablecimientosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/establecimientos`;

  listar(): Observable<Establecimiento[]> {
    return this.http.get<any>(this.base).pipe(map((r) => r.data ?? r));
  }

  listarSimplificado(): Observable<any[]> {
    return this.http.get<any>(`${this.base}/lista/simple`).pipe(map((r) => r.data ?? r));
  }

  obtenerPorId(id: number): Observable<Establecimiento> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map((r) => r.data ?? r));
  }

  crear(data: Partial<Establecimiento>): Observable<Establecimiento> {
    return this.http.post<any>(this.base, data).pipe(map((r) => r.data ?? r));
  }

  actualizar(id: number, data: Partial<Establecimiento>): Observable<Establecimiento> {
    return this.http.patch<any>(`${this.base}/${id}`, data).pipe(map((r) => r.data ?? r));
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`).pipe(map((r) => r.data ?? r));
  }
}
