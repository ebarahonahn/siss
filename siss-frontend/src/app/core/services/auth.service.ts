import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UsuarioActual {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
  permisos: string[] | Record<string, any>;
  establecimientoId: number;
  servicioId?: number;
  asignacionId?: number;
  especialidadId?: number;
  establecimientoNombre?: string;
  servicioNombre?: string;
}

export interface LoginResponse {
  requiereSeleccion?: boolean;
  requiereCambioContrasena?: boolean;
  usuario?: UsuarioActual;
  accessToken?: string;
  refreshToken?: string;
  asignaciones?: {
    id: number;
    establecimiento: string;
    servicio: string;
    rol: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private usuarioSubject = new BehaviorSubject<UsuarioActual | null>(
    this.cargarUsuarioGuardado(),
  );

  usuario$ = this.usuarioSubject.asObservable();

  login(identificador: string, contrasena: string, asignacionId?: number): Observable<LoginResponse> {
    return this.http
      .post<any>(`${environment.apiUrl}/auth/login`, { identificador, contrasena, asignacionId })
      .pipe(
        map(res => res.data),
        tap((res: LoginResponse) => {
          if (res.requiereSeleccion) return;
          
          const { accessToken, refreshToken, usuario } = res;
          if (accessToken && refreshToken && usuario) {
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            localStorage.setItem('usuario', JSON.stringify(usuario));
            this.usuarioSubject.next(usuario);
          }
        }),
      );
  }

  renovarToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http
      .post<any>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        map(res => res.data),
        tap((res) => {
          localStorage.setItem('access_token', res.accessToken);
        }),
      );
  }

  cerrarSesion() {
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {})
      .subscribe({ error: () => {} });

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('usuario');
    this.usuarioSubject.next(null);
    this.router.navigate(['/login']);
  }

  solicitarRecuperacion(identificador: string): Observable<any> {
    return this.http
      .post<any>(`${environment.apiUrl}/auth/recuperar-contrasena`, { identificador })
      .pipe(map(res => res.data));
  }
 
  cambiarContrasena(nuevaContrasena: string): Observable<any> {
    return this.http
      .post<any>(`${environment.apiUrl}/auth/cambiar-contrasena`, { nuevaContrasena })
      .pipe(map(res => res.data));
  }

  obtenerToken(): string | null {
    return localStorage.getItem('access_token');
  }

  obtenerUsuario(): UsuarioActual | null {
    return this.usuarioSubject.value;
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  tieneRol(...roles: string[]): boolean {
    const usuario = this.obtenerUsuario();
    return !!usuario && roles.includes(usuario.rol);
  }

  tieneAccesoModulo(modulo: string): boolean {
    const usuario = this.obtenerUsuario();
    if (!usuario) return false;
    const p = usuario.permisos;
    
    // Si es un array plano (nuevo formato)
    if (Array.isArray(p)) {
      if (p.includes('all')) return true;
      // Busca cualquier permiso que empiece con el nombre del módulo
      return p.some(slug => slug.startsWith(`${modulo}:`));
    }

    // Si es un objeto (formato antiguo - por compatibilidad)
    if (p && typeof p === 'object') {
      if (p['all']) return true;
      const acciones = (p as any)[modulo];
      return Array.isArray(acciones) && acciones.length > 0;
    }

    return false;
  }

  tienePermiso(slug: string): boolean {
    const usuario = this.obtenerUsuario();
    if (!usuario) return false;
    const p = usuario.permisos;
    
    if (Array.isArray(p)) {
      return p.includes('all') || p.includes(slug);
    }
    
    return false;
  }

  private cargarUsuarioGuardado(): UsuarioActual | null {
    try {
      const guardado = localStorage.getItem('usuario');
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  }
}
