import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConfiguracionDocumento {
  id: number;
  codigo: string;
  tituloEncabezado: string;
  subtitulo: string;
  tituloVisor: string;
  nombreArchivo: string;
  creadoEn: string;
  actualizadoEn: string;
}

export type ActualizacionConfiguracionDocumento = Pick<
  ConfiguracionDocumento,
  'tituloEncabezado' | 'subtitulo' | 'tituloVisor' | 'nombreArchivo'
>;

export type NuevaConfiguracionDocumento = ActualizacionConfiguracionDocumento & {
  codigo: string;
};

@Injectable({ providedIn: 'root' })
export class ConfiguracionDocumentosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/configuracion/documentos`;

  obtener(codigo: string): Observable<ConfiguracionDocumento> {
    return this.http
      .get<any>(`${this.apiUrl}/${encodeURIComponent(codigo)}`)
      .pipe(map((res) => res.data));
  }

  listar(): Observable<ConfiguracionDocumento[]> {
    return this.http
      .get<any>(this.apiUrl)
      .pipe(map((res) => res.data));
  }

  crear(data: NuevaConfiguracionDocumento): Observable<ConfiguracionDocumento> {
    return this.http
      .post<any>(this.apiUrl, data)
      .pipe(map((res) => res.data));
  }

  actualizar(
    codigo: string,
    data: ActualizacionConfiguracionDocumento,
  ): Observable<ConfiguracionDocumento> {
    return this.http
      .put<any>(`${this.apiUrl}/${encodeURIComponent(codigo)}`, data)
      .pipe(map((res) => res.data));
  }
}
