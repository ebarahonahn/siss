import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/servicios`;

  obtenerCatalogo() {
    return this.http.get<any>(`${this.base}/catalogo`).pipe(
      map(r => r.data ?? r)
    );
  }
}
