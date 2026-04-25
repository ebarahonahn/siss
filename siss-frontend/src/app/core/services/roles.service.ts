import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  permisos: Record<string, any>;
  totalUsuarios: number;
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/roles`;

  listar() {
    return this.http.get<any>(this.base).pipe(map(r => r.data as Rol[]));
  }

  obtener(id: number) {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => r.data as Rol));
  }

  actualizar(id: number, payload: { descripcion?: string; permisos?: Record<string, any> }) {
    return this.http.put<any>(`${this.base}/${id}`, payload).pipe(map(r => r.data as Rol));
  }
}
