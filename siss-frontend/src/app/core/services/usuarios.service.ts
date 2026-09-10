import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UsuarioResumen {
  id: number;
  numeroEmpleado: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  activo: boolean;
  ultimoAcceso: string | null;
  numeroColegiado: string | null;
  rol: { id: number; nombre: string };
  establecimiento: { id: number; nombre: string };
  especialidad: { id: number; nombre: string } | null;
  asignaciones: AsignacionUsuario[];
}

export interface AsignacionUsuario {
  id: number;
  establecimiento: { id: number; nombre: string };
  servicio: { id: number; catServicio?: { nombre: string }; nombre?: string } | null;
  especialidad: { id: number; nombre: string } | null;
  rol: { id: number; nombre: string } | null;
  permisos: string[] | null;
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
}

export interface ListaUsuarios {
  total: number;
  pagina: number;
  limite: number;
  items: UsuarioResumen[];
}

export interface CrearUsuarioPayload {
  numeroEmpleado: string;
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
  telefono?: string;
  rol: string;
  asignaciones: { establecimientoId: number; servicioId?: number; especialidadId?: number; rolId?: number }[];
  especialidadId?: number;
  numeroColegiado?: string;
}

export interface ActualizarUsuarioPayload {
  nombres?: string;
  apellidos?: string;
  correo?: string;
  telefono?: string;
  especialidadId?: number;
  numeroColegiado?: string;
  activo?: boolean;
  contrasena?: string;
  rol?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/usuarios`;

  listar(pagina = 1, limite = 20, q = '') {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());
    if (q) params = params.set('q', q);
    
    return this.http.get<ApiResponse<ListaUsuarios>>(this.base, { params })
      .pipe(map(res => res.data));
  }

  obtener(id: number) {
    return this.http.get<ApiResponse<UsuarioResumen>>(`${this.base}/${id}`)
      .pipe(map(res => res.data));
  }

  crear(payload: CrearUsuarioPayload) {
    return this.http.post<ApiResponse<UsuarioResumen>>(this.base, payload)
      .pipe(map(res => res.data));
  }

  actualizar(id: number, payload: ActualizarUsuarioPayload) {
    return this.http.put<ApiResponse<UsuarioResumen>>(`${this.base}/${id}`, payload)
      .pipe(map(res => res.data));
  }

  toggleActivo(id: number) {
    return this.http.patch<ApiResponse<UsuarioResumen>>(`${this.base}/${id}/toggle-activo`, {})
      .pipe(map(res => res.data));
  }

  // --- Gestión de Asignaciones ---
  agregarAsignacion(payload: { usuarioId: number; establecimientoId: number; servicioId?: number; especialidadId?: number; rolId?: number }) {
    return this.http.post<ApiResponse<any>>(`${this.base}/asignaciones`, payload)
      .pipe(map(res => res.data));
  }

  quitarAsignacion(id: number) {
    return this.http.delete<ApiResponse<any>>(`${this.base}/asignaciones/${id}`)
      .pipe(map(res => res.data));
  }

  actualizarPermisosAsignacion(id: number, permisos: string[]) {
    return this.http.patch<ApiResponse<any>>(`${this.base}/asignaciones/${id}/permisos`, { permisos })
      .pipe(map(res => res.data));
  }

  // Catálogos
  listarEstablecimientos() {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/establecimientos`)
      .pipe(map(res => res.data));
  }

  listarEspecialidades() {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/especialidades`)
      .pipe(map(res => res.data));
  }

  listarServicios(establecimientoId: number) {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/servicios/establecimiento/${establecimientoId}`)
      .pipe(map(res => res.data));
  }

  listarMedicos(establecimientoId?: number) {
    let params = new HttpParams();
    if (establecimientoId) params = params.set('establecimientoId', establecimientoId.toString());
    return this.http.get<ApiResponse<any[]>>(`${this.base}/medicos-establecimiento`, { params })
      .pipe(map(res => res.data));
  }
}
