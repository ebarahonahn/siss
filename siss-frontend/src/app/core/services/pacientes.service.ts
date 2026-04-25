import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/pacientes`;

  buscar(termino: string, pagina = 1, limite = 20): Observable<any> {
    const params = new HttpParams()
      .set('q', termino)
      .set('pagina', pagina)
      .set('limite', limite);
    return this.http.get<any>(`${this.base}/buscar`, { params });
  }

  obtenerPerfil(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  crear(datos: any): Observable<any> {
    return this.http.post<any>(this.base, datos);
  }

  actualizar(id: number, datos: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, datos);
  }

  validarDniRnp(dni: string): Observable<any> {
    return this.http.get<any>(`${this.base}/validar-rnp/${dni}`);
  }

  eliminar(id: number): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/eliminar`, {});
  }
}
