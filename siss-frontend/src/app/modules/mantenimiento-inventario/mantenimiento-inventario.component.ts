import { Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { InventarioService, InventarioItem, AsignarDto } from '../../core/services/inventario.service';
import { MedicamentosService, Medicamento } from '../../core/services/medicamentos.service';
import { EstablecimientosService } from '../../core/services/establecimientos.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { DateValidators } from '../../core/validators/date.validator';

@Component({
  selector: 'app-mantenimiento-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
<div class="space-y-5">

  <!-- Cabecera -->
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 class="text-xl font-bold text-gray-900 font-serif">Inventario de Medicamentos</h2>
      <p class="text-sm text-gray-500 mt-0.5">Asignación y control de medicamentos por establecimiento</p>
    </div>
    <div class="flex items-center gap-2">
      <button (click)="abrirCargaMasiva()"
              class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors shadow-sm">
        <svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
        Carga Masiva
      </button>
      <button (click)="abrirModal()"
              class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Asignar Medicamento
      </button>
    </div>
  </div>

  <!-- Alertas stock bajo -->
  <div *ngIf="alertasStock().length > 0"
       class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
    <svg class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    </svg>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-amber-800">{{ alertasStock().length }} producto(s) por establecimiento con stock bajo o agotado</p>
      <p class="text-xs text-amber-600 mt-0.5 truncate">
        {{ resumenAlertas() }}
        <span *ngIf="alertasStock().length > 3">…y {{ alertasStock().length - 3 }} más</span>
      </p>
    </div>
  </div>

  <!-- Filtros -->
  <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
    <div class="relative flex-1 min-w-[240px]">
      <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input type="text" placeholder="Buscar medicamento, código, grupo…"
             (input)="busqueda$.next($any($event.target).value)"
             class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
    </div>
    <select *ngIf="esAdmin()" (change)="cambiarEstablecimiento($any($event.target).value)"
            class="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
      <option value="">Todos los establecimientos</option>
      <option *ngFor="let e of establecimientos()" [value]="e.id">{{ e.nombre }}</option>
    </select>
    <span class="text-xs text-gray-400 flex-shrink-0">
      <strong class="text-gray-700">{{ productos().length }}</strong> medicamentos · {{ items().length }} registros de lote
    </span>
  </div>

  <!-- Tabla -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
    <div *ngIf="cargando()" class="p-12 text-center text-gray-400 text-sm">Cargando…</div>

    <div *ngIf="!cargando() && items().length === 0" class="p-12 text-center text-gray-400 text-sm">
      No hay medicamentos asignados a este establecimiento.
    </div>

    <table *ngIf="!cargando() && items().length > 0" class="w-full text-sm">
      <thead class="bg-gray-50 border-b"><tr>
        <th class="p-4 text-left">Medicamento</th><th class="p-4 text-left">Grupo</th><th class="p-4">Stock total</th><th class="p-4">Lotes</th><th class="p-4 text-left">Establecimientos</th><th class="p-4">Acciones</th>
      </tr></thead>
      <tbody><tr *ngFor="let producto of productos()" class="border-b hover:bg-gray-50">
        <td class="p-4"><p class="font-semibold">{{ producto.medicamento.nombreGenerico }}</p><p class="text-xs text-gray-500">{{ producto.medicamento.codigo }} · {{ producto.medicamento.presentacion }} {{ producto.medicamento.concentracion }}</p></td>
        <td class="p-4 text-xs">{{ producto.medicamento.grupoTerapeutico }}</td>
        <td class="p-4 text-center">
          <span class="text-lg font-bold">{{ producto.total }}</span>
          <div *ngFor="let alerta of alertasPorProducto().get(producto.medicamento.id)" class="mt-1">
            <span role="status" class="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold"
                  [class]="alerta.cantidadActual === 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-800'"
                  [title]="nombreEstablecimiento(alerta) + ': ' + alerta.cantidadActual + ' unidades en lotes activos; mínimo: ' + alerta.cantidadMinima">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              {{ alerta.cantidadActual === 0 ? 'Agotado' : 'Stock mínimo' }} · {{ alerta.cantidadActual }} / {{ alerta.cantidadMinima }}
            </span>
            <p *ngIf="esAdmin()" class="text-xs text-gray-500 mt-1">{{ nombreEstablecimiento(alerta) }}</p>
          </div>
        </td>
        <td class="p-4 text-center">{{ producto.lotes.length }}</td><td class="p-4 text-xs">{{ producto.establecimientos }}</td>
        <td class="p-4">
          <button type="button" (click)="abrirEditar(producto.lotes[0])" title="Editar lotes" aria-label="Editar lotes"
                  class="inline-flex items-center justify-center w-9 h-9 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
        </td>
      </tr></tbody>
    </table>
  </div>

  <!-- Modal asignar / editar -->
  <div *ngIf="modalAbierto()" class="fixed inset-0 z-[9999] flex items-center justify-center">
    <!-- Fondo con blur - Extendemos un poco los bordes para evitar la línea blanca -->
    <div class="fixed -top-10 -left-10 -right-10 -bottom-10 bg-black/40 backdrop-blur-sm" (click)="cerrarModal()"></div>
    
    <!-- Contenedor del Modal -->
    <div [class.max-w-5xl]="!!editando()" [class.max-w-lg]="!editando()" class="relative bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden max-h-[90dvh] border border-gray-100 m-4 animate-in fade-in zoom-in duration-200">
      <div class="flex shrink-0 items-center justify-between gap-4 px-5 py-4 border-b border-gray-200 bg-white">
        <h3 class="text-base font-bold text-gray-900 font-serif">
          {{ editando() ? 'Lotes de ' + editando()!.medicamento.nombreGenerico : 'Asignar medicamento' }}
        </h3>
        <button type="button" (click)="cerrarModal()" aria-label="Cerrar modal" title="Cerrar" class="shrink-0 inline-flex items-center justify-center w-9 h-9 text-gray-500 border border-gray-200 rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div *ngIf="editando()" class="px-5 pt-5">
        <p class="text-sm text-gray-600 mb-3">Stock total: <strong>{{ totalLotesEdicion() }}</strong> unidades en los establecimientos incluidos en la consulta.</p>
        <div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm">
          <thead class="bg-gray-50 text-left"><tr><th class="p-3">Lote / Establecimiento</th><th class="p-3">Cantidad</th><th class="p-3">Vencimiento</th><th class="p-3">Estado</th><th class="p-3">Acciones</th></tr></thead>
          <tbody><tr *ngFor="let lote of lotesEdicion()" [class.bg-indigo-50]="lote.id === editando()?.id" class="border-t">
            <td class="p-3"><p class="font-semibold">{{ lote.lote || 'Sin lote' }}</p><p class="text-xs text-gray-500">{{ nombreEstablecimiento(lote) }}</p></td>
            <td class="p-3 font-semibold">{{ lote.cantidadActual }}</td><td class="p-3">{{ lote.fechaVencimiento ? (lote.fechaVencimiento | date:'dd/MM/yyyy':'UTC') : '—' }}</td><td class="p-3">{{ etiquetaEstado(lote) }}</td>
            <td class="p-3 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <button type="button" (click)="seleccionarLote(lote)" [disabled]="guardando()"
                        [attr.aria-pressed]="lote.id === editando()?.id"
                        [attr.aria-label]="lote.id === editando()?.id ? 'Lote seleccionado para editar' : 'Editar lote'"
                        [title]="lote.id === editando()?.id ? 'Lote seleccionado para editar' : 'Editar lote'"
                        [class]="lote.id === editando()?.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'"
                        class="inline-flex items-center justify-center w-9 h-9 rounded-lg border shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg *ngIf="lote.id !== editando()?.id" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  <svg *ngIf="lote.id === editando()?.id" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </button>
                <button type="button" (click)="confirmarEliminar(lote)" [disabled]="guardando()"
                        title="Eliminar lote" aria-label="Eliminar lote"
                        class="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-red-200 bg-red-50 text-red-600 shadow-sm hover:bg-red-100 hover:border-red-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr></tbody>
        </table></div>
        <div class="mt-4 p-4 bg-gray-50 border rounded-lg">
          <h4 class="font-semibold text-gray-800">Stock mínimo por producto y establecimiento</h4>
          <p class="text-xs text-gray-500 mb-3">La alerta compara este mínimo con la suma de los lotes activos del establecimiento.</p>
          <div *ngFor="let config of configuracionesEdicion()" class="flex flex-wrap items-center gap-3 mb-2">
            <label class="text-sm flex-1" [for]="'minimo-' + config.id">{{ nombreEstablecimiento(config) }} · Stock: {{ config.cantidadActual }}</label>
            <input #minimo type="number" min="0" step="1" [id]="'minimo-' + config.id" [value]="config.cantidadMinima" class="w-24 border rounded-lg p-2" />
            <button type="button" (click)="guardarMinimo(config, minimo.value)" [disabled]="guardandoMinimo() || guardando()" class="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold disabled:opacity-50">Guardar mínimo</button>
          </div>
        </div>
        <p class="mt-4 font-semibold text-indigo-900">Editar lote {{ editando()!.lote || 'sin código' }} · {{ nombreEstablecimiento(editando()!) }}</p>
        <p class="text-xs text-gray-500 mt-1">Guarda los cambios de cada lote antes de seleccionar otro. Cambiar la cantidad registra un ajuste de inventario.</p>
      </div>
      <form id="inventario-lote-form" [formGroup]="form" (ngSubmit)="guardar()" class="p-5 space-y-4">
        <!-- Búsqueda medicamento (solo al crear) -->
        <div *ngIf="!editando()" class="space-y-1 relative">
          <label class="text-xs font-semibold text-gray-700 font-bold uppercase tracking-tight">Medicamento <span class="text-red-500">*</span></label>
          <div class="relative">
            <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" placeholder="Buscar medicamento…"
                   (input)="buscarMed($any($event.target).value)"
                   [value]="medSeleccionado()?.nombreGenerico ?? ''"
                   class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
          </div>
          <ul *ngIf="medSugerencias().length > 0"
              class="absolute z-[110] w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
            <li *ngFor="let m of medSugerencias()"
                (click)="elegirMed(m)"
                class="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer border-b last:border-0 border-gray-50">
              <span class="font-medium text-gray-900 block">{{ m.nombreGenerico }}</span>
              <span class="text-xs text-gray-400">{{ m.codigo }} · {{ m.concentracion }}</span>
            </li>
          </ul>
        </div>

        <!-- Establecimiento (solo admin al crear) -->
        <div *ngIf="!editando() && esAdmin()" class="space-y-1">
          <label class="text-xs font-semibold text-gray-700 font-bold uppercase tracking-tight">Establecimiento <span class="text-red-500">*</span></label>
          <select formControlName="establecimientoId"
                  [class.border-red-500]="form.get('establecimientoId')?.touched && !form.get('establecimientoId')?.value"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
            <option value="">Seleccione un establecimiento…</option>
            <option *ngFor="let e of establecimientos()" [value]="e.id">{{ e.nombre }}</option>
          </select>
        </div>

        <!-- Cantidades -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700 font-bold uppercase tracking-tight">Cantidad actual <span class="text-red-500">*</span></label>
            <input type="number" formControlName="cantidadActual" min="0"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
          </div>
          <div class="space-y-1">
            <label *ngIf="!editando()" class="text-xs font-semibold text-gray-700 font-bold uppercase tracking-tight">Cantidad mínima <span class="text-red-500">*</span></label>
            <input *ngIf="!editando()" type="number" formControlName="cantidadMinima" min="0"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
          </div>
        </div>

        <div *ngIf="editando() && form.value.cantidadActual !== editando()!.cantidadActual" class="space-y-1">
          <label for="motivo-ajuste" class="text-xs font-semibold text-gray-700">Motivo del ajuste *</label>
          <textarea id="motivo-ajuste" formControlName="motivoAjuste" maxlength="200" rows="2" placeholder="Explique por qué cambia la cantidad" class="w-full border border-gray-300 rounded-lg p-2 text-sm"></textarea>
        </div>
        <!-- Lote y vencimiento -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700 font-bold uppercase tracking-tight">Lote</label>
            <input type="text" [readonly]="!!editando()" [class.bg-gray-100]="!!editando()" formControlName="lote" placeholder="Ej. LOT-2024-001"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700 font-bold uppercase tracking-tight">Vencimiento</label>
            <input type="date" formControlName="fechaVencimiento"
                   [class.ring-2]="form.get('fechaVencimiento')?.invalid && form.get('fechaVencimiento')?.touched"
                   [class.ring-red-500]="form.get('fechaVencimiento')?.invalid && form.get('fechaVencimiento')?.touched"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
            <p *ngIf="form.get('fechaVencimiento')?.errors?.['dateInvalid'] && form.get('fechaVencimiento')?.touched" 
               class="text-[10px] text-red-500 font-bold uppercase mt-1">La fecha no existe</p>
          </div>
        </div>

        <!-- Ubicación -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-gray-700 font-bold uppercase tracking-tight">Ubicación / Estante</label>
          <input type="text" formControlName="ubicacion" placeholder="Ej. Estante A-3"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
        </div>

      </form>
      </div>
        <!-- Acciones siempre visibles fuera del contenido desplazable -->
        <div class="flex shrink-0 justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-white">
          <button type="button" (click)="cerrarModal()"
                  class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
            Cancelar
          </button>
          <div class="flex flex-col items-end gap-1">
            <button type="submit" form="inventario-lote-form" [disabled]="guardando() || form.invalid || (!editando() && !medSeleccionado())"
                    class="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg active:scale-95">
              {{ guardando() ? 'Guardando…' : (editando() ? 'Actualizar Registro' : 'Confirmar Asignación') }}
            </button>
            <p *ngIf="form.invalid || (!editando() && !medSeleccionado())" class="text-[10px] text-red-500 font-bold uppercase tracking-tight">
              Falta: {{ !medSeleccionado() && !editando() ? 'Medicamento' : '' }} {{ form.get('establecimientoId')?.invalid ? 'Establecimiento' : '' }}
            </p>
          </div>
        </div>
    </div>
  </div>

  <!-- Modal Carga Masiva -->
  <div *ngIf="modalCargaAbierto()" class="fixed inset-0 z-[9999] flex items-center justify-center">
    <div class="fixed -top-10 -left-10 -right-10 -bottom-10 bg-black/40 backdrop-blur-sm" (click)="cerrarCargaMasiva()"></div>
    
    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 m-4 animate-in fade-in zoom-in duration-200">
      <div class="flex items-center justify-between p-5 border-b border-gray-100">
        <h3 class="text-base font-bold text-gray-900 font-serif">Carga Masiva de Inventario</h3>
        <button (click)="cerrarCargaMasiva()" class="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors hover:bg-gray-100">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="p-6 space-y-6">
        <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-sm text-indigo-800">
          <svg class="w-5 h-5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div class="space-y-2">
            <p>Sube un archivo CSV con las columnas: <strong>codigo_medicamento, cantidad_actual, cantidad_minima, lote, fecha_vencimiento, ubicacion</strong>.</p>
            <button (click)="descargarPlantilla()" class="text-indigo-600 font-bold hover:underline flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Descargar plantilla .csv
            </button>
          </div>
        </div>

        <div *ngIf="esAdmin() && !resultadosCarga()" class="space-y-2">
          <label class="text-xs font-semibold text-gray-700">Establecimiento destino <span class="text-red-500">*</span></label>
          <select [value]="elFiltroEstablecimientoCarga()" (change)="elFiltroEstablecimientoCarga.set(+$any($event.target).value)"
                class="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Seleccione un establecimiento…</option>
            <option *ngFor="let e of establecimientos()" [value]="e.id">{{ e.nombre }}</option>
          </select>
        </div>

        <div *ngIf="!procesandoCarga() && !resultadosCarga()" 
             [class.opacity-50]="esAdmin() && !elFiltroEstablecimientoCarga()"
             class="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-indigo-400 hover:bg-gray-50 transition-all cursor-pointer group relative">
          <input type="file" #fileInput (change)="procesarArchivo($event)" [disabled]="esAdmin() && !elFiltroEstablecimientoCarga()" hidden accept=".csv">
          
          <div *ngIf="esAdmin() && !elFiltroEstablecimientoCarga()" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl p-6">
            <svg class="w-10 h-10 text-amber-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <p class="text-sm font-black text-gray-900 uppercase tracking-tighter">Acceso Bloqueado</p>
            <p class="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1 text-center">Debe seleccionar el establecimiento de destino en el menú superior antes de subir el archivo.</p>
          </div>

          <button (click)="fileInput.click()" [disabled]="esAdmin() && !elFiltroEstablecimientoCarga()" class="flex flex-col items-center w-full">
            <div class="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-all">
              <svg class="w-7 h-7 text-gray-400 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
            </div>
            <span class="text-base font-bold text-gray-900">Seleccionar archivo CSV</span>
          </button>
        </div>

        <div *ngIf="procesandoCarga()" class="text-center py-10">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Procesando registros...</p>
        </div>

        <div *ngIf="resultadosCarga()" class="space-y-6">
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-gray-50 rounded-2xl p-4 text-center border">
              <p class="text-2xl font-black text-gray-900">{{ resultadosCarga()?.total }}</p>
              <p class="text-[9px] text-gray-400 uppercase font-black tracking-widest mt-1">Total</p>
            </div>
            <div class="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
              <p class="text-2xl font-black text-green-600">{{ resultadosCarga()?.exitosos }}</p>
              <p class="text-[9px] text-green-500 uppercase font-black tracking-widest mt-1">Éxitos</p>
            </div>
            <div class="bg-red-50 rounded-2xl p-4 text-center border border-red-100">
              <p class="text-2xl font-black text-red-500">{{ resultadosCarga()?.fallidos }}</p>
              <p class="text-[9px] text-red-500 uppercase font-black tracking-widest mt-1">Fallos</p>
            </div>
          </div>

          <div *ngIf="resultadosCarga()?.errores?.length > 0" class="max-h-40 overflow-y-auto bg-gray-50 rounded-2xl p-4 border text-[11px] text-gray-500 font-serif">
            <li *ngFor="let err of resultadosCarga()?.errores" class="flex gap-2">
              <span class="text-red-500 font-bold">•</span> {{ err }}
            </li>
          </div>

          <button (click)="cerrarCargaMasiva()" class="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
            FINALIZAR Y CERRAR
          </button>
        </div>
      </div>
    </div>
  </div>

</div>
  `,
})
export class MantenimientoInventarioComponent implements OnInit, OnDestroy {
  private svc          = inject(InventarioService);
  private medSvc       = inject(MedicamentosService);
  private estSvc       = inject(EstablecimientosService);
  private auth         = inject(AuthService);
  private notification = inject(NotificationService);
  private fb           = inject(FormBuilder);

  items         = signal<InventarioItem[]>([]);
  productos = computed(() => {
    const grupos = new Map<number, { medicamento: InventarioItem['medicamento']; lotes: InventarioItem[]; total: number }>();
    for (const item of this.items()) {
      let grupo = grupos.get(item.medicamentoId);
      if (!grupo) {
        grupo = { medicamento: item.medicamento, lotes: [], total: 0 };
        grupos.set(item.medicamentoId, grupo);
      }
      grupo.lotes.push(item);
      grupo.total += item.cantidadActual;
    }
    return [...grupos.values()].map(grupo => ({ ...grupo,
      establecimientos: [...new Set(grupo.lotes.map(lote => this.nombreEstablecimiento(lote)))].join(', '),
    }));
  });
  lotesEdicion = computed(() => this.items().filter(item => item.medicamentoId === this.editando()?.medicamentoId));
  totalLotesEdicion = computed(() => this.lotesEdicion().reduce((total, item) => total + item.cantidadActual, 0));
  configuraciones = computed(() => {
    const grupos = new Map<string, InventarioItem>();
    for (const item of this.items().filter(i => i.activo)) {
      const key = item.medicamentoId + ':' + item.establecimientoId;
      const grupo = grupos.get(key);
      if (grupo) {
        grupo.cantidadActual += item.cantidadActual;
        grupo.cantidadMinima = Math.max(grupo.cantidadMinima, item.cantidadMinima);
      } else grupos.set(key, { ...item });
    }
    return [...grupos.values()];
  });
  configuracionesEdicion = computed(() => this.configuraciones().filter(i => i.medicamentoId === this.editando()?.medicamentoId));
  alertasStock = computed(() => this.configuraciones().filter(i => i.cantidadActual <= i.cantidadMinima));
  alertasPorProducto = computed(() => {
    const alertas = new Map<number, InventarioItem[]>();
    for (const item of this.alertasStock()) {
      const grupo = alertas.get(item.medicamentoId) ?? [];
      grupo.push(item);
      alertas.set(item.medicamentoId, grupo);
    }
    return alertas;
  });
  guardandoMinimo = signal(false);
  establecimientos = signal<any[]>([]);
  cargando      = signal(false);
  guardando     = signal(false);
  modalAbierto  = signal(false);
  editando      = signal<InventarioItem | null>(null);
  medSeleccionado = signal<Medicamento | null>(null);
  medSugerencias  = signal<Medicamento[]>([]);

  // Estado para Carga Masiva
  modalCargaAbierto = signal(false);
  procesandoCarga   = signal(false);
  resultadosCarga   = signal<any | null>(null);
  elFiltroEstablecimientoCarga = signal<number | null>(null);

  private establecimientoFiltro: number | undefined;
  readonly busqueda$ = new Subject<string>();
  private medSubject = new Subject<string>();
  private subs: any[] = [];

  form = this.fb.group({
    motivoAjuste: [''],
    cantidadActual:    [0, [Validators.required, Validators.min(0)]],
    cantidadMinima:    [10, [Validators.required, Validators.min(0)]],
    lote:              [''],
    fechaVencimiento:  ['', [DateValidators.dateReal()]],
    ubicacion:         [''],
    establecimientoId: ['', [Validators.required]],
  });

  esAdmin() { return this.auth.obtenerUsuario()?.rol === 'ADMIN'; }

  ngOnInit() {
    this.cargar();

    this.subs.push(
      this.busqueda$.pipe(debounceTime(350), distinctUntilChanged())
        .subscribe(q => this.cargar(q)),

      this.medSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(q => q.length >= 2 ? this.medSvc.buscar(q) : of([])),
      ).subscribe(res => this.medSugerencias.set(res)),
    );

    if (this.esAdmin()) {
      this.estSvc.listar().subscribe(res => this.establecimientos.set(res));
    }
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  cargar(q?: string) {
    this.cargando.set(true);
    const obs = this.esAdmin()
      ? this.svc.listarAdmin(q, this.establecimientoFiltro)
      : this.svc.listar(q);

    obs.subscribe({
      next: data => {
        console.log('Datos recibidos del inventario:', data);
        if (!Array.isArray(data)) {
          console.error('La respuesta no es un array:', data);
          this.notification.warn('La respuesta del servidor no tiene el formato esperado');
          this.items.set([]);
        } else {
          this.items.set(data);

          if (data.length > 0) {
            this.notification.success(`${data.length} registros cargados correctamente`);
          }
        }
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando inventario:', err);
        this.cargando.set(false);
      },
    });
  }

  cambiarEstablecimiento(val: string) {
    this.establecimientoFiltro = val ? +val : undefined;
    this.cargar();
  }

  abrirModal() {
    this.editando.set(null);
    this.medSeleccionado.set(null);
    this.medSugerencias.set([]);
    this.form.reset({ cantidadActual: 0, cantidadMinima: 10, lote: '', fechaVencimiento: '', ubicacion: '', establecimientoId: this.esAdmin() ? '' : String(this.auth.obtenerUsuario()?.establecimientoId ?? '') });
    this.modalAbierto.set(true);
  }

  guardarMinimo(item: InventarioItem, valor: string) {
    const cantidadMinima = Number(valor);
    if (!valor.trim() || !Number.isInteger(cantidadMinima) || cantidadMinima < 0) {
      this.notification.error('El mínimo debe ser un número entero mayor o igual a cero');
      return;
    }
    this.guardandoMinimo.set(true);
    this.svc.actualizar(item.id, { cantidadMinima }).subscribe({
      next: () => {
        this.items.update(items => items.map(i => i.medicamentoId === item.medicamentoId && i.establecimientoId === item.establecimientoId ? { ...i, cantidadMinima } : i));
        this.guardandoMinimo.set(false);
        this.notification.success('Mínimo actualizado para el producto en este establecimiento');
      },
      error: e => {
        this.guardandoMinimo.set(false);
        this.notification.error(e?.error?.message ?? 'No se pudo actualizar el mínimo');
      },
    });
  }

  stockBajoProducto(item: InventarioItem): boolean {
    return this.alertasStock().some(i => i.medicamentoId === item.medicamentoId && i.establecimientoId === item.establecimientoId);
  }

  nombreEstablecimiento(item: InventarioItem): string {
    return item.establecimiento?.nombre ?? this.establecimientos().find(e => e.id === item.establecimientoId)?.nombre ?? ('Establecimiento #' + item.establecimientoId);
  }

  seleccionarLote(item: InventarioItem) {
    if (this.guardando() || item.id === this.editando()?.id) return;
    if (this.form.dirty && !confirm('Hay cambios sin guardar. ¿Descartarlos y editar otro lote?')) return;
    this.abrirEditar(item);
  }

  abrirEditar(item: InventarioItem) {
    this.editando.set(item);
    this.form.patchValue({
      motivoAjuste: '',
      establecimientoId: String(item.establecimientoId),
      cantidadActual:   item.cantidadActual,
      cantidadMinima:   item.cantidadMinima,
      lote:             item.lote ?? '',
      fechaVencimiento: item.fechaVencimiento ? item.fechaVencimiento.split('T')[0] : '',
      ubicacion:        item.ubicacion ?? '',
    });
    this.form.markAsPristine();
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    if (this.guardando()) return;
    if (this.form.dirty && !confirm('Hay cambios sin guardar. ¿Cerrar sin guardarlos?')) return;
    this.modalAbierto.set(false);
  }

  buscarMed(q: string) {
    this.medSeleccionado.set(null);
    this.medSubject.next(q);
  }

  elegirMed(med: Medicamento) {
    this.medSeleccionado.set(med);
    this.medSugerencias.set([]);
  }

  guardar() {
    const item = this.editando();
    if (!item && !this.medSeleccionado()) {
      this.notification.error('Selecciona un medicamento');
      return;
    }
    if (this.form.invalid) return;
    if (item && this.form.value.cantidadActual !== item.cantidadActual && !this.form.value.motivoAjuste?.trim()) {
      this.notification.error('Indica el motivo del ajuste de cantidad');
      return;
    }
    this.guardando.set(true);

    const v = this.form.value;

    if (item) {
      this.svc.actualizar(item.id, {
        cantidadActual:   v.cantidadActual!,
        motivoAjuste: v.motivoAjuste?.trim() || undefined,
        fechaVencimiento: v.fechaVencimiento || undefined,
        ubicacion:        v.ubicacion || undefined,
      }).subscribe({
        next: updated => {
          this.items.update(list => list.map(i => i.id === updated.id ? { ...i, ...updated } : i));

          this.notification.success('Lote actualizado');
          this.guardando.set(false);
          this.abrirEditar(this.items().find(i => i.id === updated.id)!);
        },
        error: (e: any) => { this.notification.error(e?.error?.message ?? 'Error al actualizar'); this.guardando.set(false); },
      });
    } else {
      const usuario = this.auth.obtenerUsuario();
      const estId = this.esAdmin() ? +(v.establecimientoId!) : usuario!.establecimientoId;
      const dto: AsignarDto = {
        medicamentoId:     this.medSeleccionado()!.id,
        establecimientoId: estId,
        cantidadActual:    v.cantidadActual!,
        cantidadMinima:    v.cantidadMinima!,
        lote:              v.lote || undefined,
        fechaVencimiento:  v.fechaVencimiento || undefined,
        ubicacion:         v.ubicacion || undefined,
      };
      this.svc.asignar(dto).subscribe({
        next: nuevo => {
          this.items.update(list => [nuevo, ...list]);
          this.form.markAsPristine();
          this.notification.success('Medicamento asignado al inventario');
          this.guardando.set(false);
          this.cerrarModal();
        },
        error: (e: any) => { this.notification.error(e?.error?.message ?? 'Error al asignar'); this.guardando.set(false); },
      });
    }
  }

  confirmarEliminar(item: InventarioItem) {
    if (!confirm(`¿Eliminar el lote "${item.lote || 'sin código'}" de ${item.medicamento.nombreGenerico} en ${this.nombreEstablecimiento(item)}?`)) return;
    this.svc.eliminar(item.id).subscribe({
      next: () => {
        this.items.update(list => list.filter(i => i.id !== item.id));

        if (this.editando()?.id === item.id) {
          const siguiente = this.lotesEdicion()[0];
          if (siguiente) this.abrirEditar(siguiente);
          else this.modalAbierto.set(false);
        }
        this.notification.success('Lote eliminado');
      },
      error: (e: any) => this.notification.error(e?.error?.message ?? 'Error al eliminar'),
    });
  }

  // --- MÉTODOS CARGA MASIVA ---

  abrirCargaMasiva() {
    this.resultadosCarga.set(null);
    this.modalCargaAbierto.set(true);
    this.elFiltroEstablecimientoCarga.set(null);
  }

  cerrarCargaMasiva() {
    if (this.procesandoCarga()) return;
    this.modalCargaAbierto.set(false);
  }

  descargarPlantilla() {
    const headers = 'codigo_medicamento,cantidad_actual,cantidad_minima,lote,fecha_vencimiento,ubicacion\n';
    const example = 'MED-01,100,10,LOTE-2024,2025-12-31,ESTANTE-A1\n';
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_inventario.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  procesarArchivo(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const usuario = this.auth.obtenerUsuario();
    const estId = this.esAdmin() ? this.elFiltroEstablecimientoCarga() : usuario?.establecimientoId;

    if (!estId || estId === 0) {
      this.notification.warn('Debe seleccionar un establecimiento de la lista para poder procesar la carga.');
      event.target.value = '';
      return;
    }

    this.procesandoCarga.set(true);
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const csv = e.target.result;
        const lines = csv.split(/\r?\n/);
        const items = [];

        // Detectar delimitador (coma o punto y coma)
        let delimiter = ',';
        const firstLine = lines[0] || '';
        if (firstLine.includes(';') && !firstLine.includes(',')) {
          delimiter = ';';
        }

        console.log('Detectado delimitador:', delimiter);
        console.log('Total líneas brutas:', lines.length);

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cols = line.split(delimiter);
          if (cols.length < 3) {
            console.warn(`Línea ${i+1} ignorada (columnas insuficientes):`, line);
            continue;
          }

          const cantActual = parseInt(cols[1]?.trim() || '0');
          const cantMinima = parseInt(cols[2]?.trim() || '0');

          if (isNaN(cantActual) || isNaN(cantMinima)) {
            console.warn(`Línea ${i+1} ignorada (formatos numéricos):`, line);
            continue;
          }

          items.push({
            codigoMedicamento: cols[0]?.trim(),
            cantidadActual:    cantActual,
            cantidadMinima:    cantMinima,
            lote:              cols[3]?.trim() || undefined,
            fechaVencimiento:  cols[4]?.trim() || undefined,
            ubicacion:         cols[5]?.trim() || undefined
          });
        }

        console.log('Items listos para enviar:', items);

        if (items.length === 0) {
          this.notification.error('No se encontraron registros válidos en el archivo');
          this.procesandoCarga.set(false);
          return;
        }

        this.svc.cargaMasiva({ establecimientoId: estId, items }).subscribe({
          next: (res) => {
            this.resultadosCarga.set(res);
            this.procesandoCarga.set(false);
            this.cargar();
            this.notification.success('Procesamiento completado');
          },
          error: (err) => {
            const msg = err?.error?.message || 'Error desconocido en el servidor';
            this.notification.error(`Error al procesar: ${Array.isArray(msg) ? msg[0] : msg}`);
            this.procesandoCarga.set(false);
          }
        });
      } catch (error) {
        this.notification.error('Error al leer el archivo CSV');
        this.procesandoCarga.set(false);
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  }

  resumenAlertas(): string {
    return this.alertasStock()
      .slice(0, 3)
      .map(i => i.medicamento.nombreGenerico)
      .join(', ');
  }

  stockClass(item: InventarioItem): string {
    if (item.cantidadActual === 0) return 'text-red-600';
    if (this.stockBajoProducto(item)) return 'text-amber-600';
    return 'text-green-600';
  }

  estaVencido(item: InventarioItem): boolean {
    return !!item.fechaVencimiento && new Date(item.fechaVencimiento) < new Date();
  }

  etiquetaEstado(item: InventarioItem): string {
    if (!item.activo) return 'Inactivo';
    if (item.cantidadActual === 0) return 'Agotado';
    if (this.estaVencido(item)) return 'Vencido';
    if (this.stockBajoProducto(item)) return 'Stock bajo';
    return 'OK';
  }

  badgeEstado(item: InventarioItem): string {
    if (!item.activo || item.cantidadActual === 0) return 'bg-red-100 text-red-700 border-red-200';
    if (this.estaVencido(item)) return 'bg-red-100 text-red-700 border-red-200';
    if (this.stockBajoProducto(item)) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-green-100 text-green-700 border-green-200';
  }
}
