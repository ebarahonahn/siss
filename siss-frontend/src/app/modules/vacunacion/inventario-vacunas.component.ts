
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VacunacionService } from './vacunacion.service';
import { AuthService } from '../../core/services/auth.service';
import { EstablecimientosService } from '../../core/services/establecimientos.service';
import { NotificationService } from '../../core/services/notification.service';
import { ReportePdfService } from '../../core/services/reporte-pdf.service';
import { DateValidators } from '../../core/validators/date.validator';

@Component({
  selector: 'app-inventario-vacunas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 animate__animated animate__fadeIn">
      <div class="max-w-7xl mx-auto">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">Inventario de Vacunas (PAI)</h1>
            <p class="text-gray-500 mt-1 font-medium text-sm">Control de entradas, lotes y existencias por establecimiento</p>
          </div>
          <div class="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3" *ngIf="!esAdmin">
            <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <div>
              <p class="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Establecimiento Actual</p>
              <h6 class="text-sm font-bold text-gray-800 leading-none">{{ nombreEstablecimientoActual }}</h6>
            </div>
          </div>
        </div>

        <!-- Banner Admin -->
        <div class="bg-indigo-600 rounded-3xl p-6 mb-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row md:items-center gap-6" *ngIf="esAdmin">
          <div class="flex-1">
            <h4 class="font-bold text-lg text-white">Panel de Administración Central</h4>
            <p class="text-indigo-100 text-xs uppercase font-bold tracking-widest mt-1">Gestión global de suministros para toda la red de salud</p>
          </div>
          <div class="flex-[2]">
            <select class="w-full px-5 py-3 bg-indigo-700 border-transparent text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-white outline-none transition-all cursor-pointer" 
                    [(ngModel)]="establecimientoId" (change)="onEstablecimientoChange()">
              <option *ngIf="establecimientos.length === 0" [value]="0">Cargando establecimientos...</option>
              <option *ngFor="let est of establecimientos" [value]="est.id">{{ est.nombre }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Formulario de Entrada (Izquierda) -->
          <div class="lg:col-span-4">
            <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <svg *ngIf="!loteEnEdicion" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                  <svg *ngIf="loteEnEdicion" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </div>
                <h4 class="text-sm font-bold text-gray-800 uppercase tracking-widest">{{ loteEnEdicion ? 'Editar Lote' : 'Nueva Entrada' }}</h4>
              </div>

              <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-5">
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Vacuna *</label>
                  <select class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold text-gray-700" 
                          formControlName="vacunaId">
                    <option [value]="null">Seleccione vacuna...</option>
                    <option *ngFor="let v of catalogo" [value]="v.id">{{ v.nombre }}</option>
                  </select>
                </div>

                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Código de Lote *</label>
                  <input type="text" class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold" 
                         formControlName="codigoLote" placeholder="Ej: LOT-PAI-2024-001">
                </div>

                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fabricante / Laboratorio *</label>
                  <input type="text" class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold" 
                         formControlName="fabricante" placeholder="Ej: Pfizer, GSK, AstraZeneca">
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Vencimiento *</label>
                    <input type="date" class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold" 
                           formControlName="fechaVencimiento">
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Dosis *</label>
                    <input type="number" class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold" 
                           formControlName="cantidadInicial" placeholder="0">
                  </div>
                </div>

                <div class="flex flex-col gap-2 pt-2">
                  <button type="submit" [disabled]="form.invalid || loading"
                          class="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                    <span *ngIf="loading" class="animate-spin h-4 w-4 border-2 border-white border-b-transparent rounded-full"></span>
                    {{ loading ? 'Procesando...' : (loteEnEdicion ? 'Actualizar Registro' : 'Ingresar al Inventario') }}
                  </button>
                  <button type="button" *ngIf="loteEnEdicion" (click)="cancelarEdicion()"
                          class="w-full py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-all uppercase text-[10px]">
                    Cancelar Edición
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Listado de Existencias (Derecha) -->
          <div class="lg:col-span-8">
            <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h5 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Existencias Actuales</h5>
                <div class="flex items-center gap-2">
                   <span class="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-tighter" *ngIf="esAdmin">
                     Mostrando: {{ nombreEstablecimientoSeleccionado }}
                   </span>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left">
                  <thead>
                    <tr class="text-[9px] font-black text-gray-400 uppercase tracking-tighter border-b border-gray-50">
                      <th class="px-8 py-4">Vacuna / Laboratorio</th>
                      <th class="px-6 py-4 text-center">Lote</th>
                      <th class="px-6 py-4">Vencimiento</th>
                      <th class="px-6 py-4 text-center">Stock</th>
                      <th class="px-8 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    <tr *ngFor="let l of lotes" class="hover:bg-gray-50/50 transition-colors group">
                      <td class="px-8 py-5">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                            {{ l.vacuna.nombre.substring(0,2) }}
                          </div>
                          <div>
                            <span class="block font-bold text-gray-900 leading-tight">{{ l.vacuna.nombre }}</span>
                            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{{ l.fabricante }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-5 text-center">
                        <span class="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-[11px] font-mono font-bold border border-gray-200 uppercase tracking-tight whitespace-nowrap shadow-sm">
                          {{ l.codigoLote }}
                        </span>
                      </td>
                      <td class="px-6 py-5">
                        <span class="text-sm font-semibold" [ngClass]="isVencido(l.fechaVencimiento) ? 'text-red-500' : 'text-gray-600'">
                          {{ l.fechaVencimiento | date:'dd MMM, yyyy':'UTC' }}
                        </span>
                      </td>
                      <td class="px-6 py-5">
                        <div class="flex flex-col w-32 mx-auto">
                          <div class="flex items-baseline gap-1 mb-1">
                            <span class="text-base font-black" [ngClass]="l.cantidadActual < 20 ? 'text-orange-500' : 'text-gray-900'">{{ l.cantidadActual | number }}</span>
                            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">de {{ l.cantidadInicial | number }}</span>
                          </div>
                          <div class="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden border border-gray-50">
                            <div class="h-full transition-all duration-500" 
                                 [ngClass]="(l.cantidadActual / l.cantidadInicial) < 0.1 ? 'bg-red-500' : 'bg-blue-500'"
                                 [style.width.%]="(l.cantidadActual / l.cantidadInicial) * 100">
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-8 py-5 text-right">
                        <div class="flex justify-end gap-1">
                          <button (click)="abrirModalAjuste(l)" class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all" title="Ajustar Stock">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                          </button>
                          <button (click)="verMovimientos(l)" class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Ver Historial">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          </button>
                          <button (click)="editarLote(l)" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button (click)="eliminarLote(l)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Eliminar">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Movimientos -->
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate__animated animate__fadeIn" *ngIf="loteSeleccionado">
      <div class="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col scale-in h-[80vh]">
        <div class="px-8 py-6 bg-indigo-600 flex items-center justify-between text-white">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
               <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
             </div>
             <div>
               <h2 class="text-xl font-bold uppercase tracking-tight leading-none">Historial de Lote</h2>
               <p class="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1">Lote: {{ loteSeleccionado.codigoLote }}</p>
             </div>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="imprimirHistorialLote()" class="flex items-center gap-2 px-3 py-1.5 bg-white/20 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-white/30 transition-all border border-white/20">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Imprimir Kardex
            </button>
            <button (click)="loteSeleccionado = null" class="p-2 hover:bg-indigo-700 rounded-xl transition-all text-white">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-8">
           <div class="space-y-4">
              <div *ngFor="let m of movimientos" class="flex items-start gap-4 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50/50 transition-all">
                 <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      [ngClass]="m.cantidad > 0 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'">
                    <svg *ngIf="m.cantidad > 0" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/></svg>
                    <svg *ngIf="m.cantidad <= 0" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"/></svg>
                 </div>
                 <div class="flex-1">
                    <div class="flex items-center justify-between">
                       <h6 class="font-bold text-gray-900 uppercase text-xs tracking-tight">{{ m.tipo }}</h6>
                       <span class="text-sm font-black" [ngClass]="m.cantidad > 0 ? 'text-green-600' : 'text-orange-600'">
                          {{ m.cantidad > 0 ? '+' : '' }}{{ m.cantidad }} dosis
                       </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1 font-medium">{{ m.motivo }}</p>
                    <div class="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                       <span class="flex items-center gap-1"><i class="bi bi-person"></i> Por: {{ m.usuario?.nombres }} {{ m.usuario?.apellidos }}</span>
                       <span class="flex items-center gap-1"><i class="bi bi-calendar"></i> {{ m.fecha | date:'dd/MM/yyyy hh:mm a':'UTC' }}</span>
                    </div>
                 </div>
              </div>

              <div *ngIf="movimientos.length === 0" class="py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                 Cargando historial de movimientos...
              </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Modal Ajuste de Stock -->
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate__animated animate__fadeIn" *ngIf="mostrarModalAjuste">
      <div class="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col scale-in">
        <div class="px-8 py-6 bg-blue-600 flex items-center justify-between text-white">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
               <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
             </div>
             <div>
               <h2 class="text-xl font-bold uppercase tracking-tight leading-none">Ajuste de Stock</h2>
               <p class="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">Lote: {{ loteParaAjustar?.codigoLote }}</p>
             </div>
          </div>
          <button (click)="cerrarModalAjuste()" class="p-2 hover:bg-blue-700 rounded-xl transition-all">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form [formGroup]="formAjuste" (ngSubmit)="guardarAjuste()" class="p-8 space-y-5">
           <div class="space-y-1">
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tipo de Ajuste *</label>
              <select class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold text-gray-700"
                      formControlName="tipo">
                 <option value="ENTRADA">Entrada (Sumar)</option>
                 <option value="AJUSTE_NEGATIVO">Salida / Pérdida (Restar)</option>
                 <option value="AJUSTE_POSITIVO">Ajuste de Inventario (Sumar)</option>
                 <option value="PERDIDA_CADENA_FRIO">Pérdida Cadena Frío (Restar)</option>
                 <option value="FRASCO_QUEBRADO">Frasco Quebrado (Restar)</option>
                 <option value="VENCIMIENTO">Vencimiento (Restar)</option>
              </select>
           </div>

           <div class="space-y-1">
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Cantidad de Dosis *</label>
              <input type="number" class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold"
                     formControlName="cantidad" placeholder="Ej: 10">
              <p class="text-[10px] text-gray-400 mt-1 font-medium italic">* Ingrese número positivo, el sistema aplicará el signo según el tipo.</p>
           </div>

           <div class="space-y-1">
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Motivo del Ajuste *</label>
              <textarea class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold"
                        formControlName="motivo" rows="3" placeholder="Ej: Pérdida por cadena de frío, Frasco quebrado, Error de conteo..."></textarea>
           </div>

           <div class="flex gap-4 pt-4">
              <button type="button" (click)="cerrarModalAjuste()" 
                      class="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all uppercase text-xs tracking-widest">
                Cancelar
              </button>
              <button type="submit" [disabled]="formAjuste.invalid || loading"
                      class="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Confirmar Ajuste
              </button>
           </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .scale-in { animation: scaleIn 0.3s ease-out; }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class InventarioVacunasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private vacService = inject(VacunacionService);
  private auth = inject(AuthService);
  private estService = inject(EstablecimientosService);
  private ns = inject(NotificationService);
  private pdfSvc = inject(ReportePdfService);

  form: FormGroup;
  catalogo: any[] = [];
  lotes: any[] = [];
  establecimientos: any[] = [];
  loading = false;
  establecimientoId: number = 0;
  esAdmin: boolean = false;
  nombreEstablecimientoActual: string = '';
  loteEnEdicion: any = null;
  
  // Para el historial de movimientos
  loteSeleccionado: any = null;
  movimientos: any[] = [];

  // Para el ajuste de stock
  mostrarModalAjuste = false;
  loteParaAjustar: any = null;
  formAjuste: FormGroup;

  constructor() {
    const user = this.auth.obtenerUsuario();
    this.esAdmin = user?.rol === 'ADMIN';
    this.establecimientoId = user?.establecimientoId || 0;
    this.nombreEstablecimientoActual = user?.establecimientoNombre || 'Mi Establecimiento';

    this.form = this.fb.group({
      vacunaId: [null, Validators.required],
      codigoLote: ['', Validators.required],
      fabricante: ['', Validators.required],
      fechaVencimiento: ['', [Validators.required, DateValidators.dateReal()]],
      cantidadInicial: [null, [Validators.required, Validators.min(1)]],
      establecimientoId: [this.establecimientoId, Validators.required]
    });

    this.formAjuste = this.fb.group({
      tipo: ['AJUSTE_NEGATIVO', Validators.required],
      cantidad: [null, [Validators.required, Validators.min(1)]],
      motivo: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit() {
    this.cargarCatalogo();
    if (this.esAdmin) {
      this.cargarEstablecimientos();
    } else {
      this.cargarLotes();
    }
  }

  get nombreEstablecimientoSeleccionado() {
    return this.establecimientos.find(e => e.id == this.establecimientoId)?.nombre || this.nombreEstablecimientoActual;
  }

  cargarEstablecimientos() {
    this.estService.listarSimplificado().subscribe((res: any) => {
      // Manejamos tanto res.data como res directamente
      this.establecimientos = Array.isArray(res) ? res : (res.data || []);
      
      if (this.establecimientos.length > 0) {
        if (!this.establecimientoId) {
          this.establecimientoId = this.establecimientos[0].id;
        }
        this.onEstablecimientoChange();
      } else {
        this.cargarLotes();
      }
    });
  }

  onEstablecimientoChange() {
    this.form.patchValue({ establecimientoId: this.establecimientoId });
    this.cargarLotes();
  }

  cargarCatalogo() {
    this.vacService.obtenerCatalogo().subscribe((res: any) => {
      this.catalogo = res.data || res;
    });
  }

  cargarLotes() {
    if (!this.establecimientoId) return;
    this.vacService.obtenerLotes(this.establecimientoId).subscribe((res: any) => {
      this.lotes = res.data || res;
    });
  }

  isVencido(fecha: string) {
    return new Date(fecha) < new Date();
  }

  editarLote(lote: any) {
    this.loteEnEdicion = lote;
    const fechaFormatted = new Date(lote.fechaVencimiento).toISOString().split('T')[0];
    this.form.patchValue({
      vacunaId: lote.vacunaId,
      codigoLote: lote.codigoLote,
      fabricante: lote.fabricante,
      fechaVencimiento: fechaFormatted,
      cantidadInicial: lote.cantidadInicial,
      establecimientoId: lote.establecimientoId
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion() {
    this.loteEnEdicion = null;
    this.form.reset({
      establecimientoId: this.establecimientoId,
      vacunaId: null
    });
  }

  eliminarLote(lote: any) {
    if (confirm(`¿Está seguro de eliminar el lote ${lote.codigoLote}? Esta acción no se puede deshacer.`)) {
      this.vacService.eliminarLote(lote.id).subscribe({
        next: () => {
          this.ns.success('Lote eliminado correctamente');
          this.cargarLotes();
        },
        error: () => this.ns.error('Error al eliminar el lote')
      });
    }
  }

  verMovimientos(lote: any) {
    this.loteSeleccionado = lote;
    this.movimientos = [];
    this.vacService.obtenerMovimientos(lote.id).subscribe((res: any) => {
      this.movimientos = res.data || res;
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.loading = true;
    
    const rawData = this.form.value;
    const payload = {
      ...rawData,
      vacunaId: Number(rawData.vacunaId),
      establecimientoId: Number(rawData.establecimientoId),
      cantidadInicial: Number(rawData.cantidadInicial)
    };

    const request = this.loteEnEdicion 
      ? this.vacService.actualizarLote(this.loteEnEdicion.id, payload)
      : this.vacService.crearLote(payload);

    request.subscribe({
      next: () => {
        this.ns.success(this.loteEnEdicion ? 'Lote actualizado' : 'Lote registrado');
        this.cargarLotes();
        this.cancelarEdicion();
        this.loading = false;
      },
      error: () => {
        this.ns.error('Error al guardar el lote');
        this.loading = false;
      }
    });
  }

  abrirModalAjuste(lote: any) {
    this.loteParaAjustar = lote;
    this.mostrarModalAjuste = true;
    this.formAjuste.reset({ tipo: 'AJUSTE_NEGATIVO' });
  }

  cerrarModalAjuste() {
    this.mostrarModalAjuste = false;
    this.loteParaAjustar = null;
  }

  guardarAjuste() {
    if (this.formAjuste.invalid || !this.loteParaAjustar) return;
    this.loading = true;

    const data = this.formAjuste.value;
    // Tipos que restan del inventario
    const tiposRestan = ['AJUSTE_NEGATIVO', 'PERDIDA_CADENA_FRIO', 'FRASCO_QUEBRADO', 'VENCIMIENTO'];
    const cantidadFinal = tiposRestan.includes(data.tipo) ? -Math.abs(data.cantidad) : Math.abs(data.cantidad);

    const payload = {
      loteId: this.loteParaAjustar.id,
      tipo: data.tipo,
      cantidad: cantidadFinal,
      motivo: data.motivo
    };

    this.vacService.registrarMovimiento(payload).subscribe({
      next: () => {
        this.ns.success('Ajuste de inventario realizado');
        this.cargarLotes();
        this.cerrarModalAjuste();
        this.loading = false;
      },
      error: (err) => {
        this.ns.error(err.error?.message || 'Error al realizar el ajuste');
        this.loading = false;
      }
    });
  }

  imprimirHistorialLote() {
    if (!this.loteSeleccionado || this.movimientos.length === 0) return;
    this.pdfSvc.generarMovimientosLotePdfUrl(this.movimientos, this.loteSeleccionado).then(url => {
      window.open(url, '_blank');
    });
  }
}
