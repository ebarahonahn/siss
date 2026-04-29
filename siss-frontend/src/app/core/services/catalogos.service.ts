import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, shareReplay } from 'rxjs';

export interface CatalogosData {
  sexos: any[];
  tiposSangre: any[];
  escolaridades: any[];
  estadosCiviles: any[];
  ocupaciones: any[];
  tiposCita: string[];
  estadosCita: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CatalogosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/catalogos`;

  // Cacheamos todos los catálogos en una sola petición
  private todos$ = this.http.get<any>(this.apiUrl).pipe(
    map(res => res.data),
    shareReplay(1)
  );

  obtenerTodos() {
    return this.todos$;
  }

  // Métodos individuales si se necesitan por separado
  listarSexos() { return this.http.get<any>(`${this.apiUrl}/sexos`).pipe(map(res => res.data)); }
  listarTiposSangre() { return this.http.get<any>(`${this.apiUrl}/tipos-sangre`).pipe(map(res => res.data)); }
  listarTiposCita() { return this.http.get<any>(`${this.apiUrl}/tipos-cita`).pipe(map(res => res.data)); }
  listarEstadosCita() { return this.http.get<any>(`${this.apiUrl}/estados-cita`).pipe(map(res => res.data)); }
}
