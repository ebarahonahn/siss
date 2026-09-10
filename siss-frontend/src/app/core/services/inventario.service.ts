import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InventarioItem {
  id: number;
  medicamentoId: number;
  establecimientoId: number;
  cantidadActual: number;
  cantidadMinima: number;
  lote: string | null;
  fechaVencimiento: string | null;
  ubicacion: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string | null;
  medicamento: {
    id: number;
    codigo: string;
    nombreGenerico: string;
    nombreComercial: string | null;
    presentacion: string;
    concentracion: string;
    via: string;
    grupoTerapeutico: string;
    requiereReceta: boolean;
    esControlado: boolean;
  };
  creadoPor:      { id: number; nombres: string; apellidos: string } | null;
  actualizadoPor: { id: number; nombres: string; apellidos: string } | null;
  establecimiento?: { id: number; nombre: string; codigo: string };
}

export interface AsignarDto {
  medicamentoId: number;
  establecimientoId: number;
  cantidadActual: number;
  cantidadMinima: number;
  lote?: string;
  fechaVencimiento?: string;
  ubicacion?: string;
}

export interface ActualizarDto {
  motivoAjuste?: string;
  cantidadActual?: number;
  cantidadMinima?: number;
  lote?: string;
  fechaVencimiento?: string;
  ubicacion?: string;
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/inventario`;

  listar(busqueda?: string): Observable<InventarioItem[]> {
    let params = new HttpParams();
    if (busqueda) params = params.set('q', busqueda);
    return this.http.get<any>(this.base, { params }).pipe(map(r => r.data ?? r));
  }

  listarAdmin(busqueda?: string, establecimientoId?: number): Observable<InventarioItem[]> {
    let params = new HttpParams();
    if (busqueda) params = params.set('q', busqueda);
    if (establecimientoId) params = params.set('establecimientoId', establecimientoId);
    return this.http.get<any>(`${this.base}/admin`, { params }).pipe(map(r => r.data ?? r));
  }

  stockBajo(): Observable<InventarioItem[]> {
    return this.http.get<any>(`${this.base}/stock-bajo`).pipe(map(r => r.data ?? r));
  }

  asignar(dto: AsignarDto): Observable<InventarioItem> {
    return this.http.post<any>(this.base, dto).pipe(map(r => r.data ?? r));
  }

  actualizar(id: number, dto: ActualizarDto): Observable<InventarioItem> {
    return this.http.patch<any>(`${this.base}/${id}`, dto).pipe(map(r => r.data ?? r));
  }

  eliminar(id: number): Observable<InventarioItem> {
    return this.http.delete<any>(`${this.base}/${id}`).pipe(map(r => r.data ?? r));
  }

  cargaMasiva(dto: any): Observable<any> {
    return this.http.post<any>(`${this.base}/carga-masiva`, dto).pipe(map(r => r.data ?? r));
  }

  obtenerMovimientos(id: number): Observable<MovimientoInventario[]> {
    return this.http.get<any>(`${this.base}/${id}/movimientos`).pipe(map(r => r.data ?? r));
  }

  productosConHistorial(): Observable<ProductoInventario[]> {
    return this.http.get<any>(`${this.base}/productos-historial`).pipe(map(r => r.data ?? r));
  }

  movimientosPorProducto(id: number): Observable<MovimientoInventario[]> {
    return this.http.get<any>(`${this.base}/productos/${id}/movimientos`).pipe(map(r => r.data ?? r));
  }
}

export type ProductoInventario = Pick<InventarioItem, 'medicamentoId' | 'medicamento' | 'cantidadActual'>;

export interface MovimientoInventario {
  inventario?: { lote: string | null };
  id: number;
  inventarioId: number;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'CONSUMO';
  cantidad: number;
  motivo: string | null;
  fecha: string;
  usuario: {
    id: number;
    nombres: string;
    apellidos: string;
  };
}
