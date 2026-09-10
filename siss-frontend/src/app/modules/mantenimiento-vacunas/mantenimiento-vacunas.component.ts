import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { VacunacionService } from '../vacunacion/vacunacion.service';
import { NotificationService } from '../../core/services/notification.service';
import Swal from 'sweetalert2';

const TIPOS_VACUNA = [
  { value: 'VIRAL_ATENUADA', label: 'Viral Atenuada' },
  { value: 'VIRAL_INACTIVADA', label: 'Viral Inactivada' },
  { value: 'BACTERIANA_ATENUADA', label: 'Bacteriana Atenuada' },
  { value: 'BACTERIANA_INACTIVADA', label: 'Bacteriana Inactivada' },
  { value: 'RECOMBINANTE', label: 'Recombinante (Ing. Genética)' },
  { value: 'ARN_MENSAJERO', label: 'ARN Mensajero (ARNm)' },
  { value: 'TOXOIDE', label: 'Toxoide (Toxinas)' }
];

@Component({
  selector: 'app-mantenimiento-vacunas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">

      <!-- Cabecera -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg class="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            Mantenimiento de Inmunizaciones (PAI)
          </h2>
          <p class="text-sm text-gray-500 mt-1">Gestión avanzada del catálogo maestro de vacunas y sus esquemas de dosificación por edad</p>
        </div>
        <button (click)="abrirModalVacuna()"
                class="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-green-600/10 hover:shadow-green-700/20 active:scale-95">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva Vacuna
        </button>
      </div>

      <!-- Barra de búsqueda e info rápida -->
      <div class="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div class="relative flex-1 min-w-[280px]">
          <svg class="absolute left-3.5 top-3 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="Buscar por nombre, descripción o población meta..."
                 (input)="busqueda$.next($any($event.target).value)"
                 class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"/>
        </div>
        <div class="flex gap-4 text-xs font-semibold text-gray-400">
          <span class="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <strong class="text-gray-700 font-bold">{{ total() }}</strong> registros
          </span>
          <span class="flex items-center gap-1.5 bg-green-50/50 text-green-700 border border-green-50 px-3 py-1.5 rounded-lg">
            <strong class="font-bold">{{ totalActivas() }}</strong> activas
          </span>
        </div>
      </div>

      <!-- Contenedor Maestro-Detalle -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Maestro: Catálogo de Vacunas (col-span-7) -->
        <div class="lg:col-span-7 space-y-4">
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-400">Catálogo de Vacunas</span>
            </div>

            <div *ngIf="cargando()" class="p-16 text-center text-gray-400 text-sm flex flex-col items-center justify-center gap-3">
              <div class="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Cargando catálogo maestro...</span>
            </div>

            <div *ngIf="!cargando()" class="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              <div *ngFor="let v of vacunas()"
                   (click)="seleccionarVacuna(v)"
                   [ngClass]="{ 'bg-green-50/20 border-l-4 border-l-green-600': vacunaSeleccionada()?.id === v.id }"
                   class="p-4 hover:bg-gray-50/60 transition-all duration-200 cursor-pointer flex justify-between items-start gap-4">
                
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2">
                    <h3 class="font-bold text-gray-900 text-base">{{ v.nombre }}</h3>
                    <span [ngClass]="v.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                          class="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {{ v.activo ? 'Activa' : 'Inactiva' }}
                    </span>
                  </div>
                  
                  <p class="text-xs text-gray-500 line-clamp-2 max-w-md">{{ v.descripcion || 'Sin descripción' }}</p>
                  
                  <div class="flex flex-wrap gap-2 pt-1 text-[10px]">
                    <span class="bg-blue-50 text-blue-700 font-semibold px-2.5 py-0.5 rounded-md border border-blue-100/50">
                      {{ v.poblacionMeta || 'Población general' }}
                    </span>
                    <span class="bg-purple-50 text-purple-700 font-semibold px-2.5 py-0.5 rounded-md border border-purple-100/50">
                      {{ v.esquemas?.length || 0 }} dosis configuradas
                    </span>
                    <span class="bg-gray-100 text-gray-600 font-semibold px-2.5 py-0.5 rounded-md">
                      {{ obtenerEtiquetaTipo(v.tipo) }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-1.5" (click)="$event.stopPropagation()">
                  <button (click)="abrirModalVacuna(v)" title="Editar Vacuna"
                          class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button (click)="toggleActivo(v)" [title]="v.activo ? 'Desactivar Vacuna' : 'Activar Vacuna'"
                          class="p-2 rounded-xl transition-all"
                          [ngClass]="v.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'">
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                    </svg>
                  </button>
                </div>

              </div>

              <div *ngIf="vacunas().length === 0" class="p-16 text-center text-gray-400 text-sm">
                No se encontraron vacunas en el catálogo.
              </div>
            </div>

            <!-- Paginación -->
            <div *ngIf="totalPaginas() > 1"
                 class="border-t border-gray-100 px-4 py-3.5 flex items-center justify-between bg-gray-50/30">
              <p class="text-xs text-gray-400">
                Página <strong>{{ pagina() }}</strong> de <strong>{{ totalPaginas() }}</strong>
              </p>
              <div class="flex gap-2">
                <button (click)="irPagina(pagina() - 1)" [disabled]="pagina() === 1"
                        class="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm">
                  ← Anterior
                </button>
                <button (click)="irPagina(pagina() + 1)" [disabled]="pagina() === totalPaginas()"
                        class="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm">
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Detalle: Esquema de Dosis (col-span-5) -->
        <div class="lg:col-span-5">
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap justify-between items-center gap-3">
              <div class="flex items-center gap-4">
                <span class="text-xs font-bold uppercase tracking-wider text-gray-400">Detalle del Esquema</span>
                
                <!-- Toggle mostrar inactivas -->
                <label *ngIf="vacunaSeleccionada()" class="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500 font-semibold select-none">
                  <input type="checkbox" [checked]="mostrarInactivosDosis()" (change)="mostrarInactivosDosis.set(!mostrarInactivosDosis())"
                         class="w-3.5 h-3.5 rounded border-gray-300 text-green-600 focus:ring-green-400"/>
                  Ver inactivas
                </label>
              </div>

              <button *ngIf="vacunaSeleccionada()" (click)="abrirModalDosis()"
                      class="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold rounded-lg border border-green-200/50 transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Agregar Dosis
              </button>
            </div>

            <!-- Si no hay vacuna seleccionada -->
            <div *ngIf="!vacunaSeleccionada()" class="p-16 text-center text-gray-400 text-sm flex flex-col items-center justify-center gap-4">
              <svg class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span>Selecciona una vacuna del catálogo de la izquierda para ver y gestionar su línea de tiempo de dosis.</span>
            </div>

            <!-- Si hay vacuna seleccionada -->
            <div *ngIf="vacunaSeleccionada()" class="p-5 space-y-6">
              
              <div class="pb-4 border-b border-gray-100">
                <h3 class="font-bold text-gray-900 text-lg">{{ vacunaSeleccionada()?.nombre }}</h3>
                <p class="text-xs text-gray-400 mt-1">
                  Población Meta: <span class="font-medium text-gray-700">{{ vacunaSeleccionada()?.poblacionMeta || 'Población general' }}</span>
                </p>
              </div>

              <!-- Línea de tiempo (Timeline) -->
              <div *ngIf="vacunaSeleccionada()?.esquemas?.length === 0" class="py-10 text-center text-gray-400 text-sm">
                No hay dosis programadas para esta vacuna en el PAI.
              </div>

              <div *ngIf="vacunaSeleccionada()?.esquemas?.length > 0" class="relative pl-6 border-l-2 border-gray-100 space-y-6 ml-3">
                <ng-container *ngFor="let s of vacunaSeleccionada()?.esquemas">
                  <div *ngIf="s.activo || mostrarInactivosDosis()" class="relative">
                    
                    <!-- Nodo de la línea de tiempo -->
                    <span class="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 ring-4 ring-white"
                          [ngClass]="s.activo ? 'border-green-600' : 'border-gray-400'">
                    </span>
                    
                    <!-- Contenido de la dosis -->
                    <div [ngClass]="s.activo ? 'bg-gray-50/50 border-gray-100 hover:border-gray-200' : 'bg-gray-100/30 border-dashed border-gray-200 opacity-75'"
                         class="hover:bg-gray-50 rounded-xl p-3.5 border transition-all duration-200">
                      <div class="flex justify-between items-start gap-3">
                        <div class="flex-1">
                          <div class="flex items-center gap-2">
                            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                                  [ngClass]="s.activo ? 'text-green-700 bg-green-50' : 'text-gray-500 bg-gray-100'">
                              Dosis {{ s.numeroDosis }}
                            </span>
                            <span *ngIf="!s.activo" class="text-[9px] font-extrabold text-red-500 bg-red-50 border border-red-100/70 px-1.5 py-0.2 rounded uppercase tracking-wider">
                              Inactiva
                            </span>
                          </div>
                          <h4 class="font-bold text-gray-900 text-sm mt-1.5" [class.text-gray-400]="!s.activo">
                            Aplicar a: {{ s.edadRecomendadaMeses === 0 ? 'Al Nacer' : (s.edadRecomendadaMeses + ' meses') }}
                          </h4>
                          
                          <p *ngIf="s.intervaloMinimoDias" class="text-[11px] text-gray-500 mt-0.5" [class.text-gray-400]="!s.activo">
                            Intervalo mínimo: <span class="font-semibold">{{ s.intervaloMinimoDias }} días</span>
                          </p>

                          <p *ngIf="s.descripcion" class="text-xs text-gray-500 mt-2 font-normal italic" [class.text-gray-400]="!s.activo">
                            "{{ s.descripcion }}"
                          </p>

                          <!-- Auditoría del Registro -->
                          <div class="mt-3 pt-2.5 border-t border-gray-100/70 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400 font-medium">
                            <span *ngIf="s.creadoPor" class="flex items-center gap-1">
                              <svg class="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                              </svg>
                              Creado: {{ s.creadoPor.nombres }} {{ s.creadoPor.apellidos }} ({{ s.creadoEn | date:'dd/MM/yyyy HH:mm' }})
                            </span>
                            <span *ngIf="s.actualizadoPor && s.actualizadoEn" class="flex items-center gap-1">
                              <svg class="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 4.79M9 11l3 3L22 4"/>
                              </svg>
                              Modificado: {{ s.actualizadoPor.nombres }} {{ s.actualizadoPor.apellidos }} ({{ s.actualizadoEn | date:'dd/MM/yyyy HH:mm' }})
                            </span>
                            <span *ngIf="!s.activo && s.inactivadoPor && s.inactivadoEn" class="flex items-center gap-1 text-red-500/80 font-bold">
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                              </svg>
                              Inactivado: {{ s.inactivadoPor.nombres }} {{ s.inactivadoPor.apellidos }} ({{ s.inactivadoEn | date:'dd/MM/yyyy HH:mm' }})
                            </span>
                          </div>
                        </div>

                        <div class="flex items-center gap-1" (click)="$event.stopPropagation()">
                          <button (click)="abrirModalDosis(s)" title="Editar Dosis"
                                  class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                            </svg>
                          </button>
                          
                          <!-- Botón Inactivar (si está activa) -->
                          <button *ngIf="s.activo" (click)="eliminarDosis(s)" title="Inactivar Dosis"
                                  class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                            </svg>
                          </button>
                          
                          <!-- Botón Reactivar (si está inactiva) -->
                          <button *ngIf="!s.activo" (click)="reactivarDosis(s)" title="Reactivar Dosis"
                                  class="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </ng-container>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- ── MODAL: CREAR/EDITAR VACUNA ── -->
    <div *ngIf="modalVacunaAbierto()"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
         (click)="cerrarModalVacuna()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
           (click)="$event.stopPropagation()">
        
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-bold text-gray-900 text-lg">
            {{ editandoVacuna() ? 'Editar Vacuna' : 'Nueva Vacuna' }}
          </h3>
          <button (click)="cerrarModalVacuna()" type="button"
                  class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="p-6">
          <form [formGroup]="formVacuna" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nombre Oficial <span class="text-red-500">*</span></label>
              <input formControlName="nombre" type="text" placeholder="Ej: Pentavalente"
                     class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400 transition-all"/>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Descripción o Enfermedades que Previene</label>
              <textarea formControlName="descripcion" rows="3" placeholder="Ej: Previene la Difteria, Tos Ferina, Tétanos, Hepatitis B y Neumonías por Hib"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400 transition-all"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Tipo de Vacuna <span class="text-red-500">*</span></label>
                <select formControlName="tipo"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400 bg-white transition-all">
                  <option value="VIRAL_ATENUADA">Viral Atenuada</option>
                  <option *ngFor="let t of tiposVacuna" [value]="t.value">{{ t.label }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Población Meta <span class="text-red-500">*</span></label>
                <input formControlName="poblacionMeta" type="text" placeholder="Ej: Lactantes"
                       class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400 transition-all"/>
              </div>
            </div>
          </form>
        </div>

        <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button (click)="cerrarModalVacuna()" type="button"
                  class="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button (click)="guardarVacuna()" [disabled]="formVacuna.invalid || enviando()"
                  class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-md">
            {{ enviando() ? 'Guardando...' : (editandoVacuna() ? 'Actualizar' : 'Crear Vacuna') }}
          </button>
        </div>

      </div>
    </div>

    <!-- ── MODAL: CREAR/EDITAR DOSIS ── -->
    <div *ngIf="modalDosisAbierto()"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
         (click)="cerrarModalDosis()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
           (click)="$event.stopPropagation()">
        
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-bold text-gray-900 text-lg">
            {{ editandoDosis() ? 'Editar Dosis del Esquema' : 'Agregar Dosis al Esquema' }}
          </h3>
          <button (click)="cerrarModalDosis()" type="button"
                  class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="p-6">
          <form [formGroup]="formDosis" class="space-y-4">
            
            <div class="bg-blue-50 border border-blue-200/50 rounded-xl p-3.5 text-xs text-blue-800">
              Configurando dosificación recomendada para: <strong>{{ vacunaSeleccionada()?.nombre }}</strong>.
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Número de Dosis <span class="text-red-500">*</span></label>
                <input formControlName="numeroDosis" type="number" min="1" placeholder="Ej: 1"
                       class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400 transition-all"/>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Edad Recomendada (Meses) <span class="text-red-500">*</span></label>
                <input formControlName="edadRecomendadaMeses" type="number" min="0" placeholder="Ej: 2 (0 para Recién Nacido)"
                       class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400 transition-all"/>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Intervalo Mínimo con Dosis Previa (Días)</label>
              <input formControlName="intervaloMinimoDias" type="number" min="0" placeholder="Ej: 30 (opcional)"
                     class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400 transition-all"/>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Notas o Instrucciones de Aplicación</label>
              <textarea formControlName="descripcion" rows="2" placeholder="Ej: Aplicar en músculo deltoides izquierdo, aguja calibre 22..."
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400 transition-all"></textarea>
            </div>
          </form>
        </div>

        <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button (click)="cerrarModalDosis()" type="button"
                  class="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button (click)="guardarDosis()" [disabled]="formDosis.invalid || enviando()"
                  class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-md">
            {{ enviando() ? 'Guardando...' : (editandoDosis() ? 'Actualizar' : 'Agregar Dosis') }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class MantenimientoVacunasComponent implements OnInit {
  private svc = inject(VacunacionService);
  private notification = inject(NotificationService);
  private fb = inject(FormBuilder);

  // States using Signals
  vacunas = signal<any[]>([]);
  cargando = signal(true);
  total = signal(0);
  totalActivas = signal(0);
  pagina = signal(1);
  totalPaginas = signal(1);
  
  vacunaSeleccionada = signal<any | null>(null);
  mostrarInactivosDosis = signal(false);
  
  // Modals signals
  modalVacunaAbierto = signal(false);
  modalDosisAbierto = signal(false);
  editandoVacuna = signal<any | null>(null);
  editandoDosis = signal<any | null>(null);
  enviando = signal(false);

  // Enums configuration
  tiposVacuna = TIPOS_VACUNA;

  busqueda$ = new Subject<string>();
  private terminoBusqueda = '';

  // Forms declaration
  formVacuna = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    tipo: ['VIRAL_ATENUADA', Validators.required],
    poblacionMeta: ['', Validators.required]
  });

  formDosis = this.fb.group({
    numeroDosis: [1, [Validators.required, Validators.min(1)]],
    edadRecomendadaMeses: [0, [Validators.required, Validators.min(0)]],
    intervaloMinimoDias: [null as number | null],
    descripcion: ['']
  });

  ngOnInit() {
    this.cargar();
    
    // Setup Search Observable
    this.busqueda$.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(q => {
      this.terminoBusqueda = q;
      this.pagina.set(1);
      this.cargar();
    });
  }

  cargar() {
    this.cargando.set(true);
    this.svc.listarVacunasMantenimiento(this.pagina(), 20, this.terminoBusqueda || undefined).subscribe({
      next: (res: any) => {
        // Unpack standard SISS response wrapper ({ ok: true, data: ... }) if present
        let payload = res;
        if (res && res.ok === true && res.data !== undefined) {
          payload = res.data;
        }

        const list = Array.isArray(payload)
          ? payload
          : (payload && Array.isArray(payload.data) ? payload.data : []);
        
        this.vacunas.set(list);
        this.total.set(payload && typeof payload.total === 'number' ? payload.total : list.length);
        this.totalPaginas.set(payload && typeof payload.totalPaginas === 'number' ? payload.totalPaginas : 1);
        
        // Count active ones
        const active = list.filter((v: any) => v.activo).length;
        this.totalActivas.set(active);

        // If currently selected vaccine is in the list, update its details
        const selected = this.vacunaSeleccionada();
        if (selected) {
          const updated = list.find((v: any) => v.id === selected.id);
          if (updated) this.vacunaSeleccionada.set(updated);
        }

        this.cargando.set(false);
      },
      error: (err: any) => {
        console.error('Error al cargar vacunas en mantenimiento:', err);
        this.notification.error(err?.error?.message || err?.message || 'Error al conectar con el servidor.');
        this.cargando.set(false);
      }
    });
  }

  irPagina(p: number) {
    if (p < 1 || p > this.totalPaginas()) return;
    this.pagina.set(p);
    this.cargar();
  }

  seleccionarVacuna(v: any) {
    this.vacunaSeleccionada.set(v);
  }

  obtenerEtiquetaTipo(value: string): string {
    const found = TIPOS_VACUNA.find(t => t.value === value);
    return found ? found.label : value;
  }

  // --- CRUD VACUNAS ---

  abrirModalVacuna(v?: any) {
    this.editandoVacuna.set(v ?? null);
    if (v) {
      this.formVacuna.patchValue(v);
    } else {
      this.formVacuna.reset({ tipo: 'VIRAL_ATENUADA' });
    }
    this.modalVacunaAbierto.set(true);
  }

  cerrarModalVacuna() {
    this.modalVacunaAbierto.set(false);
    this.editandoVacuna.set(null);
    this.formVacuna.reset({ tipo: 'VIRAL_ATENUADA' });
  }

  guardarVacuna() {
    if (this.formVacuna.invalid) return;
    this.enviando.set(true);
    const data = this.formVacuna.value;

    const req = this.editandoVacuna()
      ? this.svc.actualizarVacuna(this.editandoVacuna().id, data)
      : this.svc.crearVacuna(data);

    req.subscribe({
      next: (res: any) => {
        this.notification.success(this.editandoVacuna() ? 'Vacuna actualizada' : 'Vacuna creada con éxito');
        this.cerrarModalVacuna();
        this.enviando.set(false);
        this.cargar();
      },
      error: (err: any) => {
        this.enviando.set(false);
        this.notification.error(err.error?.message ?? 'Error al guardar la vacuna');
      }
    });
  }

  toggleActivo(v: any) {
    this.svc.desactivarVacuna(v.id).subscribe({
      next: () => {
        this.notification.info(`Vacuna ${v.activo ? 'desactivada' : 'activada'} correctamente`);
        this.cargar();
      },
      error: () => this.notification.error('Error al cambiar el estado de la vacuna')
    });
  }

  // --- CRUD DOSIS ---

  abrirModalDosis(s?: any) {
    this.editandoDosis.set(s ?? null);
    if (s) {
      this.formDosis.patchValue(s);
    } else {
      // Default to next dose number
      const nextDose = (this.vacunaSeleccionada()?.esquemas?.length || 0) + 1;
      this.formDosis.reset({
        numeroDosis: nextDose,
        edadRecomendadaMeses: 0,
        intervaloMinimoDias: null
      });
    }
    this.modalDosisAbierto.set(true);
  }

  cerrarModalDosis() {
    this.modalDosisAbierto.set(false);
    this.editandoDosis.set(null);
    this.formDosis.reset();
  }

  guardarDosis() {
    if (this.formDosis.invalid) return;
    const parent = this.vacunaSeleccionada();
    if (!parent) return;

    this.enviando.set(true);
    const data = this.formDosis.value;

    const req = this.editandoDosis()
      ? this.svc.actualizarEsquema(parent.id, this.editandoDosis().id, data)
      : this.svc.crearEsquema(parent.id, data);

    req.subscribe({
      next: () => {
        this.notification.success(this.editandoDosis() ? 'Dosis del esquema modificada' : 'Dosis agregada al esquema');
        this.cerrarModalDosis();
        this.enviando.set(false);
        this.cargar();
      },
      error: (err: any) => {
        this.enviando.set(false);
        this.notification.error(err.error?.message ?? 'Error al guardar la dosis');
      }
    });
  }

  eliminarDosis(s: any) {
    const parent = this.vacunaSeleccionada();
    if (!parent) return;

    Swal.fire({
      title: '¿Inactivar Dosis?',
      text: `¿Estás seguro de que deseas inactivar la Dosis ${s.numeroDosis} del esquema de esta vacuna? Esta acción inhabilitará la dosis para futuros registros pero mantendrá el historial clínico.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, inactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444', // Red-500
      cancelButtonColor: '#6b7280', // Gray-500
      customClass: {
        confirmButton: 'px-5 py-2.5 bg-red-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-red-700 transition-all border-none focus:outline-none',
        cancelButton: 'px-5 py-2.5 bg-gray-500 text-white rounded-lg font-bold text-sm shadow-md hover:bg-gray-600 transition-all border-none focus:outline-none ml-2'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.svc.eliminarEsquema(parent.id, s.id).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Inactivada!',
              text: 'La dosis ha sido inactivada correctamente del catálogo.',
              icon: 'success',
              timer: 1800,
              showConfirmButton: false
            });
            this.cargar();
          },
          error: (err: any) => {
            Swal.fire({
              title: 'Error',
              text: err.error?.message ?? 'Error al inactivar la dosis',
              icon: 'error'
            });
          }
        });
      }
    });
  }

  /**
   * Reactiva una dosis previamente inactivada lógicamente en el esquema de vacunación.
   * @param s El esquema de dosis a reactivar.
   */
  reactivarDosis(s: any) {
    const parent = this.vacunaSeleccionada();
    if (!parent) return;

    Swal.fire({
      title: '¿Reactivar Dosis?',
      text: `¿Estás seguro de que deseas reactivar la Dosis ${s.numeroDosis} en el esquema de esta vacuna? Esto la habilitará nuevamente para futuros registros clínicos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981', // Emerald-500
      cancelButtonColor: '#6b7280', // Gray-500
      customClass: {
        confirmButton: 'px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-emerald-700 transition-all border-none focus:outline-none',
        cancelButton: 'px-5 py-2.5 bg-gray-500 text-white rounded-lg font-bold text-sm shadow-md hover:bg-gray-600 transition-all border-none focus:outline-none ml-2'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.svc.actualizarEsquema(parent.id, s.id, { activo: true }).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Reactivada!',
              text: 'La dosis ha sido habilitada correctamente para el esquema.',
              icon: 'success',
              timer: 1800,
              showConfirmButton: false
            });
            this.cargar();
          },
          error: (err: any) => {
            Swal.fire({
              title: 'Error',
              text: err.error?.message ?? 'Error al reactivar la dosis',
              icon: 'error'
            });
          }
        });
      }
    });
  }
}
