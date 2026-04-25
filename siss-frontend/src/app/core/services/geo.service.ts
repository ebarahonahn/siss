import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/geo`;

  listarDepartamentos() {
    return this.http.get<any>(`${this.apiUrl}/departamentos`).pipe(
      map(r => r.data ?? r)
    );
  }

  listarMunicipios(departamentoId: number) {
    return this.http.get<any>(`${this.apiUrl}/departamentos/${departamentoId}/municipios`).pipe(
      map(r => r.data ?? r)
    );
  }

  geocodificar(direccion: string) {
    // Usamos Nominatim de OpenStreetMap (Gratuito para pruebas/volumen bajo)
    // Agregamos Honduras a la búsqueda para mayor precisión
    const q = `${direccion}, Honduras`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
    return this.http.get<any[]>(url);
  }
}
