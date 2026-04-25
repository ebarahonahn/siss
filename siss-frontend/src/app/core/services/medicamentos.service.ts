import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Medicamento {
  id: number;
  codigo: string;
  nombreGenerico: string;
  nombreComercial: string | null;
  presentacion: string;
  concentracion: string;
  via: string;
  grupoTerapeutico: string;
  requiereReceta: boolean;
  esControlado: boolean;
  activo: boolean;
  stock?: number;
}

@Injectable({ providedIn: 'root' })
export class MedicamentosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/medicamentos`;

  buscar(q: string) {
    return this.http.get<any>(`${this.base}/buscar`, { params: { q } })
      .pipe(map(r => (r.data ?? r) as Medicamento[]));
  }

  listar(pagina = 1, limite = 20, busqueda?: string) {
    let params = new HttpParams().set('pagina', pagina).set('limite', limite);
    if (busqueda) params = params.set('q', busqueda);
    return this.http.get<any>(this.base, { params }).pipe(map(r => r.data ?? r));
  }

  obtener(id: number) {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => r.data ?? r));
  }

  crear(dto: Partial<Medicamento>) {
    return this.http.post<any>(this.base, dto).pipe(map(r => r.data ?? r));
  }

  actualizar(id: number, dto: Partial<Medicamento>) {
    return this.http.patch<any>(`${this.base}/${id}`, dto).pipe(map(r => r.data ?? r));
  }

  toggleActivo(id: number) {
    return this.http.patch<any>(`${this.base}/${id}/toggle-activo`, {}).pipe(map(r => r.data ?? r));
  }
}
