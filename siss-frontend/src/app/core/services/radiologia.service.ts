import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';

export interface ExamenRadiologico {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  indicaciones?: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RadiologiaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/radiologia`;

  listarCatalogo(filtros: any = {}): Observable<ExamenRadiologico[]> {
    return this.http.get<any>(`${this.apiUrl}/catalogo`, { params: filtros })
      .pipe(map(res => res.data ?? res));
  }

  listarPorEstablecimiento(establecimientoId: number): Observable<ExamenRadiologico[]> {
    return this.listarCatalogo({ establecimientoId });
  }

  listarCategorias(): Observable<string[]> {
    return this.http.get<any>(`${this.apiUrl}/categorias`)
      .pipe(map(res => res.data ?? res));
  }

  crearEstudio(estudio: Partial<ExamenRadiologico>): Observable<ExamenRadiologico> {
    return this.http.post<any>(`${this.apiUrl}/estudios`, estudio)
      .pipe(map(res => res.data ?? res));
  }

  actualizarEstudio(id: number, estudio: Partial<ExamenRadiologico>): Observable<ExamenRadiologico> {
    return this.http.patch<any>(`${this.apiUrl}/estudios/${id}`, estudio)
      .pipe(map(res => res.data ?? res));
  }

  asignarEstudios(establecimientoId: number, estudiosIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/asignar`, { establecimientoId, estudiosIds })
      .pipe(map(res => res.data ?? res));
  }

  obtenerAsignaciones(establecimientoId: number): Observable<number[]> {
    return this.http.get<any>(`${this.apiUrl}/asignaciones/${establecimientoId}`)
      .pipe(map(res => res.data ?? res));
  }
}
