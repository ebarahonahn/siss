import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ParametrosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/parametros`;

  obtenerPorClave(clave: string) {
    return this.http.get<any>(`${this.apiUrl}/${clave}`).pipe(map(res => res.data ?? res));
  }

  listarTodos() {
    return this.http.get<any>(this.apiUrl).pipe(map(res => res.data ?? res));
  }
}
