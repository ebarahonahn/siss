import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService, MovimientoInventario, ProductoInventario } from '../../core/services/inventario.service';
import * as XLSX from 'xlsx';

interface MovimientoConProducto extends MovimientoInventario {
  productoNombre?: string;
  lote?: string | null;
}

@Component({
  selector: 'app-movimientos-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">

      <!-- Encabezado -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Movimientos de Inventario</h1>
          <p class="text-sm text-gray-500 mt-1">Historial de entradas, salidas y ajustes por producto</p>
        </div>
        <!-- Botón Exportar -->
        <button *ngIf="movimientosFiltrados.length > 0"
                (click)="exportarExcel()"
                class="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow-md hover:shadow-emerald-500/20 active:scale-95">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Exportar Excel
        </button>
      </div>

      <!-- Panel de Filtros -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

          <!-- Buscador de producto -->
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Buscar Producto</label>
            <div class="relative">
              <input
                [(ngModel)]="busqueda"
                (ngModelChange)="filtrarProductos()"
                type="text"
                placeholder="Nombre genérico, código..."
                class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
              />
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <!-- Dropdown sugerencias -->
            <div *ngIf="productosFiltrados.length > 0 && !productoSeleccionado" class="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
              <button *ngFor="let p of productosFiltrados"
                      (click)="seleccionarProducto(p)"
                      class="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-50 last:border-0">
                <span class="font-medium">{{ p.medicamento.nombreGenerico }}</span>
                <span class="text-gray-400 ml-2 text-xs">{{ p.medicamento.codigo }}</span>
                <span class="text-gray-400 ml-2 text-xs">{{ p.medicamento.presentacion }} · {{ p.medicamento.concentracion }}</span>
              </button>
            </div>
          </div>

          <!-- Filtro por tipo -->
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Tipo de Movimiento</label>
            <select [(ngModel)]="filtroTipo" (ngModelChange)="aplicarFiltros()"
                    class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all">
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="AJUSTE">Ajuste</option>
              <option value="CONSUMO">Consumo</option>
              <option value="DISPENSACION">Dispensación</option>
              <option value="CADUCADO">Caducado</option>
              <option value="PERDIDA">Pérdida</option>
            </select>
          </div>

          <!-- Limpiar selección -->
          <div class="flex items-end">
            <button *ngIf="productoSeleccionado"
                    (click)="limpiarSeleccion()"
                    class="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              Limpiar selección
            </button>
          </div>
        </div>

        <!-- Producto seleccionado badge -->
        <div *ngIf="productoSeleccionado" class="mt-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <div class="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-blue-800 truncate">{{ productoSeleccionado.medicamento.nombreGenerico }}</p>
            <p class="text-xs text-blue-500">
              {{ productoSeleccionado.medicamento.codigo }} ·
              {{ productoSeleccionado.medicamento.presentacion }} ·
              {{ productoSeleccionado.medicamento.concentracion }}
              <span> · Todos los lotes</span>
            </p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-xs font-bold text-blue-700">Stock total activo</p>
            <p class="text-xl font-black text-blue-800">{{ productoSeleccionado.cantidadActual }}</p>
          </div>
        </div>
      </div>

      <!-- Estado: sin selección -->
      <div *ngIf="!productoSeleccionado" class="bg-white rounded-2xl border border-dashed border-gray-200 p-16 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
        </div>
        <p class="text-gray-500 font-semibold text-base mb-1">Seleccione un producto</p>
        <p class="text-gray-400 text-sm">Use el buscador para encontrar el medicamento y ver su historial de movimientos</p>
      </div>

      <!-- Cargando -->
      <div *ngIf="cargando" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center gap-3">
        <svg class="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <p class="text-sm text-gray-500 font-medium">Cargando movimientos...</p>
      </div>

      <!-- Tabla de movimientos -->
      <div *ngIf="productoSeleccionado && !cargando">

        <!-- Tarjetas de resumen -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Total Movimientos</p>
            <p class="text-3xl font-black text-gray-800">{{ movimientosFiltrados.length }}</p>
          </div>
          <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4">
            <p class="text-xs font-bold text-green-500 uppercase tracking-wide mb-1">Entradas</p>
            <p class="text-3xl font-black text-green-700">{{ contarTipo('ENTRADA') }}</p>
          </div>
          <div class="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-4">
            <p class="text-xs font-bold text-red-400 uppercase tracking-wide mb-1">Salidas / Dispensaciones</p>
            <p class="text-3xl font-black text-red-700">{{ contarTipo('SALIDA') + contarTipo('CONSUMO') + contarTipo('DISPENSACION') + contarTipo('CADUCADO') + contarTipo('PERDIDA') }}</p>
          </div>
          <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4">
            <p class="text-xs font-bold text-amber-500 uppercase tracking-wide mb-1">Ajustes</p>
            <p class="text-3xl font-black text-amber-700">{{ contarTipo('AJUSTE') }}</p>
          </div>
        </div>

        <!-- Sin movimientos -->
        <div *ngIf="movimientosFiltrados.length === 0" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p class="text-gray-400 font-medium">No se encontraron movimientos con los filtros aplicados</p>
        </div>

        <!-- Tabla -->
        <div *ngIf="movimientosFiltrados.length > 0" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-100">
                  <th class="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">#</th>
                  <th class="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th class="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Cantidad</th>
                  <th class="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Lote</th><th class="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Motivo</th>
                  <th class="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Realizado por</th>
                  <th class="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Fecha</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr *ngFor="let mov of movimientosFiltrados; let i = index"
                    class="hover:bg-gray-50 transition-colors">
                  <td class="px-5 py-3.5 text-gray-400 font-mono text-xs">{{ i + 1 }}</td>

                  <!-- Badge de tipo -->
                  <td class="px-5 py-3.5">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                          [ngClass]="{
                            'bg-green-100 text-green-700': mov.tipo === 'ENTRADA',
                            'bg-red-100 text-red-700': mov.tipo === 'SALIDA',
                            'bg-blue-100 text-blue-700': mov.tipo === 'CONSUMO',
                            'bg-amber-100 text-amber-700': mov.tipo === 'AJUSTE'
                          }">
                      <span class="w-1.5 h-1.5 rounded-full"
                            [ngClass]="{
                              'bg-green-500': mov.tipo === 'ENTRADA',
                              'bg-red-500': mov.tipo === 'SALIDA',
                              'bg-blue-500': mov.tipo === 'CONSUMO',
                              'bg-amber-500': mov.tipo === 'AJUSTE'
                            }"></span>
                      {{ etiquetaTipo(mov.tipo) }}
                    </span>
                  </td>

                  <!-- Cantidad con signo -->
                  <td class="px-5 py-3.5">
                    <span class="font-bold text-base"
                          [ngClass]="{
                            'text-green-600': mov.tipo === 'ENTRADA',
                            'text-red-600': mov.tipo === 'SALIDA' || mov.tipo === 'CONSUMO',
                            'text-amber-600': mov.tipo === 'AJUSTE'
                          }">
                      {{ mov.tipo === 'ENTRADA' ? '+' : (mov.tipo === 'AJUSTE' && mov.cantidad > 0 ? '+' : '') }}{{ mov.cantidad }}
                    </span>
                    <span class="text-gray-400 text-xs ml-1">un.</span>
                  </td>

                  <td class="px-5 py-3.5 text-gray-600">{{ mov.inventario?.lote || '—' }}</td><td class="px-5 py-3.5 text-gray-600 max-w-[240px]">
                    <span class="truncate block" [title]="mov.motivo || ''">{{ mov.motivo || '—' }}</span>
                  </td>

                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span class="text-blue-700 text-[10px] font-bold">
                          {{ mov.usuario.nombres.charAt(0) }}{{ mov.usuario.apellidos.charAt(0) }}
                        </span>
                      </div>
                      <span class="text-gray-700 text-xs font-medium">{{ mov.usuario.nombres }} {{ mov.usuario.apellidos }}</span>
                    </div>
                  </td>

                  <td class="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                    {{ formatFecha(mov.fecha) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
            <span class="text-xs text-gray-400 font-medium">Mostrando {{ movimientosFiltrados.length }} de {{ movimientos.length }} registros</span>
            <button (click)="exportarExcel()"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs transition-all">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Exportar Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MovimientosInventarioComponent implements OnInit, OnDestroy {
  private consulta?: Subscription;
  private notification = inject(NotificationService);
  ngOnDestroy() { this.consulta?.unsubscribe(); }
  private svc = inject(InventarioService);

  busqueda = '';
  filtroTipo = '';
  cargando = false;

  todos: ProductoInventario[] = [];
  productosFiltrados: ProductoInventario[] = [];
  productoSeleccionado: ProductoInventario | null = null;

  movimientos: MovimientoInventario[] = [];
  movimientosFiltrados: MovimientoInventario[] = [];

  ngOnInit() {
    this.svc.productosConHistorial().subscribe({ next: (items) => (this.todos = items), error: () => {} });
  }

  filtrarProductos() {
    this.consulta?.unsubscribe();
    this.cargando = false;
    this.productoSeleccionado = null;
    this.movimientos = [];
    this.movimientosFiltrados = [];
    const q = this.busqueda.toLowerCase().trim();
    if (!q) { this.productosFiltrados = []; return; }
    this.productosFiltrados = this.todos.filter(
      p => p.medicamento.nombreGenerico.toLowerCase().includes(q) ||
           p.medicamento.codigo.toLowerCase().includes(q) ||
           (p.medicamento.nombreComercial?.toLowerCase().includes(q))
    ).slice(0, 10);
  }

  seleccionarProducto(p: ProductoInventario) {
    this.productoSeleccionado = p;
    this.busqueda = p.medicamento.nombreGenerico;
    this.productosFiltrados = [];
    this.cargarMovimientos();
  }

  cargarMovimientos() {
    if (!this.productoSeleccionado) return;
    this.cargando = true;
    this.consulta?.unsubscribe();
    this.consulta = this.svc.movimientosPorProducto(this.productoSeleccionado.medicamentoId).subscribe({
      next: (movs) => {
        this.movimientos = movs;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: () => { this.cargando = false; this.notification.error('No se pudieron cargar los movimientos del producto'); }
    });
  }

  aplicarFiltros() {
    this.movimientosFiltrados = this.filtroTipo
      ? this.movimientos.filter(m => m.tipo === this.filtroTipo)
      : [...this.movimientos];
  }

  limpiarSeleccion() {
    this.consulta?.unsubscribe();
    this.cargando = false;
    this.productoSeleccionado = null;
    this.busqueda = '';
    this.filtroTipo = '';
    this.movimientos = [];
    this.movimientosFiltrados = [];
    this.productosFiltrados = [];
  }

  contarTipo(tipo: string): number {
    return this.movimientosFiltrados.filter(m => m.tipo === tipo).length;
  }

  etiquetaTipo(tipo: string): string {
    const map: Record<string, string> = {
      ENTRADA: 'Entrada', SALIDA: 'Salida', AJUSTE: 'Ajuste', CONSUMO: 'Consumo',
      CADUCADO: 'Caducado', PERDIDA: 'Pérdida', DISPENSACION: 'Dispensación'
    };
    return map[tipo] ?? tipo;
  }

  formatFecha(fechaISO: string): string {
    if (!fechaISO) return '—';
    // Los movimientos se almacenan en UTC real; convertir a Honduras (UTC-6)
    const utc = new Date(fechaISO);
    const local = new Date(utc.getTime() - 6 * 60 * 60 * 1000);
    const dd  = String(local.getUTCDate()).padStart(2, '0');
    const mm  = String(local.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = local.getUTCFullYear();
    const hh  = String(local.getUTCHours()).padStart(2, '0');
    const min = String(local.getUTCMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  exportarExcel() {
    if (!this.productoSeleccionado || this.movimientosFiltrados.length === 0) return;

    const med = this.productoSeleccionado.medicamento;
    const titulo = `Movimientos de Inventario - ${med.nombreGenerico}`;
    const subtitulo = `Código: ${med.codigo} | Presentación: ${med.presentacion} | Concentración: ${med.concentracion} | Todos los lotes`;
    const filtroStr = this.filtroTipo ? `Tipo filtrado: ${this.etiquetaTipo(this.filtroTipo)}` : 'Todos los tipos';

    // Usar hora LOCAL del navegador para la fecha del reporte
    const ahora = new Date();
    const fechaReporte =
      `${String(ahora.getDate()).padStart(2,'0')}/${String(ahora.getMonth()+1).padStart(2,'0')}/${ahora.getFullYear()} ` +
      `${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`;

    // Filas de datos
    const filas = this.movimientosFiltrados.map((mov, i) => ({
      '#': i + 1,
      'Tipo': this.etiquetaTipo(mov.tipo),
      'Cantidad': mov.cantidad,
      'Lote': mov.inventario?.lote ?? '—',
      'Motivo': mov.motivo ?? '—',
      'Realizado por': mov.usuario ? `${mov.usuario.nombres} ${mov.usuario.apellidos}` : '—',
      'Fecha': this.formatFecha(mov.fecha),
    }));

    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = {};

    XLSX.utils.sheet_add_aoa(ws, [
      [titulo],
      [subtitulo],
      [`Filtro: ${filtroStr}  |  Generado: ${fechaReporte}  |  Total registros: ${this.movimientosFiltrados.length}`],
      [],
    ], { origin: 'A1' });

    XLSX.utils.sheet_add_json(ws, filas, { origin: 'A5' });

    ws['!cols'] = [
      { wch: 5  },
      { wch: 16 },
      { wch: 12 },
      { wch: 20 },
      { wch: 40 },
      { wch: 28 },
      { wch: 18 },
    ];

    const nombreArchivo = `movimientos_${med.codigo}_${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}-${String(ahora.getDate()).padStart(2,'0')}.xlsx`;

    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
    XLSX.writeFile(wb, nombreArchivo);
  }
}

