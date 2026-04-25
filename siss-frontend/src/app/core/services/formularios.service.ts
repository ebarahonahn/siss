import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FormulariosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/formularios`;

  // Plantillas
  listarPlantillas(especialidadId?: number): Observable<any> {
    const params = especialidadId
      ? new HttpParams().set('especialidadId', especialidadId)
      : undefined;
    return this.http.get<any>(`${this.base}/plantillas`, { params });
  }

  obtenerPlantilla(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/plantillas/${id}`);
  }

  obtenerPlantillaActivaPorEspecialidad(espId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/plantillas/especialidad/${espId}/activa`);
  }

  crearPlantilla(datos: any): Observable<any> {
    return this.http.post<any>(`${this.base}/plantillas`, datos);
  }

  actualizarPlantilla(id: number, datos: any): Observable<any> {
    return this.http.put<any>(`${this.base}/plantillas/${id}`, datos);
  }

  activarPlantilla(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/plantillas/${id}/activar`, {});
  }

  duplicarPlantilla(id: number): Observable<any> {
    return this.http.post<any>(`${this.base}/plantillas/${id}/duplicar`, {});
  }

  eliminarPlantilla(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/plantillas/${id}`);
  }

  // Secciones
  crearSeccion(datos: any): Observable<any> {
    return this.http.post<any>(`${this.base}/secciones`, datos);
  }

  actualizarSeccion(id: number, datos: any): Observable<any> {
    return this.http.put<any>(`${this.base}/secciones/${id}`, datos);
  }

  eliminarSeccion(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/secciones/${id}`);
  }

  reordenarSecciones(items: { id: number; orden: number }[]): Observable<any> {
    return this.http.put<any>(`${this.base}/secciones/reordenar`, { items });
  }

  // Campos
  crearCampo(datos: any): Observable<any> {
    return this.http.post<any>(`${this.base}/campos`, datos);
  }

  actualizarCampo(id: number, datos: any): Observable<any> {
    return this.http.put<any>(`${this.base}/campos/${id}`, datos);
  }

  eliminarCampo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/campos/${id}`);
  }

  reordenarCampos(items: { id: number; orden: number }[]): Observable<any> {
    return this.http.put<any>(`${this.base}/campos/reordenar`, { items });
  }

  // Respuestas
  guardarRespuesta(historiaId: number, datos: any): Observable<any> {
    return this.http.post<any>(`${this.base}/respuestas/${historiaId}`, datos);
  }

  obtenerRespuesta(historiaId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/respuestas/${historiaId}`);
  }
}
