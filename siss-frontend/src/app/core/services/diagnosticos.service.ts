import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CatDiagnostico {
  id: number;
  codigo: string;
  descripcion: string;
  capitulo: string | null;
  activo: boolean;
  notificable: boolean;
}

@Injectable({ providedIn: 'root' })
export class DiagnosticosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/diagnosticos`;

  buscar(q: string) {
    return this.http.get<any>(`${this.base}/buscar`, { params: { q } })
      .pipe(map(r => (r.data ?? r) as CatDiagnostico[]));
  }

  listar(pagina = 1, limite = 50, busqueda?: string) {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('limite', limite);
    if (busqueda) params = params.set('busqueda', busqueda);
    return this.http.get<any>(this.base, { params }).pipe(map(r => r.data ?? r));
  }

  crear(dto: { codigo: string; descripcion: string; capitulo?: string }) {
    return this.http.post<any>(this.base, dto).pipe(map(r => r.data ?? r));
  }

  actualizar(id: number, dto: Partial<CatDiagnostico>) {
    return this.http.patch<any>(`${this.base}/${id}`, dto).pipe(map(r => r.data ?? r));
  }
}
