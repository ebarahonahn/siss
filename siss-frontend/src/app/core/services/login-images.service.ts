import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';

export interface LoginImage {
  id: number;
  nombre: string;
  titulo?: string;
  descripcion?: string;
  mimetype: string;
  orden: number;
  activo: boolean;
  creadoEn: string;
}

export interface ConfigGeneral {
  id: number;
  siglasSistema: string;
  nombreSistema: string;
  logoMimetype?: string;
  actualizadoEn: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoginImagesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/login-images`;

  getImages(): Observable<LoginImage[]> {
    return this.http.get<any>(this.apiUrl).pipe(map(res => res.data));
  }

  getImagesManagement(): Observable<LoginImage[]> {
    return this.http.get<any>(`${this.apiUrl}/management`).pipe(map(res => res.data));
  }

  uploadImage(formData: FormData): Observable<LoginImage> {
    return this.http.post<any>(this.apiUrl, formData).pipe(map(res => res.data));
  }

  updateImage(id: number, data: Partial<LoginImage>): Observable<LoginImage> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(map(res => res.data));
  }

  deleteImage(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getImageUrl(id: number): string {
    return `${this.apiUrl}/${id}/render`;
  }

  // Configuración General
  getConfig(): Observable<ConfigGeneral> {
    return this.http.get<any>(`${environment.apiUrl}/configuracion`).pipe(
      map(res => res.data)
    );
  }

  updateConfig(formData: FormData): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/configuracion`, formData);
  }

  getLogoUrl(): string {
    return `${environment.apiUrl}/configuracion/logo?t=${new Date().getTime()}`;
  }
}
