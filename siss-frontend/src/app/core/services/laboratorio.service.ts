import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';

export interface ExamenLaboratorio {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  indicaciones: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LaboratorioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/laboratorio`;

  listarCatalogo(busqueda?: string, categoria?: string, establecimientoId?: number): Observable<ExamenLaboratorio[]> {
    let params: any = {};
    if (busqueda) params.busqueda = busqueda;
    if (categoria) params.categoria = categoria;
    if (establecimientoId) params.establecimientoId = establecimientoId;
    return this.http.get<any>(`${this.apiUrl}/catalogo`, { params })
      .pipe(map(r => r.data ?? r));
  }

  listarCategorias(): Observable<string[]> {
    return this.http.get<any>(`${this.apiUrl}/categorias`)
      .pipe(map(r => r.data ?? r));
  }

  listarPorEstablecimiento(id: number): Observable<ExamenLaboratorio[]> {
    return this.http.get<any>(`${this.apiUrl}/establecimiento/${id}`)
      .pipe(map(r => r.data ?? r));
  }

  asignar(establecimientoId: number, examenIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/asignar`, { establecimientoId, examenIds });
  }
}
