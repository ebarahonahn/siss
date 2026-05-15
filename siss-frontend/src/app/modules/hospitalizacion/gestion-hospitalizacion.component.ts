import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HospitalizacionService } from '../../core/services/hospitalizacion.service';
import { MedicamentosService } from '../../core/services/medicamentos.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { Router } from '@angular/router';
import { DateValidators } from '../../core/validators/date.validator';

@Component({
  selector: 'app-gestion-hospitalizacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 p-4 md:p-8">
      
      <!-- Header -->
      <div class="max-w-7xl mx-auto mb-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">Gestión de Hospitalización</h1>
            <p class="text-slate-500 font-medium">Censo hospitalario y control de admisiones en tiempo real</p>
          </div>
          <div class="flex items-center gap-3">
            <button (click)="verEstadisticas()" 
                    class="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-100 hover:bg-slate-800 transition-all flex items-center gap-2">
              <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              Indicadores
            </button>
            <button (click)="abrirMapa()" 
                    class="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
              <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
              Mapa
            </button>
            <button (click)="abrirModalAdmision()" 
                    class="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
              Admisión
            </button>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <div class="text-2xl font-black text-slate-900">{{ ingresos().length }}</div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Pacientes Internados</div>
          </div>
          <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div class="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div class="text-2xl font-black text-slate-900">{{ totalCamasDisponibles() }}</div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Camas Disponibles</div>
          </div>
        </div>
      </div>

      <!-- MODAL: MAPA DE CAMAS (FULLSCREEN) -->
      <div *ngIf="mostrarMapa()" class="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-0 md:p-10">
        <div class="bg-slate-50 w-full h-full md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
          
          <!-- Header del Mapa -->
          <div class="bg-white px-10 py-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-black text-slate-900 tracking-tight">Situación de Camas</h2>
              <div class="flex items-center gap-4 mt-1">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Disponible</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Ocupada</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Limpieza</span>
                </div>
              </div>
            </div>
            <button (click)="mostrarMapa.set(false)" class="p-3 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Contenido del Mapa -->
          <div class="flex-1 overflow-y-auto p-10">
            <div *ngIf="cargandoMapa()" class="flex flex-col items-center justify-center py-40 gap-4">
              <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div class="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando infraestructura...</div>
            </div>

            <div *ngIf="!cargandoMapa()" class="space-y-12">
              <div *ngFor="let s of mapaDatos()" class="space-y-6">
                <!-- Servicio Header -->
                <div class="flex items-center gap-4">
                  <div class="px-4 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                    {{ s.catServicio?.nombre }}
                  </div>
                  <div class="flex-1 h-px bg-slate-200"></div>
                </div>

                <!-- Salas -->
                <div *ngFor="let sala of s.salas" class="space-y-4">
                  <h3 class="text-sm font-black text-slate-700 uppercase tracking-wider ml-2">{{ sala.nombre }}</h3>
                  
                  <!-- Habitaciones Grid -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <div *ngFor="let hab of sala.habitaciones" class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                      <div class="flex items-center justify-between border-b border-slate-50 pb-3">
                        <div class="text-xs font-black text-slate-400 uppercase">Pieza {{ hab.numero }}</div>
                        <div class="text-[9px] font-bold text-slate-300">{{ hab.camas.length }} CAMAS</div>
                      </div>

                      <!-- Camas en la habitación -->
                      <div class="grid grid-cols-2 gap-3">
                        <div *ngFor="let cama of hab.camas" 
                             class="group relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer"
                             [ngClass]="{
                               'bg-emerald-50/50 border-emerald-100 hover:border-emerald-500': cama.estado === 'DISPONIBLE',
                               'bg-rose-50/50 border-rose-100 hover:border-rose-500': cama.estado === 'OCUPADA',
                               'bg-amber-50/50 border-amber-100 hover:border-amber-500': cama.estado === 'LIMPIEZA',
                               'bg-slate-50/50 border-slate-100 hover:border-slate-500': cama.estado === 'MANTENIMIENTO'
                             }">
                          
                          <!-- Acción para camas en Limpieza -->
                          <div *ngIf="cama.estado === 'LIMPIEZA'" class="absolute -top-2 -right-2">
                             <button (click)="liberarCama(cama.id); $event.stopPropagation()" 
                                     class="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-amber-700 transition-colors">
                               <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                             </button>
                          </div>

                          <!-- Icono de Cama -->
                          <svg class="w-8 h-8 transition-transform group-hover:scale-110" 
                               [ngClass]="{
                                 'text-emerald-500': cama.estado === 'DISPONIBLE',
                                 'text-rose-500': cama.estado === 'OCUPADA',
                                 'text-amber-500': cama.estado === 'LIMPIEZA',
                                 'text-slate-400': cama.estado === 'MANTENIMIENTO'
                               }"
                               fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12V18a2 2 0 002 2h10a2 2 0 002-2v-6"/>
                          </svg>

                          <div class="text-[10px] font-black" 
                               [ngClass]="{
                                 'text-emerald-700': cama.estado === 'DISPONIBLE',
                                 'text-rose-700': cama.estado === 'OCUPADA',
                                 'text-amber-700': cama.estado === 'LIMPIEZA',
                                 'text-slate-600': cama.estado === 'MANTENIMIENTO'
                               }">
                            {{ cama.codigo }}
                          </div>

                          <!-- Tooltip al hover con info del paciente si está ocupada -->
                          <div *ngIf="cama.estado === 'OCUPADA' && cama.ingresos[0]" 
                               class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white p-3 rounded-xl text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                            <div class="font-black border-b border-slate-700 pb-1 mb-1">{{ cama.ingresos[0].paciente.nombres }} {{ cama.ingresos[0].paciente.apellidos }}</div>
                            <div class="text-slate-400">Ingreso: {{ cama.ingresos[0].fechaIngreso | date:'dd/MM HH:mm' }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Censo / Main Table -->
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
          <div class="px-8 pt-6 border-b border-slate-50 flex items-center justify-between bg-white">
            <div class="flex gap-8">
              <button (click)="cambiarVista('censo')" 
                      [class.text-blue-600]="vistaActiva() === 'censo'"
                      [class.border-blue-600]="vistaActiva() === 'censo'"
                      class="pb-4 text-sm font-black uppercase tracking-widest border-b-4 border-transparent transition-all">
                Censo de Pacientes
              </button>
              <button (click)="cambiarVista('historial')" 
                      [class.text-blue-600]="vistaActiva() === 'historial'"
                      [class.border-blue-600]="vistaActiva() === 'historial'"
                      class="pb-4 text-sm font-black uppercase tracking-widest border-b-4 border-transparent transition-all">
                Historial de Altas
              </button>
            </div>
            <div class="flex gap-2 mb-4" *ngIf="vistaActiva() === 'censo'">
               <input type="text" [formControl]="searchCenso" placeholder="Buscar en censo..." class="px-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"/>
            </div>
          </div>
          
          <!-- Vista: CENSO ACTIVO -->
          <div *ngIf="vistaActiva() === 'censo'" class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th class="px-8 py-4">Paciente</th>
                  <th class="px-8 py-4">Ubicación</th>
                  <th class="px-8 py-4">Ingreso</th>
                  <th class="px-8 py-4">Estancia</th>
                  <th class="px-8 py-4">Médico Tratante</th>
                  <th class="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr *ngFor="let i of ingresosFiltrados()" class="hover:bg-slate-50/80 transition-colors group">
                  <td class="px-8 py-5">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                        {{ i.paciente?.nombres?.[0] }}{{ i.paciente?.apellidos?.[0] }}
                      </div>
                      <div>
                        <div class="font-bold text-slate-900">{{ i.paciente?.nombres }} {{ i.paciente?.apellidos }}</div>
                        <div class="text-[10px] font-bold text-slate-400">EXP: {{ i.paciente?.numeroExpediente }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-8 py-5">
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-slate-700">Cama {{ i.cama?.codigo }}</span>
                      <span class="text-[10px] font-medium text-slate-400 uppercase">
                        {{ i.cama?.habitacion?.sala?.nombre }} / Pieza {{ i.cama?.habitacion?.numero }}
                      </span>
                    </div>
                  </td>
                  <td class="px-8 py-5 text-sm text-slate-600 font-medium">
                    {{ i.fechaIngreso | date:'dd MMM yyyy, HH:mm' }}
                  </td>
                  <td class="px-8 py-5">
                    <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase">
                      {{ calcularDiasEstancia(i.fechaIngreso) }} días
                    </span>
                  </td>
                  <td class="px-8 py-5">
                    <div class="text-sm font-bold text-slate-700">{{ i.medicoIngreso?.nombres }} {{ i.medicoIngreso?.apellidos }}</div>
                  </td>
                  <td class="px-8 py-5 text-right">
                    <div class="flex justify-end gap-2">
                      <button (click)="abrirKardex(i)" class="px-3 py-1.5 bg-violet-50 text-violet-600 rounded-xl text-[10px] font-black uppercase hover:bg-violet-100 transition-colors">Kardex</button>
                      <button (click)="abrirNotasEvolucion(i)" class="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-100 transition-colors">Evolución</button>
                      <button (click)="abrirModalEgreso(i)" class="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-100 transition-colors">Dar Alta</button>
                      <button (click)="abrirModalTraslado(i)" class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-100 transition-colors">Traslado</button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="ingresos().length === 0">
                  <td colspan="6" class="px-8 py-20 text-center">
                    <div class="text-slate-300 mb-4">
                      <svg class="w-12 h-12 mx-auto animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    </div>
                    <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">No se encontraron pacientes internados</p>
                    <button (click)="cargarCenso()" class="mt-4 text-blue-600 font-bold text-xs uppercase hover:underline">Reintentar cargar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Vista: HISTORIAL DE EGRESOS -->
          <div *ngIf="vistaActiva() === 'historial'" class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th class="px-8 py-4">Paciente</th>
                  <th class="px-8 py-4">Ingreso</th>
                  <th class="px-8 py-4">Egreso</th>
                  <th class="px-8 py-4">Tipo/Condición</th>
                  <th class="px-8 py-4">Médico Alta</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr *ngFor="let h of historialEgresos()" class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-8 py-5">
                    <div class="font-bold text-slate-900">{{ h.ingreso.paciente.nombres }} {{ h.ingreso.paciente.apellidos }}</div>
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">EXP: {{ h.ingreso.paciente.numeroExpediente }}</div>
                  </td>
                  <td class="px-8 py-5 text-xs text-slate-500 font-medium">
                    {{ h.ingreso.fechaIngreso | date:'dd MMM yyyy, HH:mm' }}
                  </td>
                  <td class="px-8 py-5 text-xs text-slate-600 font-bold">
                    {{ h.fechaEgreso | date:'dd MMM yyyy, HH:mm' }}
                  </td>
                  <td class="px-8 py-5">
                    <div class="text-[10px] font-black text-blue-600 uppercase">{{ h.tipoEgreso }}</div>
                    <div class="text-[10px] font-bold text-slate-400 uppercase">COND: {{ h.condicionEgreso }}</div>
                  </td>
                  <td class="px-8 py-5">
                    <div class="text-sm font-bold text-slate-700">{{ h.medicoEgreso.nombres }} {{ h.medicoEgreso.apellidos }}</div>
                  </td>
                </tr>
                <tr *ngIf="historialEgresos().length === 0">
                  <td colspan="5" class="px-8 py-20 text-center">
                    <div class="text-slate-300 font-bold uppercase tracking-widest text-sm italic">No hay altas registradas aún</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- Modal Notas de Evolución -->
      <div *ngIf="mostrarNotas()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
          <!-- Header Modal -->
          <div class="px-10 py-6 bg-white border-b border-slate-50 flex items-center justify-between shrink-0">
            <div>
              <h3 class="text-xl font-black text-slate-900 tracking-tight">Notas de Evolución</h3>
              <p class="text-xs text-slate-500 font-medium uppercase tracking-widest">Paciente: {{ ingresoSeleccionado()?.paciente.nombres }} {{ ingresoSeleccionado()?.paciente.apellidos }}</p>
            </div>
            <div class="flex items-center gap-3">
              <button (click)="descargarPdf()" [disabled]="generandoPdf()"
                      class="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-100 transition-all flex items-center gap-2 disabled:opacity-50">
                <svg *ngIf="!generandoPdf()" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                <svg *ngIf="generandoPdf()" class="animate-spin h-4 w-4 text-emerald-700" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {{ generandoPdf() ? 'Generando...' : 'Imprimir Historial' }}
              </button>
              <button (click)="mostrarNotas.set(false)" class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-hidden flex flex-col lg:flex-row">
            <!-- Columna Izquierda: Historial -->
            <div class="flex-1 overflow-y-auto p-10 bg-slate-50/30 border-r border-slate-50">
              <div class="space-y-6">
                <div *ngFor="let n of notasActuales()" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative">
                  <div class="flex justify-between items-start mb-4">
                    <div class="text-[10px] font-black text-blue-600 uppercase tracking-widest">{{ n.fecha | date:'dd MMM yyyy, HH:mm' }}</div>
                    <div class="text-[10px] font-bold text-slate-400 uppercase">{{ n.medico.nombres }} {{ n.medico.apellidos }}</div>
                  </div>
                  <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{{ n.nota }}</p>
                  
                  <div *ngIf="n.frecuenciaCardiaca || n.temperatura || n.presionArterial" class="mt-4 pt-4 border-t border-slate-50 flex flex-wrap gap-4">
                    <div *ngIf="n.frecuenciaCardiaca" class="text-[9px] font-bold text-slate-400 uppercase">FC: <span class="text-slate-900">{{ n.frecuenciaCardiaca }} lpm</span></div>
                    <div *ngIf="n.presionArterial" class="text-[9px] font-bold text-slate-400 uppercase">PA: <span class="text-slate-900">{{ n.presionArterial }} mmHg</span></div>
                    <div *ngIf="n.temperatura" class="text-[9px] font-bold text-slate-400 uppercase">T°: <span class="text-slate-900">{{ n.temperatura }} °C</span></div>
                    <div *ngIf="n.saturacionOxigeno" class="text-[9px] font-bold text-slate-400 uppercase">SatO2: <span class="text-slate-900">{{ n.saturacionOxigeno }}%</span></div>
                  </div>
                </div>
                <div *ngIf="notasActuales().length === 0" class="py-20 text-center">
                  <div class="text-slate-300 font-bold uppercase tracking-widest text-xs italic">No hay notas registradas</div>
                </div>
              </div>
            </div>

            <!-- Columna Derecha: Nueva Nota -->
            <div class="w-full lg:w-[400px] p-10 bg-white overflow-y-auto">
              <form [formGroup]="formNotaEvolucion" (ngSubmit)="guardarNotaEvolucion()" class="space-y-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relato de Evolución *</label>
                  <textarea formControlName="nota" rows="8" placeholder="Describa el progreso del paciente..."
                            class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">F. Cardíaca</label>
                    <input type="number" formControlName="frecuenciaCardiaca" placeholder="80"
                           class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"/>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">F. Resp.</label>
                    <input type="number" formControlName="frecuenciaRespiratoria" placeholder="18"
                           class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"/>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">P. Arterial</label>
                    <input type="text" formControlName="presionArterial" placeholder="120/80"
                           class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"/>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Temp. °C</label>
                    <input type="number" step="0.1" formControlName="temperatura" placeholder="36.5"
                           class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"/>
                  </div>
                </div>

                <button type="submit" [disabled]="formNotaEvolucion.invalid || guardandoNota()"
                        class="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0">
                  <svg *ngIf="guardandoNota()" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {{ guardandoNota() ? 'Guardando...' : 'Registrar Nota' }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Admisión -->
      <div *ngIf="mostrarAdmision()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300">
          <div class="px-10 py-8 bg-white border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-black text-slate-900 tracking-tight">Nueva Admisión</h3>
              <p class="text-sm text-slate-500 font-medium">Complete los datos para internar al paciente</p>
            </div>
            <button (click)="mostrarAdmision.set(false)" class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form [formGroup]="formAdmision" (ngSubmit)="confirmarAdmision()" class="p-10">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <!-- Columna Izquierda: Paciente -->
              <div class="space-y-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar Paciente <span class="text-rose-500">*</span></label>
                  <div class="relative">
                    <input type="text" [formControl]="searchPaciente" placeholder="Nombre o DNI..."
                           class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                    <div *ngIf="buscandoPacientes()" class="absolute right-4 top-4">
                      <div class="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                  
                  <!-- Resultados Búsqueda -->
                  <div *ngIf="pacientesEncontrados().length > 0" class="mt-2 bg-white border border-slate-100 rounded-2xl shadow-lg max-h-48 overflow-y-auto overflow-x-hidden p-2 space-y-1">
                    <button type="button" *ngFor="let p of pacientesEncontrados()" (click)="seleccionarPaciente(p)"
                            class="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-xl transition-colors group">
                      <div class="font-bold text-slate-800 group-hover:text-blue-700">{{ p.nombres }} {{ p.apellidos }}</div>
                      <div class="text-[10px] text-slate-400 font-bold uppercase">DNI: {{ p.dni }} | EXP: {{ p.numeroExpediente }}</div>
                    </button>
                  </div>

                  <!-- Paciente Seleccionado Card -->
                  <div *ngIf="pacienteSeleccionado()" class="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {{ pacienteSeleccionado().nombres[0] }}
                      </div>
                      <div>
                        <div class="text-sm font-black text-blue-900">{{ pacienteSeleccionado().nombres }} {{ pacienteSeleccionado().apellidos }}</div>
                        <div class="text-[10px] font-bold text-blue-400">PACIENTE SELECCIONADO</div>
                      </div>
                    </div>
                    <button (click)="pacienteSeleccionado.set(null)" class="text-blue-400 hover:text-blue-600">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo de Ingreso <span class="text-rose-500">*</span></label>
                  <textarea formControlName="motivoIngreso" rows="3" placeholder="Describa la causa clínica del internamiento..."
                            class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
                </div>
              </div>

              <!-- Columna Derecha: Cama y Médico -->
              <div class="space-y-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Servicio de Admisión <span class="text-rose-500">*</span></label>
                  <select formControlName="servicioId" (change)="alCambiarServicio($event)" class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                    <option value="">Seleccione servicio...</option>
                    <option *ngFor="let s of servicios()" [value]="s.id">{{ s.catServicio?.nombre }}</option>
                  </select>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Cama Disponible <span class="text-rose-500">*</span></label>
                  <select formControlName="camaId" class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                    <option [value]="null">Seleccione una cama...</option>
                    <option *ngFor="let c of camasDisponibles()" [value]="c.id">
                      Cama {{ c.codigo }} - {{ c.habitacion.sala.nombre }} (Pieza {{ c.habitacion.numero }})
                    </option>
                  </select>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Médico que Autoriza <span class="text-rose-500">*</span></label>
                  <select formControlName="medicoIngresoId" class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                    <option [value]="null">Seleccione médico...</option>
                    <option *ngFor="let m of medicos()" [value]="m.id">{{ m.nombres }} {{ m.apellidos }}</option>
                  </select>
                </div>
              </div>

            </div>

            <div class="mt-12 flex justify-end gap-4">
              <button type="button" (click)="mostrarAdmision.set(false)" 
                      class="px-8 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors">Cancelar</button>
              <button type="submit" [disabled]="formAdmision.invalid || !pacienteSeleccionado() || guardando()"
                      class="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all">
                {{ guardando() ? 'Procesando...' : 'Confirmar Ingreso' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Egreso -->
      <div *ngIf="mostrarEgreso()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
          <div class="px-10 py-8 bg-white border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-black text-slate-900 tracking-tight">Registrar Egreso (Alta)</h3>
              <p class="text-sm text-slate-500 font-medium">Paciente: {{ ingresoParaEgreso()?.paciente?.nombres }} {{ ingresoParaEgreso()?.paciente?.apellidos }}</p>
            </div>
            <button (click)="mostrarEgreso.set(false)" class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form [formGroup]="formEgreso" (ngSubmit)="confirmarEgreso()" class="p-10 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Egreso <span class="text-rose-500">*</span></label>
                <select formControlName="tipoEgreso" class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                  <option value="ALTA_MEDICA">ALTA MÉDICA</option>
                  <option value="ALTA_SOLICITADA">ALTA SOLICITADA</option>
                  <option value="TRASLADO">TRASLADO A OTRO CENTRO</option>
                  <option value="DEFUNCION">DEFUNCIÓN</option>
                  <option value="FUGA">FUGA</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Condición al Egreso <span class="text-rose-500">*</span></label>
                <select formControlName="condicionEgreso" class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                  <option value="ESTABLE">ESTABLE / CURADO</option>
                  <option value="MEJORADO">MEJORADO</option>
                  <option value="IGUAL">ESTADO IGUAL</option>
                  <option value="CRITICO">CRÍTICO</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Médico que Autoriza Egreso <span class="text-rose-500">*</span></label>
              <select formControlName="medicoEgresoId" class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                <option [value]="null">Seleccione médico...</option>
                <option *ngFor="let m of medicos()" [value]="m.id">{{ m.nombres }} {{ m.apellidos }}</option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resumen Clínico (Epicrisis)</label>
              <textarea formControlName="epicrisis" rows="3" placeholder="Resumen del estado al alta o indicaciones..."
                        class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
            </div>

            <div class="mt-8 flex justify-end gap-4">
              <button type="button" (click)="mostrarEgreso.set(false)" 
                      class="px-8 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors">Cancelar</button>
              <button type="submit" [disabled]="formEgreso.invalid || procesandoEgreso()"
                      class="px-10 py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-xl shadow-rose-100 hover:bg-rose-700 disabled:opacity-50 transition-all">
                {{ procesandoEgreso() ? 'Registrando...' : 'Confirmar Egreso' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: TRASLADO DE PACIENTE -->
      <div *ngIf="mostrarTraslado()" class="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in">
          
          <div class="p-8 overflow-y-auto">
            <div class="flex justify-between items-start mb-6">
              <div>
                <h2 class="text-2xl font-black text-slate-900 tracking-tight">Traslado de Paciente</h2>
                <p class="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Reubicación o transferencia externa</p>
              </div>
              <button (click)="mostrarTraslado.set(false)" class="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Paciente Info Banner -->
            <div *ngIf="ingresoParaTraslado()" class="mb-6 p-4 bg-blue-50 rounded-2xl flex items-center gap-3 border border-blue-100/50">
              <div class="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {{ ingresoParaTraslado().paciente.nombres[0] }}
              </div>
              <div>
                <div class="text-xs font-black text-blue-900">{{ ingresoParaTraslado().paciente.nombres }} {{ ingresoParaTraslado().paciente.apellidos }}</div>
                <div class="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Ubicación Actual: Cama {{ ingresoParaTraslado().cama.codigo }}</div>
              </div>
            </div>

            <!-- Selector de Tipo de Traslado -->
            <div class="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button (click)="cambiarTipoTraslado('INTERNO')" 
                      [class.bg-white]="tipoTraslado() === 'INTERNO'"
                      [class.shadow-sm]="tipoTraslado() === 'INTERNO'"
                      class="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">
                Interno
              </button>
              <button (click)="cambiarTipoTraslado('EXTERNO')" 
                      [class.bg-white]="tipoTraslado() === 'EXTERNO'"
                      [class.shadow-sm]="tipoTraslado() === 'EXTERNO'"
                      class="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">
                Externo
              </button>
            </div>

            <form [formGroup]="formTraslado" (ngSubmit)="confirmarTraslado()" class="space-y-5">
              
              <div *ngIf="tipoTraslado() === 'INTERNO'" class="space-y-5">
                <div class="space-y-1.5">
                  <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nuevo Servicio</label>
                  <select formControlName="servicioId" (change)="alCambiarServicio($event)" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                    <option value="">Seleccione servicio...</option>
                    <option *ngFor="let s of servicios()" [value]="s.id">{{ s.catServicio?.nombre }}</option>
                  </select>
                </div>

                <div class="space-y-1.5">
                  <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 text-blue-600">Nueva Cama Disponible *</label>
                  <select formControlName="camaDestinoId" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold">
                    <option [value]="null">Seleccione una cama...</option>
                    <option *ngFor="let c of camasDisponibles()" [value]="c.id">
                      Cama {{ c.codigo }} - {{ c.habitacion.sala.nombre }}
                    </option>
                  </select>
                </div>
              </div>

              <div *ngIf="tipoTraslado() === 'EXTERNO'" class="space-y-1.5">
                <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Establecimiento de Destino *</label>
                <input type="text" formControlName="establecimientoDestino" placeholder="Ej: Hospital Escuela..."
                       class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>

              <div class="space-y-1.5">
                <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo del Traslado *</label>
                <textarea formControlName="motivoTraslado" rows="2" placeholder="Justificación del movimiento..."
                          class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
              </div>

              <div class="space-y-1.5">
                <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Médico que Autoriza *</label>
                <select formControlName="medicoAutorizaId" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                  <option [value]="null">Seleccione médico...</option>
                  <option *ngFor="let m of medicos()" [value]="m.id">{{ m.nombres }} {{ m.apellidos }}</option>
                </select>
              </div>

              <div class="mt-8 flex gap-3">
                <button type="button" (click)="mostrarTraslado.set(false)" 
                        class="flex-1 py-3.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors text-sm">Cancelar</button>
                <button type="submit" [disabled]="formTraslado.invalid || procesandoTraslado()"
                        class="flex-[2] py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all text-sm">
                  {{ procesandoTraslado() ? 'Procesando...' : 'Confirmar Traslado' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modal Kardex de Enfermería -->
      <div *ngIf="mostrarKardex()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
        <div class="bg-slate-50 rounded-[3rem] shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col animate-in">
          <!-- Header Moderno -->
          <div class="px-10 py-8 bg-white border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-6">
              <div class="w-16 h-16 bg-violet-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-violet-100">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
              </div>
              <div>
                <h2 class="text-2xl font-black text-slate-900 tracking-tight">Kardex de Enfermería</h2>
                <div class="flex items-center gap-2 mt-1">
                  <span class="px-2 py-0.5 bg-violet-50 text-violet-600 rounded-md text-[10px] font-black uppercase tracking-wider">Control Clínico</span>
                  <p class="text-sm text-slate-500 font-medium italic">Paciente: {{ ingresoSeleccionado()?.paciente.nombres }} {{ ingresoSeleccionado()?.paciente.apellidos }}</p>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="flex bg-slate-100 p-1.5 rounded-2xl">
                <button (click)="pestanaKardex.set('MEDICAMENTOS')" 
                        [class]="pestanaKardex() === 'MEDICAMENTOS' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-500 hover:text-slate-700'"
                        class="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                  Medicamentos
                </button>
                <button (click)="pestanaKardex.set('SIGNOS')" 
                        [class]="pestanaKardex() === 'SIGNOS' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-500 hover:text-slate-700'"
                        class="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                  Signos Vitales
                </button>
              </div>

              <button (click)="descargarKardexPdf()" [disabled]="generandoKardexPdf()"
                      class="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 disabled:opacity-50">
                <svg *ngIf="!generandoKardexPdf()" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <svg *ngIf="generandoKardexPdf()" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                {{ generandoKardexPdf() ? 'Generando...' : 'PDF' }}
              </button>

              <button (click)="mostrarKardex.set(false)" class="p-3 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all text-slate-400">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-hidden flex gap-8 p-8">
            
            <div class="w-1/3 flex flex-col gap-6 overflow-hidden">
              
              <!-- Tab Medicamentos -->
              <div *ngIf="pestanaKardex() === 'MEDICAMENTOS'" class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
                <h3 class="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                  <span class="w-2 h-6 bg-violet-500 rounded-full"></span>
                  Registrar Administración
                </h3>
                
                <form [formGroup]="formKardex" (ngSubmit)="registrarAdministracion()" class="space-y-4 flex-1 overflow-y-auto pr-2 custom-scroll">
                  <div class="space-y-1.5 relative">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medicamento *</label>
                    <div class="relative">
                      <input type="text" [formControl]="searchMed" placeholder="Buscar fármaco por nombre..."
                             (focus)="mostrarResultadosMeds.set(true)"
                             class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 outline-none font-bold text-slate-700"/>
                      
                      <!-- Resultados del Buscador -->
                      <div *ngIf="mostrarResultadosMeds() && medsFiltrados().length > 0" 
                           class="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 space-y-1">
                        <button type="button" *ngFor="let m of medsFiltrados()" (click)="seleccionarMed(m)"
                                class="w-full text-left px-4 py-3 hover:bg-violet-50 rounded-xl transition-all group">
                          <div class="font-bold text-slate-800 group-hover:text-violet-700 text-xs">{{ m.nombreGenerico }}</div>
                          <div class="text-[9px] text-slate-400 font-bold uppercase">{{ m.concentracion }} | {{ m.presentacion }}</div>
                        </button>
                      </div>
                    </div>

                    <!-- Badge de Medicamento Seleccionado -->
                    <div *ngIf="medSeleccionadoKardex()" class="mt-2 p-3 bg-violet-50 rounded-xl border border-violet-100 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                        <span class="text-[11px] font-black text-violet-700 uppercase tracking-tight">{{ medSeleccionadoKardex().nombreGenerico }}</span>
                      </div>
                      <button type="button" (click)="deseleccionarMed()" class="text-violet-300 hover:text-violet-600">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dosis *</label>
                      <select formControlName="dosis" class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 outline-none appearance-none font-bold">
                        <option value="">Seleccione dosis...</option>
                        <option value="1 Tableta">1 Tableta</option>
                        <option value="2 Tabletas">2 Tabletas</option>
                        <option value="1/2 Tableta">1/2 Tableta</option>
                        <option value="1 Cápsula">1 Cápsula</option>
                        <option value="1 Ampolla">1 Ampolla</option>
                        <option value="1 Vial">1 Vial</option>
                        <option value="5 ml">5 ml</option>
                        <option value="10 ml">10 ml</option>
                        <option value="20 ml">20 ml</option>
                        <option value="1 Aplicación">1 Aplicación</option>
                        <option value="1 Puff">1 Puff</option>
                      </select>
                    </div>
                    <div class="space-y-1.5">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vía</label>
                      <select formControlName="via" class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 outline-none appearance-none font-bold">
                        <option value="ORAL">ORAL</option>
                        <option value="INTRAVENOSA">I.V.</option>
                        <option value="INTRAMUSCULAR">I.M.</option>
                        <option value="SUBCUTANEA">S.C.</option>
                        <option value="TOPICA">TÓPICA</option>
                      </select>
                    </div>
                  </div>

                  <div class="space-y-1.5">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Programada *</label>
                    <input type="datetime-local" formControlName="fechaProgramada"
                           class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 outline-none font-bold"/>
                  </div>

                  <div class="space-y-1.5">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observaciones</label>
                    <textarea formControlName="observaciones" rows="2" placeholder="Notas..."
                              class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none font-medium"></textarea>
                  </div>

                  <button type="submit" [disabled]="formKardex.invalid || guardandoKardex()"
                          class="w-full py-4 bg-violet-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-violet-100 hover:bg-violet-700 disabled:opacity-50 transition-all text-xs mb-2">
                    {{ guardandoKardex() ? 'Procesando...' : 'Registrar Aplicación' }}
                  </button>
                </form>
              </div>

              <!-- Tab Signos Vitales -->
              <div *ngIf="pestanaKardex() === 'SIGNOS'" class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full overflow-y-auto">
                <h3 class="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                  <span class="w-2 h-6 bg-blue-500 rounded-full"></span>
                  Control de Signos
                </h3>

                <form [formGroup]="formSignosVitales" (ngSubmit)="registrarSignosKardex()" class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">F. Cardíaca (bpm)</label>
                      <input type="number" formControlName="frecuenciaCardiaca" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"/>
                    </div>
                    <div class="space-y-1.5">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">F. Resp (rpm)</label>
                      <input type="number" formControlName="frecuenciaRespiratoria" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"/>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">P. Arterial</label>
                      <input type="text" formControlName="presionArterial" placeholder="120/80" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"/>
                    </div>
                    <div class="space-y-1.5">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Temp (°C)</label>
                      <input type="number" step="0.1" formControlName="temperatura" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"/>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SatO2 (%)</label>
                      <input type="number" formControlName="saturacionOxigeno" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"/>
                    </div>
                    <div class="space-y-1.5">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Glucometría</label>
                      <input type="number" formControlName="glucoMetria" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"/>
                    </div>
                  </div>

                  <div class="space-y-1.5">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observaciones</label>
                    <textarea formControlName="observaciones" rows="2" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium"></textarea>
                  </div>

                  <button type="submit" [disabled]="formSignosVitales.invalid || guardandoKardex()"
                          class="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all text-xs">
                    {{ guardandoKardex() ? 'Guardando...' : 'Registrar Signos' }}
                  </button>
                </form>
              </div>
            </div>

            <!-- Panel Derecho: Historial / Tabla -->
            <div class="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
              <div class="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <h3 class="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Historial de Registros</h3>
                <span class="text-[10px] font-bold text-slate-400 italic">Ordenado por fecha descendente</span>
              </div>

              <div class="flex-1 overflow-y-auto p-4">
                
                <!-- Tabla Medicamentos -->
                <table *ngIf="pestanaKardex() === 'MEDICAMENTOS'" class="w-full text-left">
                  <thead>
                    <tr class="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                      <th class="px-6 py-3">Medicamento</th>
                      <th class="px-6 py-3">Programado</th>
                      <th class="px-6 py-3">Aplicado</th>
                      <th class="px-6 py-3">Dosis/Vía</th>
                      <th class="px-6 py-3">Estado</th>
                      <th class="px-6 py-3">Enfermera</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    <tr *ngFor="let k of kardexActual()" class="text-sm hover:bg-slate-50/50 transition-colors">
                      <td class="px-6 py-4 font-bold text-slate-800">{{ k.medicamento.nombreGenerico }}</td>
                      <td class="px-6 py-4 text-xs text-slate-500">{{ k.fechaProgramada | date:'dd/MM HH:mm' }}</td>
                      <td class="px-6 py-4 text-xs font-bold text-slate-700">{{ k.fechaAplicacion | date:'dd/MM HH:mm' }}</td>
                      <td class="px-6 py-4">
                        <span class="text-xs font-bold">{{ k.dosis }}</span>
                        <span class="text-[9px] block text-slate-400 font-black uppercase">{{ k.via || '--' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span [class]="{
                          'bg-emerald-50 text-emerald-600': k.estado === 'ADMINISTRADO',
                          'bg-amber-50 text-amber-600': k.estado === 'PENDIENTE',
                          'bg-rose-50 text-rose-600': k.estado === 'OMITIDO' || k.estado === 'RECHAZADO'
                        }" class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter">
                          {{ k.estado }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-[10px] font-bold text-slate-500">{{ k.enfermera.nombres }} {{ k.enfermera.apellidos }}</td>
                    </tr>
                    <tr *ngIf="kardexActual().length === 0">
                      <td colspan="6" class="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">No hay registros de medicación</td>
                    </tr>
                  </tbody>
                </table>

                <!-- Tabla Signos Vitales -->
                <table *ngIf="pestanaKardex() === 'SIGNOS'" class="w-full text-left">
                  <thead>
                    <tr class="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                      <th class="px-6 py-3">Fecha/Hora</th>
                      <th class="px-6 py-3">FC/FR</th>
                      <th class="px-6 py-3">PA</th>
                      <th class="px-6 py-3">Temp/Sat</th>
                      <th class="px-6 py-3">Peso/Gluco</th>
                      <th class="px-6 py-3">Responsable</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    <tr *ngFor="let s of signosActuales()" class="text-sm hover:bg-slate-50/50 transition-colors">
                      <td class="px-6 py-4 font-bold text-slate-800">{{ s.fecha | date:'dd/MM HH:mm' }}</td>
                      <td class="px-6 py-4">
                        <span class="text-rose-600 font-bold">{{ s.frecuenciaCardiaca || '--' }}</span> / 
                        <span class="text-blue-600 font-bold">{{ s.frecuenciaRespiratoria || '--' }}</span>
                      </td>
                      <td class="px-6 py-4 font-bold text-slate-700">{{ s.presionArterial || '--' }}</td>
                      <td class="px-6 py-4">
                        <span class="text-amber-600 font-bold">{{ s.temperatura || '--' }}°C</span> / 
                        <span class="text-emerald-600 font-bold">{{ s.saturacionOxigeno || '--' }}%</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-slate-600">{{ s.pesoKg || '--' }}kg</span> / 
                        <span class="text-slate-600">{{ s.glucoMetria || '--' }}</span>
                      </td>
                      <td class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{{ s.usuario.nombres }} {{ s.usuario.apellidos }}</td>
                    </tr>
                    <tr *ngIf="signosActuales().length === 0">
                      <td colspan="6" class="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">Sin registros de signos vitales</td>
                    </tr>
                  </tbody>
                </table>

              </div>
            </div>

          </div>
        </div>
    </div>
  `,
  styles: [`
    .animate-in { animation: enter 0.3s ease-out; }
    @keyframes enter {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
  `]
})
export class GestionHospitalizacionComponent implements OnInit {
  private svc = inject(HospitalizacionService);
  private medSvc = inject(MedicamentosService);
  private notification = inject(NotificationService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);

  ingresos = signal<any[]>([]);
  searchCenso = new FormControl('');
  ingresosFiltrados = computed(() => {
    const term = this.searchCenso.value?.toLowerCase() || '';
    if (!term) return this.ingresos();
    return this.ingresos().filter(i => 
      i.paciente?.nombres?.toLowerCase().includes(term) || 
      i.paciente?.apellidos?.toLowerCase().includes(term) || 
      i.paciente?.numeroExpediente?.toLowerCase().includes(term)
    );
  });
  camasDisponibles = signal<any[]>([]);
  totalCamasDisponibles = signal(0);
  servicios = signal<any[]>([]);
  medicos = signal<any[]>([]);
  catalogoMedicamentos = signal<any[]>([]);
  
  mostrarMapa = signal(false);
  mapaDatos = signal<any[]>([]);
  cargandoMapa = signal(false);
  mostrarAdmision = signal(false);
  guardando = signal(false);

  // Traslados
  mostrarTraslado = signal(false);
  ingresoParaTraslado = signal<any>(null);
  tipoTraslado = signal<'INTERNO' | 'EXTERNO'>('INTERNO');
  procesandoTraslado = signal(false);

  // Notas de Evolución
  mostrarNotas = signal(false);
  notasActuales = signal<any[]>([]);
  ingresoSeleccionado = signal<any>(null);
  guardandoNota = signal(false);
  generandoPdf = signal(false);

  // Kardex
  mostrarKardex = signal(false);
  kardexActual = signal<any[]>([]);
  signosActuales = signal<any[]>([]);
  guardandoKardex = signal(false);
  pestanaKardex = signal<'MEDICAMENTOS' | 'SIGNOS'>('MEDICAMENTOS');
  generandoKardexPdf = signal(false);

  formKardex = this.fb.group({
    medicamentoId: [null as number | null, Validators.required],
    dosis: ['', Validators.required],
    via: [''],
    fechaProgramada: [this.obtenerFechaLocalISO(), [Validators.required, DateValidators.dateReal()]],
    estado: ['PENDIENTE', Validators.required],
    observaciones: [''],
    enfermeraId: [null as number | null, Validators.required]
  });

  formSignosVitales = this.fb.group({
    frecuenciaCardiaca: [null as number | null],
    frecuenciaRespiratoria: [null as number | null],
    presionArterial: [''],
    temperatura: [null as number | null],
    saturacionOxigeno: [null as number | null],
    pesoKg: [null as number | null],
    glucoMetria: [null as number | null],
    observaciones: [''],
    usuarioId: [null as number | null, Validators.required]
  });

  formNotaEvolucion = this.fb.group({
    nota: ['', Validators.required],
    frecuenciaCardiaca: [null as number | null],
    frecuenciaRespiratoria: [null as number | null],
    presionArterial: [''],
    temperatura: [null as number | null],
    saturacionOxigeno: [null as number | null],
    medicoId: [null as number | null, Validators.required]
  });

  // ... (rest of signals)
  searchPaciente = this.fb.control('');
  pacientesEncontrados = signal<any[]>([]);
  buscandoPacientes = signal(false);
  pacienteSeleccionado = signal<any>(null);

  // Buscador de Medicamentos Kardex
  searchMed = this.fb.control('');
  medsFiltrados = signal<any[]>([]);
  mostrarResultadosMeds = signal(false);
  medSeleccionadoKardex = signal<any>(null);

  formAdmision = this.fb.group({
    pacienteId: [null as number | null, Validators.required],
    camaId: [null as number | null, Validators.required],
    servicioId: [null as number | null, Validators.required],
    motivoIngreso: ['', Validators.required],
    medicoIngresoId: [null as number | null, Validators.required]
  });

  formTraslado = this.fb.group({
    tipo: ['INTERNO', Validators.required],
    // Interno
    servicioId: [null as number | null],
    camaDestinoId: [null as number | null],
    // Externo
    establecimientoDestino: [''],
    motivoTraslado: ['', Validators.required],
    medicoAutorizaId: [null as number | null, Validators.required]
  });

  vistaActiva = signal<'censo' | 'historial'>('censo');
  historialEgresos = signal<any[]>([]);

  ngOnInit() {
    this.cargarCenso();
    this.cargarHistorial();
    this.cargarServicios();
    this.cargarMedicos();
    this.medSvc.listar(1, 200).subscribe(res => {
      const data = res.data ?? res;
      this.catalogoMedicamentos.set(Array.isArray(data) ? data : []);
    });
    this.cargarTotalCamas();
    this.setupBusquedaPaciente();
    this.setupBusquedaMedicamento();
  }

  obtenerFechaLocalISO(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().substring(0, 16);
  }

  cargarTotalCamas() {
    this.svc.listarCamasDisponibles().subscribe(res => {
      this.totalCamasDisponibles.set(res.length);
    });
  }

  cargarCenso() {
    this.svc.listarIngresosActivos().subscribe({
      next: (res) => {
        console.log('Censo cargado:', res);
        this.ingresos.set(Array.isArray(res) ? res : []);
      },
      error: (err) => {
        console.error('Error al cargar censo:', err);
        this.notification.error('No se pudo cargar el censo de pacientes');
      }
    });
  }

  abrirMapa() {
    this.mostrarMapa.set(true);
    this.cargarMapa();
  }

  cargarMapa() {
    this.cargandoMapa.set(true);
    this.svc.obtenerMapaCamas().subscribe({
      next: (res) => {
        this.mapaDatos.set(res);
        this.cargandoMapa.set(false);
      },
      error: () => this.cargandoMapa.set(false)
    });
  }

  cargarHistorial() {
    this.svc.listarHistorialEgresos().subscribe(res => {
      this.historialEgresos.set(Array.isArray(res) ? res : []);
    });
  }

  // ... (rest of existing methods)

  cambiarVista(vista: 'censo' | 'historial') {
    this.vistaActiva.set(vista);
    if (vista === 'censo') this.cargarCenso();
    else this.cargarHistorial();
  }

  cargarServicios() {
    this.http.get<any>(`${environment.apiUrl}/establecimientos/mis-servicios`).subscribe(res => {
      const data = res.data?.data ?? res.data ?? (Array.isArray(res) ? res : []);
      console.log('Servicios cargados:', data);
      this.servicios.set(data);
    });
  }

  cargarMedicos() {
    this.http.get<any>(`${environment.apiUrl}/usuarios/medicos-establecimiento`).subscribe(res => {
      const data = res.data?.data ?? res.data ?? (Array.isArray(res) ? res : []);
      this.medicos.set(data);
    });
  }

  alCambiarServicio(event: any) {
    const id = event.target.value;
    if (id && id !== 'null') {
      this.svc.listarCamasDisponibles(Number(id)).subscribe(res => {
        this.camasDisponibles.set(Array.isArray(res) ? res : []);
      });
    } else {
      this.camasDisponibles.set([]);
    }
  }

  setupBusquedaPaciente() {
    this.searchPaciente.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 3) return of([]);
        this.buscandoPacientes.set(true);
        return this.http.get<any>(`${environment.apiUrl}/pacientes/buscar?q=${term}`);
      })
    ).subscribe(res => {
      const data = res.data?.data ?? res.data ?? (Array.isArray(res) ? res : []);
      this.pacientesEncontrados.set(data);
      this.buscandoPacientes.set(false);
    });
  }

  seleccionarPaciente(p: any) {
    this.pacienteSeleccionado.set(p);
    this.formAdmision.patchValue({ pacienteId: p.id });
    this.pacientesEncontrados.set([]);
    this.searchPaciente.setValue('', { emitEvent: false });
  }

  abrirModalAdmision() {
    this.formAdmision.reset();
    this.pacienteSeleccionado.set(null);
    this.mostrarAdmision.set(true);
  }

  confirmarAdmision() {
    if (this.formAdmision.invalid) return;
    
    this.guardando.set(true);
    const user = this.auth.obtenerUsuario();
    const val = this.formAdmision.value;
    const data = {
      ...val,
      pacienteId: Number(val.pacienteId),
      camaId: Number(val.camaId),
      servicioId: Number(val.servicioId),
      medicoIngresoId: Number(val.medicoIngresoId),
      creadoPorId: user?.id ?? 1
    };

    this.svc.admitirPaciente(data).subscribe({
      next: () => {
        this.notification.success('Paciente admitido correctamente');
        this.mostrarAdmision.set(false);
        this.cargarCenso();
        this.cargarTotalCamas();
        this.guardando.set(false);
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Error al procesar admisión');
        this.guardando.set(false);
      }
    });
  }

  mostrarEgreso = signal(false);
  ingresoParaEgreso = signal<any>(null);
  procesandoEgreso = signal(false);

  formEgreso = this.fb.group({
    tipoEgreso: ['ALTA_MEDICA', Validators.required],
    condicionEgreso: ['ESTABLE', Validators.required],
    epicrisis: [''],
    medicoEgresoId: [null as number | null, Validators.required]
  });

  // ... (rest of class)

  abrirModalEgreso(ingreso: any) {
    this.ingresoParaEgreso.set(ingreso);
    this.formEgreso.patchValue({ 
      medicoEgresoId: ingreso.medicoIngresoId,
      tipoEgreso: 'ALTA_MEDICA',
      condicionEgreso: 'ESTABLE',
      epicrisis: ''
    });
    this.mostrarEgreso.set(true);
  }

  confirmarEgreso() {
    if (this.formEgreso.invalid || !this.ingresoParaEgreso()) return;
    
    this.procesandoEgreso.set(true);
    const data = {
      ...this.formEgreso.value,
      ingresoId: this.ingresoParaEgreso().id,
      medicoEgresoId: Number(this.formEgreso.value.medicoEgresoId)
    };

    this.svc.registrarEgreso(data).subscribe({
      next: () => {
        this.notification.success('Alta médica registrada correctamente');
        this.mostrarEgreso.set(false);
        this.cargarCenso();
        this.cargarTotalCamas();
        this.procesandoEgreso.set(false);
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Error al registrar egreso');
        this.procesandoEgreso.set(false);
      }
    });
  }

  abrirModalTraslado(ingreso: any) {
    this.ingresoParaTraslado.set(ingreso);
    this.tipoTraslado.set('INTERNO');
    this.formTraslado.reset({
      tipo: 'INTERNO',
      medicoAutorizaId: this.auth.obtenerUsuario()?.id,
      servicioId: ingreso.cama.habitacion.sala.servicioId
    });
    this.svc.listarCamasDisponibles(ingreso.cama.habitacion.sala.servicioId).subscribe(camas => {
      this.camasDisponibles.set(camas);
    });
    this.mostrarTraslado.set(true);
  }

  cambiarTipoTraslado(tipo: 'INTERNO' | 'EXTERNO') {
    this.tipoTraslado.set(tipo);
    this.formTraslado.patchValue({ tipo });
    if (tipo === 'INTERNO') {
      this.formTraslado.get('camaDestinoId')?.setValidators(Validators.required);
      this.formTraslado.get('establecimientoDestino')?.clearValidators();
    } else {
      this.formTraslado.get('camaDestinoId')?.clearValidators();
      this.formTraslado.get('establecimientoDestino')?.setValidators(Validators.required);
    }
    this.formTraslado.get('camaDestinoId')?.updateValueAndValidity();
    this.formTraslado.get('establecimientoDestino')?.updateValueAndValidity();
  }

  confirmarTraslado() {
    if (this.formTraslado.invalid || !this.ingresoParaTraslado()) return;
    
    this.procesandoTraslado.set(true);
    const val = this.formTraslado.value;
    const ingresoId = this.ingresoParaTraslado().id;

    if (this.tipoTraslado() === 'INTERNO') {
      const data = {
        ingresoId,
        camaOrigenId: this.ingresoParaTraslado().camaId,
        camaDestinoId: Number(val.camaDestinoId),
        motivo: val.motivoTraslado,
        usuarioId: this.auth.obtenerUsuario()?.id
      };

      this.svc.trasladarPaciente(data).subscribe({
        next: () => {
          this.notification.success('Traslado interno completado');
          this.finalizarTraslado();
        },
        error: (err) => {
          this.notification.error(err.error?.message || 'Error en el traslado');
          this.procesandoTraslado.set(false);
        }
      });
    } else {
      // Traslado Externo (Egreso)
      const data = {
        ingresoId,
        medicoEgresoId: Number(val.medicoAutorizaId),
        tipoEgreso: 'TRASLADO',
        condicionEgreso: 'ESTABLE',
        epicrisis: `Traslado a ${val.establecimientoDestino}. Motivo: ${val.motivoTraslado}`
      };

      this.svc.registrarEgreso(data).subscribe({
        next: () => {
          this.notification.success('Traslado externo registrado');
          this.finalizarTraslado();
        },
        error: (err) => {
          this.notification.error(err.error?.message || 'Error al registrar traslado externo');
          this.procesandoTraslado.set(false);
        }
      });
    }
  }

  private finalizarTraslado() {
    this.mostrarTraslado.set(false);
    this.cargarCenso();
    this.cargarTotalCamas();
    this.procesandoTraslado.set(false);
  }

  abrirNotasEvolucion(ingreso: any) {
    this.ingresoSeleccionado.set(ingreso);
    this.formNotaEvolucion.reset({
      medicoId: this.auth.obtenerUsuario()?.id,
      nota: ''
    });
    this.svc.listarNotasEvolucion(ingreso.id).subscribe(notas => {
      this.notasActuales.set(notas);
      this.mostrarNotas.set(true);
    });
  }

  guardarNotaEvolucion() {
    if (this.formNotaEvolucion.invalid || !this.ingresoSeleccionado()) return;

    this.guardandoNota.set(true);
    const data = {
      ...this.formNotaEvolucion.value,
      ingresoId: this.ingresoSeleccionado().id,
      medicoId: Number(this.formNotaEvolucion.value.medicoId),
      frecuenciaCardiaca: this.formNotaEvolucion.value.frecuenciaCardiaca ? Number(this.formNotaEvolucion.value.frecuenciaCardiaca) : null,
      frecuenciaRespiratoria: this.formNotaEvolucion.value.frecuenciaRespiratoria ? Number(this.formNotaEvolucion.value.frecuenciaRespiratoria) : null,
      temperatura: this.formNotaEvolucion.value.temperatura ? Number(this.formNotaEvolucion.value.temperatura) : null,
      saturacionOxigeno: this.formNotaEvolucion.value.saturacionOxigeno ? Number(this.formNotaEvolucion.value.saturacionOxigeno) : null
    };

    this.svc.registrarNotaEvolucion(data).subscribe({
      next: (nota) => {
        this.notification.success('Nota de evolución registrada');
        this.notasActuales.update(n => [nota, ...n]);
        this.formNotaEvolucion.patchValue({ nota: '', frecuenciaCardiaca: null, frecuenciaRespiratoria: null, presionArterial: '', temperatura: null, saturacionOxigeno: null });
        this.guardandoNota.set(false);
      },
      error: () => {
        this.notification.error('Error al guardar la nota');
        this.guardandoNota.set(false);
      }
    });
  }

  descargarPdf() {
    if (!this.ingresoSeleccionado()) {
      console.warn('No hay ingreso seleccionado para descargar PDF');
      return;
    }
    
    console.log('Generando PDF para ingreso:', this.ingresoSeleccionado().id);
    this.generandoPdf.set(true);
    
    this.svc.descargarNotasPdf(this.ingresoSeleccionado().id).subscribe({
      next: (blob) => {
        console.log('PDF recibido exitosamente');
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        this.generandoPdf.set(false);
      },
      error: (err) => {
        console.error('Error al generar PDF:', err);
        this.notification.error('Error al generar el PDF');
        this.generandoPdf.set(false);
      }
    });
  }

  descargarKardexPdf() {
    if (!this.ingresoSeleccionado()) return;
    
    this.generandoKardexPdf.set(true);
    this.svc.descargarKardexPdf(this.ingresoSeleccionado().id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        this.generandoKardexPdf.set(false);
      },
      error: (err) => {
        console.error('Error al generar PDF Kardex:', err);
        this.notification.error('Error al generar el PDF del Kardex');
        this.generandoKardexPdf.set(false);
      }
    });
  }

  calcularDiasEstancia(fechaIngreso: string): number {
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    const diffTime = Math.abs(hoy.getTime() - ingreso.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays + 1; // Contamos el día de ingreso como día 1
  }

  abrirKardex(ingreso: any) {
    this.ingresoSeleccionado.set(ingreso);
    this.mostrarKardex.set(true);
    this.pestanaKardex.set('MEDICAMENTOS');
    this.cargarKardex();
    this.cargarSignosKardex();
    this.formKardex.patchValue({ enfermeraId: this.auth.obtenerUsuario()?.id });
    this.formSignosVitales.patchValue({ usuarioId: this.auth.obtenerUsuario()?.id });
  }

  cargarKardex() {
    if (!this.ingresoSeleccionado()) return;
    this.svc.listarKardex(this.ingresoSeleccionado().id).subscribe(res => {
      const data = res.data?.data ?? res.data ?? (Array.isArray(res) ? res : []);
      this.kardexActual.set(data);
    });
  }

  cargarSignosKardex() {
    if (!this.ingresoSeleccionado()) return;
    this.svc.listarSignosVitales(this.ingresoSeleccionado().id).subscribe(res => {
      const data = res.data?.data ?? res.data ?? (Array.isArray(res) ? res : []);
      this.signosActuales.set(data);
    });
  }

  registrarAdministracion() {
    if (this.formKardex.invalid) return;
    this.guardandoKardex.set(true);
    const data = { ...this.formKardex.value, ingresoId: this.ingresoSeleccionado().id };

    this.svc.registrarAdministracion(data).subscribe({
      next: (res) => {
        this.notification.success('Administración registrada');
        this.cargarKardex();
        this.formKardex.patchValue({ observaciones: '', estado: 'PENDIENTE' });
        this.guardandoKardex.set(false);
      },
      error: () => {
        this.notification.error('Error al registrar');
        this.guardandoKardex.set(false);
      }
    });
  }

  registrarSignosKardex() {
    if (this.formSignosVitales.invalid) return;
    this.guardandoKardex.set(true);
    const data = { ...this.formSignosVitales.value, ingresoId: this.ingresoSeleccionado().id };

    this.svc.registrarSignosVitales(data).subscribe({
      next: () => {
        this.notification.success('Signos vitales registrados');
        this.cargarSignosKardex();
        this.formSignosVitales.reset({ usuarioId: this.auth.obtenerUsuario()?.id });
        this.guardandoKardex.set(false);
      },
      error: () => {
        this.notification.error('Error al registrar');
        this.guardandoKardex.set(false);
      }
    });
  }

  setupBusquedaMedicamento() {
    this.searchMed.valueChanges.subscribe(term => {
      if (!term || term.length < 2) {
        this.medsFiltrados.set([]);
        return;
      }
      const search = term.toLowerCase();
      const filtrados = this.catalogoMedicamentos().filter(m => 
        m.nombreGenerico.toLowerCase().includes(search) || 
        m.nombreComercial?.toLowerCase().includes(search) ||
        m.codigo.toLowerCase().includes(search)
      );
      this.medsFiltrados.set(filtrados.slice(0, 10)); // Mostrar top 10
      this.mostrarResultadosMeds.set(true);
    });
  }

  seleccionarMed(m: any) {
    this.medSeleccionadoKardex.set(m);
    this.formKardex.patchValue({ medicamentoId: m.id });
    this.mostrarResultadosMeds.set(false);
    this.searchMed.setValue('', { emitEvent: false });
  }

  deseleccionarMed() {
    this.medSeleccionadoKardex.set(null);
    this.formKardex.patchValue({ medicamentoId: null });
    this.searchMed.setValue('');
  }

  verEstadisticas() {
    this.router.navigate(['/hospitalizacion/estadisticas']);
  }

  liberarCama(id: number) {
    this.svc.liberarCama(id).subscribe({
      next: () => {
        this.notification.success('Cama liberada correctamente');
        this.cargarMapa();
        this.cargarTotalCamas();
      },
      error: (err) => {
        this.notification.error('Error al liberar cama');
      }
    });
  }
}
