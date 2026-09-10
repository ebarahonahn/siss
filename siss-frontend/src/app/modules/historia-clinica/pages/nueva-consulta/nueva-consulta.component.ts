import { abrirPdfEnVisor } from '../../../../shared/utils/pdf-viewer';
import { Component, inject, OnInit, signal, computed, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { HistoriaClinicaService, HistoriaClinica } from '../../../../core/services/historia-clinica.service';
import { PacientesService } from '../../../../core/services/pacientes.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DiagnosticosService, CatDiagnostico } from '../../../../core/services/diagnosticos.service';
import { MedicamentosService, Medicamento } from '../../../../core/services/medicamentos.service';
import { LaboratorioService, ExamenLaboratorio } from '../../../../core/services/laboratorio.service';
import { RadiologiaService, ExamenRadiologico } from '../../../../core/services/radiologia.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DateUtils } from '../../../../core/utils/date-utils';
import { ReportePdfService } from '../../../../core/services/reporte-pdf.service';
import { FormulariosService } from '../../../../core/services/formularios.service';
import { DispensacionService } from '../../../../core/services/dispensacion.service';
import { ReferenciasService } from '../../../../core/services/referencias.service';
import { EstablecimientosService } from '../../../../core/services/establecimientos.service';
import { UsuariosService } from '../../../../core/services/usuarios.service';
import { CitasService } from '../../../../core/services/citas.service';
import { ParametrosService } from '../../../../core/services/parametros.service';
import { GeoService } from '../../../../core/services/geo.service';
import { OdontogramaComponent, DienteEstado } from '../../../../shared/components/odontograma/odontograma.component';


@Component({
  selector: 'app-nueva-consulta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, OdontogramaComponent],
  styles: [`
    .historial-sidebar {
      width: 300px;
      min-width: 260px;
      max-width: 320px;
      flex-shrink: 0;
    }
    .historial-entrada {
      transition: all 0.2s ease;
    }
    .historial-entrada:hover {
      transform: translateX(2px);
    }
    .historial-detalle {
      animation: slideDown 0.2s ease-out;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .sidebar-toggle-btn {
      writing-mode: horizontal-tb;
      transition: all 0.2s;
    }
    
    /* ── Estilos para Impresión ── */
    @media print {
      body * { visibility: hidden; }
      .print-container, .print-container * { visibility: visible; }
      .print-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: white !important;
        padding: 0 !important;
      }
      .no-print { display: none !important; }
      .print-shadow-none { shadow: none !important; box-shadow: none !important; }
      .print-border { border: 1px solid #e5e7eb !important; }
    }
  `],
  template: `
    <!-- ── Modal Post-Guardado: Selección de Impresión (Movido al inicio para mayor visibilidad) ── -->
    <div *ngIf="mostrarModalImpresion()"
         class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4">
      <div class="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500 flex flex-col">
        
        <!-- Header -->
        <div class="px-10 pt-16 pb-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
          <div class="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div class="relative z-10 flex flex-col items-center text-center">
            <div class="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md mb-8 shadow-xl border border-white/30 animate-bounce">
              <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h3 class="text-3xl font-black uppercase tracking-tight mb-2">¡Consulta Guardada!</h3>
            <p class="text-blue-100 text-sm font-medium opacity-90">Los registros han sido persistidos correctamente.</p>
          </div>
        </div>

        <!-- Body -->
        <div class="p-10 space-y-8">
          <div class="text-center">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Seleccione los documentos a imprimir</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex items-center justify-between p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 hover:border-blue-200 transition-all group">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-50 group-hover:scale-110 transition-transform">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <div class="text-left">
                    <p class="text-xs font-black text-gray-800 uppercase tracking-wider">Historial Clínico</p>
                    <p class="text-[10px] text-gray-400">Resumen completo SOAP</p>
                  </div>
                </div>
                <button (click)="imprimirDocumento('CONSULTA', 'NORMAL')" class="px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition-colors uppercase">Imprimir</button>
              </div>

              <div *ngIf="datosGuardados()?.recetas?.length" class="flex items-center justify-between p-6 bg-green-50/50 rounded-[2.5rem] border border-green-100 hover:border-green-300 transition-all group">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm border border-green-50 group-hover:scale-110 transition-transform">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                  </div>
                  <div class="text-left">
                    <p class="text-xs font-black text-green-800 uppercase tracking-wider">Recetas</p>
                    <p class="text-[10px] text-green-600/60">{{ datosGuardados()?.recetas?.length }} fármaco(s)</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button (click)="imprimirDocumento('RECETA', 'NORMAL')" class="px-3 py-2 bg-white border border-green-200 text-green-700 text-[9px] font-black rounded-xl hover:bg-green-50 transition-colors uppercase">A4</button>
                  <button (click)="imprimirDocumento('RECETA', 'POS')" class="px-3 py-2 bg-green-600 text-white text-[9px] font-black rounded-xl hover:bg-green-700 transition-all uppercase">POS</button>
                </div>
              </div>

              <div *ngIf="datosGuardados()?.solicitudesLab?.length" class="flex items-center justify-between p-6 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 hover:border-indigo-300 transition-all group">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50 group-hover:scale-110 transition-transform">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <div class="text-left">
                    <p class="text-xs font-black text-indigo-800 uppercase tracking-wider">Laboratorio</p>
                    <p class="text-[10px] text-indigo-600/60">{{ datosGuardados()?.solicitudesLab?.length }} órdenes</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button (click)="imprimirDocumento('LABORATORIO', 'NORMAL')" class="px-3 py-2 bg-white border border-indigo-200 text-indigo-700 text-[9px] font-black rounded-xl hover:bg-indigo-50 transition-colors uppercase">A4</button>
                  <button (click)="imprimirDocumento('LABORATORIO', 'POS')" class="px-3 py-2 bg-indigo-600 text-white text-[9px] font-black rounded-xl hover:bg-indigo-700 transition-all uppercase">POS</button>
                </div>
              </div>

              <div *ngIf="datosGuardados()?.solicitudesRad?.length" class="flex items-center justify-between p-6 bg-purple-50/50 rounded-[2.5rem] border border-purple-100 hover:border-purple-300 transition-all group">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-sm border border-purple-50 group-hover:scale-110 transition-transform">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </div>
                  <div class="text-left">
                    <p class="text-xs font-black text-purple-800 uppercase tracking-wider">Radiología</p>
                    <p class="text-[10px] text-purple-600/60">{{ datosGuardados()?.solicitudesRad?.length }} estudios</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button (click)="imprimirDocumento('RADIOLOGIA', 'NORMAL')" class="px-3 py-2 bg-white border border-purple-200 text-purple-700 text-[9px] font-black rounded-xl hover:bg-purple-50 transition-colors uppercase">A4</button>
                  <button (click)="imprimirDocumento('RADIOLOGIA', 'POS')" class="px-3 py-2 bg-purple-600 text-white text-[9px] font-black rounded-xl hover:bg-purple-700 transition-all uppercase">POS</button>
                </div>
              </div>

              <div *ngIf="datosGuardados()?.incapacidades?.length" class="flex items-center justify-between p-6 bg-amber-50/50 rounded-[2.5rem] border border-amber-100 hover:border-amber-300 transition-all group">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-50 group-hover:scale-110 transition-transform">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div class="text-left">
                    <p class="text-xs font-black text-amber-800 uppercase tracking-wider">Incapacidad</p>
                    <p class="text-[10px] text-amber-600/60">Constancia médica</p>
                  </div>
                </div>
                <button (click)="imprimirDocumento('INCAPACIDAD', 'NORMAL')" class="px-4 py-2 bg-amber-600 text-white text-[10px] font-black rounded-xl hover:bg-amber-700 transition-colors uppercase">Imprimir</button>
              </div>

              <div *ngIf="datosGuardados()?.referidos?.length" class="flex items-center justify-between p-6 bg-red-50/50 rounded-[2.5rem] border border-red-100 hover:border-red-300 transition-all group">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm border border-red-50 group-hover:scale-110 transition-transform">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                  </div>
                  <div class="text-left">
                    <p class="text-xs font-black text-red-800 uppercase tracking-wider">Remisión</p>
                    <p class="text-[10px] text-red-600/60">Referencia externa</p>
                  </div>
                </div>
                <button (click)="imprimirDocumento('REMISION', 'NORMAL')" class="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-xl hover:bg-red-700 transition-colors uppercase">Imprimir</button>
              </div>

            </div>
          </div>

          <div class="flex flex-col gap-4">
            <button (click)="finalizarYSalir()" class="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200">
              Finalizar y Volver al Listado
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Layout principal: sidebar izquierdo + formulario derecho -->
    <div class="min-h-screen bg-gray-50 pb-12">
      <div class="flex gap-0 items-start relative" style="min-height:100vh">

        <!-- ════════════════════════════════════
             PANEL LATERAL: HISTORIAL CLÍNICO
        ════════════════════════════════════ -->
        <aside
          class="historial-sidebar sticky top-0 h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 transition-all duration-300"
          [style.width]="panelAbierto() ? '300px' : '48px'"
          style="min-width:0; overflow:hidden;">

          <!-- Cabecera del panel -->
          <div class="flex items-center justify-between px-3 py-4 border-b border-gray-100 flex-shrink-0"
               [class.px-3]="panelAbierto()" [class.px-1]="!panelAbierto()">
            <div *ngIf="panelAbierto()" class="flex items-center gap-2 overflow-hidden">
              <div class="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-gray-800 truncate">Historial del Paciente</p>
                <p class="text-[10px] text-gray-400">
                  <span *ngIf="historialFiltrado().length !== historial().length">{{ historialFiltrado().length }} de </span>
                  {{ historial().length }} consulta(s) previa(s)
                </p>
              </div>
            </div>
            <button (click)="panelAbierto.set(!panelAbierto())"
                    class="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    [title]="panelAbierto() ? 'Cerrar historial' : 'Ver historial'">
              <svg class="w-4 h-4 transition-transform duration-300" [class.rotate-180]="!panelAbierto()"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          </div>

          <!-- Icono vertical cuando está cerrado -->
          <div *ngIf="!panelAbierto()" class="flex flex-col items-center pt-4 gap-2">
            <span class="text-[10px] font-bold text-gray-300 uppercase tracking-widest"
                  style="writing-mode:vertical-rl; letter-spacing:0.15em;">Historial</span>
            <div class="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1"></div>
            <span class="text-[10px] font-bold text-blue-400">{{ historial().length }}</span>
          </div>

          <!-- Lista de consultas previas y controles -->
          <div *ngIf="panelAbierto()" class="flex-1 overflow-y-auto flex flex-col">

            <!-- Buscador y Filtros -->
            <div class="px-3 py-2 border-b border-gray-100 bg-gray-50/50 space-y-2 flex-shrink-0">
              <!-- Campo Búsqueda -->
              <div class="relative">
                <input type="text"
                       [value]="filtroHistorialTexto()"
                       (input)="filtroHistorialTexto.set($any($event.target).value)"
                       placeholder="Buscar diagnóstico, médico..."
                       class="w-full pl-7 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-300" />
                <svg class="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <button *ngIf="filtroHistorialTexto()"
                        (click)="filtroHistorialTexto.set('')"
                        class="absolute right-2 top-2 text-gray-300 hover:text-gray-500">
                  ✕
                </button>
              </div>

              <!-- Filtros en Pills -->
              <div class="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5">
                <button type="button"
                        (click)="filtroTipo.set('TODAS')"
                        [class.bg-blue-600]="filtroTipo() === 'TODAS'"
                        [class.text-white]="filtroTipo() === 'TODAS'"
                        [class.bg-white]="filtroTipo() !== 'TODAS'"
                        [class.text-gray-600]="filtroTipo() !== 'TODAS'"
                        class="px-2 py-0.5 text-[9px] font-bold rounded-full border border-gray-200 shadow-2xs whitespace-nowrap transition-colors">
                  Todas
                </button>
                <button type="button"
                        (click)="filtroTipo.set('PRENATAL')"
                        [class.bg-emerald-600]="filtroTipo() === 'PRENATAL'"
                        [class.text-white]="filtroTipo() === 'PRENATAL'"
                        [class.bg-white]="filtroTipo() !== 'PRENATAL'"
                        [class.text-gray-600]="filtroTipo() !== 'PRENATAL'"
                        class="px-2 py-0.5 text-[9px] font-bold rounded-full border border-gray-200 shadow-2xs whitespace-nowrap transition-colors">
                  Prenatales
                </button>
                <button type="button"
                        (click)="filtroTipo.set('ANIO_ACTUAL')"
                        [class.bg-purple-600]="filtroTipo() === 'ANIO_ACTUAL'"
                        [class.text-white]="filtroTipo() === 'ANIO_ACTUAL'"
                        [class.bg-white]="filtroTipo() !== 'ANIO_ACTUAL'"
                        [class.text-gray-600]="filtroTipo() !== 'ANIO_ACTUAL'"
                        class="px-2 py-0.5 text-[9px] font-bold rounded-full border border-gray-200 shadow-2xs whitespace-nowrap transition-colors">
                  Este Año
                </button>
              </div>

              <!-- Barra de Paginación Rápida Superior -->
              <div *ngIf="historialFiltrado().length > 0"
                   class="pt-1.5 border-t border-gray-200/60 flex items-center justify-between text-xs">
                <button type="button"
                        (click)="cambiarPaginaHistorial(paginaHistorial() - 1)"
                        [disabled]="paginaHistorial() === 1"
                        class="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                  ← Ant.
                </button>

                <span class="text-[10px] font-semibold text-gray-500">
                  Pág. <strong class="text-gray-800">{{ paginaHistorial() }}</strong> de {{ totalPaginasHistorial() }}
                </span>

                <button type="button"
                        (click)="cambiarPaginaHistorial(paginaHistorial() + 1)"
                        [disabled]="paginaHistorial() >= totalPaginasHistorial()"
                        class="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                  Sig. →
                </button>
              </div>
            </div>

            <!-- Cargando -->
            <div *ngIf="cargandoHistorial()" class="px-3 py-6 text-center text-xs text-gray-400">
              <svg class="w-5 h-5 mx-auto mb-2 animate-spin text-blue-300" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Cargando historial...
            </div>

            <!-- Sin historial -->
            <div *ngIf="!cargandoHistorial() && historialFiltrado().length === 0"
                 class="px-3 py-8 text-center">
              <svg class="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-xs text-gray-400 italic">No se encontraron consultas</p>
            </div>

            <!-- Entradas del historial paginadas -->
            <div class="flex-1">
              <div *ngFor="let h of historialPaginado(); let i = index"
                   class="historial-entrada border-b border-gray-50 last:border-0">

                <!-- Fila clickeable -->
                <button type="button"
                        (click)="toggleDetalle(h.id)"
                        class="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors group">
                  <div class="flex items-start gap-2">
                    <div class="flex-shrink-0 mt-0.5">
                      <div class="w-2 h-2 rounded-full"
                           [class.bg-blue-500]="h.id !== detalleAbierto()"
                           [class.bg-blue-700]="h.id === detalleAbierto()"></div>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2 mb-0.5">
                        <p class="text-xs font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                          {{ h.fecha | date:'dd/MM/yyyy':'UTC' }}
                        </p>
                        <span *ngIf="h.controlPrenatal" 
                              class="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-xs border border-emerald-200">
                          Control Prenatal ({{ h.controlPrenatal.semanasGestacion }} sem)
                        </span>
                      </div>
                      <p class="text-[10px] text-gray-400 truncate">
                        {{ h.medico.nombres }} {{ h.medico.apellidos }}
                      </p>
                      <p *ngIf="h.medico.establecimiento" class="text-[9px] text-blue-400 font-medium truncate uppercase tracking-tighter">
                        {{ h.medico.establecimiento.nombre }}
                      </p>
                      <!-- Diagnósticos en miniatura -->
                      <div *ngIf="h.diagnosticos?.length" class="mt-1 flex flex-wrap gap-1">
                        <span *ngFor="let d of h.diagnosticos | slice:0:2"
                              class="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded font-mono">
                          {{ d.codigoCIE10 }}
                        </span>
                        <span *ngIf="h.diagnosticos.length > 2"
                              class="text-[9px] text-gray-400">+{{ h.diagnosticos.length - 2 }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-col items-center gap-2 mt-1">
                    <button type="button"
                            (click)="$event.stopPropagation(); verDetalleCompleto(h)"
                            title="Ver consulta completa"
                            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-xl transition-all shadow-xs hover:shadow-md bg-white border border-blue-50">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    </button>
                  </div>
                </button>

              </div><!-- fin ngFor -->
            </div>

          </div><!-- fin lista de consultas -->
        </aside>

        <!-- ════════════════════════════════════
             ÁREA PRINCIPAL: FORMULARIO
        ════════════════════════════════════ -->
        <main class="flex-1 min-w-0 px-4 py-8 overflow-auto">

          <!-- Encabezado Nueva Consulta -->
          <div class="flex items-center justify-between mb-8 max-w-4xl">
            <div class="flex items-center gap-4">
              <button type="button" (click)="cancelar()" 
                      class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:shadow-md transition-all border border-gray-100 shadow-sm group">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 class="text-2xl font-bold text-gray-900 leading-tight">Nueva Consulta</h1>
                <p class="text-sm text-gray-500" *ngIf="paciente()">
                  Paciente: <span class="font-semibold text-gray-700">{{ paciente().apellidos }}, {{ paciente().nombres }}</span>
                  ({{ paciente()?.sexo?.nombre }} - {{ calcularEdad(paciente()?.fechaNacimiento) }} años)
                </p>
              </div>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-6 max-w-[1300px] mx-auto">

            <!-- 1. Signos Vitales -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                  <h2 class="text-sm font-bold text-gray-700 uppercase tracking-wider">Signos Vitales</h2>
                </div>
                <span *ngIf="triaje()" class="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Pre-cargado desde triaje
                </span>
              </div>
              <div class="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Presión Sistólica</label>
                  <div class="relative">
                    <input type="number" formControlName="presionSistolica" class="w-full px-3 py-2 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg transition-all text-sm"/>
                    <span class="absolute right-3 top-2 text-[10px] text-gray-400">mmHg</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Presión Diastólica</label>
                  <div class="relative">
                    <input type="number" formControlName="presionDiastolica" class="w-full px-3 py-2 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg transition-all text-sm"/>
                    <span class="absolute right-3 top-2 text-[10px] text-gray-400">mmHg</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Frec. Cardíaca</label>
                  <div class="relative">
                    <input type="number" formControlName="frecuenciaCardiaca" class="w-full px-3 py-2 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg transition-all text-sm"/>
                    <span class="absolute right-3 top-2 text-[10px] text-gray-400">lpm</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Temp</label>
                  <div class="relative">
                    <input type="number" formControlName="temperatura" class="w-full px-3 py-2 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg transition-all text-sm"/>
                    <span class="absolute right-3 top-2 text-[10px] text-gray-400">°C</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Peso</label>
                  <div class="relative">
                    <input type="number" formControlName="peso" class="w-full px-3 py-2 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg transition-all text-sm"/>
                    <span class="absolute right-3 top-2 text-[10px] text-gray-400">kg</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Talla</label>
                  <div class="relative">
                    <input type="number" formControlName="talla" class="w-full px-3 py-2 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg transition-all text-sm"/>
                    <span class="absolute right-3 top-2 text-[10px] text-gray-400">cm</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Sat O2</label>
                  <div class="relative">
                    <input type="number" formControlName="saturacionO2" class="w-full px-3 py-2 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg transition-all text-sm"/>
                    <span class="absolute right-3 top-2 text-[10px] text-gray-400">%</span>
                  </div>
                </div>
              </div>

              <!-- Resumen IMC -->
              <div *ngIf="form.get('peso')?.value && form.get('talla')?.value" 
                   class="mt-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-600">
                      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
                    </div>
                    <div>
                      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Peso / Talla</p>
                      <p class="text-sm font-bold text-gray-900">{{ form.get('peso')?.value }} kg · {{ form.get('talla')?.value }} cm</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">IMC</p>
                    <p class="text-xl font-black text-gray-900">{{ imc(form.get('peso')?.value, form.get('talla')?.value) }}</p>
                  </div>
                </div>
                <div *ngIf="getClasificacionIMC(imc(form.get('peso')?.value, form.get('talla')?.value), paciente()?.fechaNacimiento) as cl"
                     [class]="'w-full py-2 rounded-xl text-[10px] font-black uppercase text-center shadow-sm border border-black/5 tracking-widest ' + cl.textColor + ' ' + cl.bgColor">
                  {{ cl.label }}
                </div>
              </div>
            </div>

            <!-- 2. Evolución (SOAP) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div>
                  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">S: Subjetivo <span class="text-red-500">*</span></label>
                  <textarea formControlName="subjetivo" rows="4" placeholder="Motivo de consulta, síntomas reportados por el paciente..."
                            class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl transition-all text-sm outline-none resize-none"></textarea>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">O: Objetivo <span class="text-red-500">*</span></label>
                  <textarea formControlName="objetivo" rows="4" placeholder="Hallazgos físicos, resultados de exámenes inmediatos..."
                            class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl transition-all text-sm outline-none resize-none"></textarea>
                </div>
              </div>
              <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div>
                  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">A: Análisis <span class="text-red-500">*</span></label>
                  <textarea formControlName="analisis" rows="4" placeholder="Juicio clínico, diagnóstico diferencial..."
                            class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl transition-all text-sm outline-none resize-none"></textarea>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">P: Plan <span class="text-red-500">*</span></label>
                  <textarea formControlName="plan" rows="4" placeholder="Tratamiento, órdenes médicas, recomendaciones..."
                            class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl transition-all text-sm outline-none resize-none"></textarea>
                </div>
              </div>
            </div>

            <!-- 3. Diagnósticos -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  <h2 class="text-sm font-bold text-gray-700 uppercase tracking-wider">Impresión Diagnóstica (CIE-10)</h2>
                </div>
                <button type="button" (click)="agregarDiagnostico()" class="text-blue-600 hover:text-blue-700 text-xs font-bold">+ AGREGAR</button>
              </div>
              <div class="p-6 space-y-3" formArrayName="diagnosticos">
                <div *ngFor="let d of diagnosticosArr.controls; let i = index" [formGroupName]="i"
                     class="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">

                  <!-- Fila: código + descripción + tipo + eliminar -->
                  <div class="flex items-end gap-3">

                    <!-- Código CIE-10 -->
                    <div class="w-32 flex-shrink-0">
                      <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Código CIE-10 <span class="text-red-500">*</span></label>
                      <input formControlName="codigoCIE10" type="text"
                             autocomplete="off"
                             placeholder="Ej: J00"
                             (input)="buscarDiag(i, $event, 'codigo')"
                             class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 uppercase placeholder-gray-300"/>
                    </div>

                    <!-- Descripción -->
                    <div class="flex-1">
                      <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Descripción <span class="text-red-500">*</span></label>
                      <input formControlName="descripcion" type="text"
                             autocomplete="off"
                             placeholder="Descripción del diagnóstico…"
                             (input)="buscarDiag(i, $event, 'descripcion')"
                             class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-300"/>
                    </div>

                    <!-- Tipo -->
                    <div class="flex-shrink-0 w-36">
                      <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Tipo</label>
                      <select formControlName="tipo"
                              (change)="cambiarTipo(i, $any($event.target).value)"
                              class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="PRINCIPAL">Principal</option>
                        <option value="SECUNDARIO">Secundario</option>
                      </select>
                    </div>

                    <!-- Eliminar -->
                    <button (click)="removerDiagnostico(i)" type="button"
                            class="flex-shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>

                </div>
                <div *ngIf="diagnosticosArr.length === 0" class="text-center py-6 text-gray-400 text-sm">
                  No hay diagnósticos agregados. Use el botón <strong>+ AGREGAR</strong>.
                </div>
              </div>
            </div>

            <!-- Formulario Dinámico de Especialidad -->
            <div *ngIf="plantilla()" class="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
              <div class="px-6 py-4 bg-purple-50 border-b border-purple-100 flex items-center gap-2">
                <svg class="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <h2 class="text-sm font-bold text-purple-700 uppercase tracking-wider">{{ plantilla().nombre }}</h2>
                <span class="text-xs text-purple-400 font-medium">— {{ plantilla().especialidad?.nombre }}</span>
              </div>
              <div class="p-6 space-y-6">
                <ng-container *ngFor="let sec of plantilla().secciones">
                  <div *ngIf="sec.campos?.length">
                    <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">{{ sec.nombre }}</h3>
                    <div class="grid grid-cols-2 gap-4">
                      <ng-container *ngFor="let campo of sec.campos">
                        <div [class]="getAnchoCampo(campo.ancho)">
                          <ng-container *ngIf="campo.tipo !== 'TITULO'">
                            <label class="block text-xs font-semibold text-gray-600 mb-1">
                              {{ campo.etiqueta }}<span *ngIf="campo.requerido" class="text-red-500 ml-0.5">*</span>
                            </label>
                          </ng-container>
                          <!-- Odontograma (Campo Especial) -->
                          <div *ngIf="campo.tipo === 'ODONTOGRAMA'" class="col-span-full py-4">
                            <div class="flex items-center justify-between mb-4">
                              <label class="block text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] text-center flex-1">{{ campo.etiqueta }}</label>
                              <div *ngIf="registrosProcesados() > 0" class="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 shadow-sm animate-pulse">
                                <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                <span class="text-[9px] font-bold uppercase tracking-widest">Historial Consolidado ({{ registrosProcesados() }} registros)</span>
                              </div>
                            </div>
                            <app-odontograma 
                              [initialData]="respuestaDinamica[campo.clave] ? JSON.parse(respuestaDinamica[campo.clave]) : []"
                              [edadPaciente]="calcularEdad(paciente()?.fechaNacimiento)"
                              (dataChanged)="actualizarDatosOdontograma(campo.clave, $event)">
                            </app-odontograma>

                            <!-- Historial de Hallazgos Previos (Tabla Detalle) -->
                            <div *ngIf="hallazgosCompletos().length > 0" class="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                              <div class="flex items-center gap-3 mb-4">
                                <div class="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                                  <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                  </svg>
                                </div>
                                <h4 class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Resumen de Hallazgos e Intervenciones</h4>
                              </div>

                              <div class="bg-gray-50/50 rounded-[2.5rem] border border-gray-100 overflow-hidden">
                                <div class="overflow-x-auto custom-scrollbar">
                                  <table class="w-full text-left border-collapse">
                                    <thead>
                                      <tr class="border-b border-gray-100">
                                        <th class="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                        <th class="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Pieza</th>
                                        <th class="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Hallazgo / Estado</th>
                                      </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-50">
                                      <tr *ngFor="let h of hallazgosCompletos().slice(0, 15)" class="hover:bg-white transition-colors">
                                        <td class="px-6 py-3">
                                          <div class="flex flex-col">
                                            <span class="text-[11px] font-bold text-gray-500">{{ h.fecha | date:'dd/MM/yyyy':'UTC' }}</span>
                                            <span *ngIf="h.fecha.toDateString() === hoy.toDateString()" class="text-[8px] font-black text-green-500 uppercase tracking-tighter">Realizado Hoy</span>
                                          </div>
                                        </td>
                                        <td class="px-6 py-3">
                                          <span [class]="getColorPieza(h.hallazgo).bg + ' ' + getColorPieza(h.hallazgo).text" 
                                                class="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black transition-transform hover:scale-110">
                                            {{ h.pieza }}
                                          </span>
                                        </td>
                                        <td class="px-6 py-3 text-[11px] text-gray-700 font-medium">{{ h.hallazgo }}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>

                          <input *ngIf="campo.tipo === 'TEXTO'"
                                 type="text" [placeholder]="campo.placeholder || ''"
                                 [(ngModel)]="respuestaDinamica[campo.clave]" [ngModelOptions]="{standalone: true}"
                                 [class.border-red-400]="validandoDinamico() && campo.requerido && !respuestaDinamica[campo.clave]"
                                 [class.bg-red-50]="validandoDinamico() && campo.requerido && !respuestaDinamica[campo.clave]"
                                 class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:bg-white outline-none transition-all"/>
                          <textarea *ngIf="campo.tipo === 'TEXTAREA'"
                                    [placeholder]="campo.placeholder || ''" rows="3"
                                    [(ngModel)]="respuestaDinamica[campo.clave]" [ngModelOptions]="{standalone: true}"
                                    [class.border-red-400]="validandoDinamico() && campo.requerido && !respuestaDinamica[campo.clave]"
                                    [class.bg-red-50]="validandoDinamico() && campo.requerido && !respuestaDinamica[campo.clave]"
                                    class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:bg-white outline-none resize-none transition-all"></textarea>
                          <input *ngIf="campo.tipo === 'NUMERO' || campo.tipo === 'DECIMAL'"
                                 type="number" [placeholder]="campo.placeholder || ''"
                                 [(ngModel)]="respuestaDinamica[campo.clave]" [ngModelOptions]="{standalone: true}"
                                 [class.border-red-400]="validandoDinamico() && campo.requerido && !respuestaDinamica[campo.clave]"
                                 [class.bg-red-50]="validandoDinamico() && campo.requerido && !respuestaDinamica[campo.clave]"
                                 class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:bg-white outline-none transition-all"/>
                          <input *ngIf="campo.tipo === 'FECHA'"
                                 type="date"
                                 [(ngModel)]="respuestaDinamica[campo.clave]" [ngModelOptions]="{standalone: true}"
                                 [class.ring-2]="respuestaDinamica[campo.clave] && !esFechaValida(respuestaDinamica[campo.clave])"
                                 [class.ring-red-500]="respuestaDinamica[campo.clave] && !esFechaValida(respuestaDinamica[campo.clave])"
                                 [class.border-red-400]="validandoDinamico() && campo.requerido && !respuestaDinamica[campo.clave]"
                                 [class.bg-red-50]="validandoDinamico() && campo.requerido && !respuestaDinamica[campo.clave]"
                                 class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:bg-white outline-none transition-all"/>
                          <select *ngIf="campo.tipo === 'SELECT'"
                                  [(ngModel)]="respuestaDinamica[campo.clave]" [ngModelOptions]="{standalone: true}"
                                  [class.border-red-400]="validandoDinamico() && campo.requerido && !respuestaDinamica[campo.clave]"
                                  [class.bg-red-50]="validandoDinamico() && campo.requerido && !respuestaDinamica[campo.clave]"
                                  class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:bg-white outline-none transition-all">
                            <option value="">Seleccione...</option>
                            <option *ngFor="let op of getOpciones(campo)" [value]="op">{{ op }}</option>
                          </select>
                          <div *ngIf="campo.tipo === 'RADIO'" class="flex gap-4 flex-wrap mt-1">
                            <label *ngFor="let op of getOpciones(campo)" class="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="radio"
                                     [(ngModel)]="respuestaDinamica[campo.clave]" [ngModelOptions]="{standalone: true}"
                                     [value]="op" [name]="'radio_' + campo.clave" class="accent-purple-600"/>
                              {{ op }}
                            </label>
                          </div>
                          <label *ngIf="campo.tipo === 'BOOLEANO'" class="flex items-center gap-2 mt-1 cursor-pointer">
                            <input type="checkbox"
                                   [(ngModel)]="respuestaDinamica[campo.clave]" [ngModelOptions]="{standalone: true}"
                                   class="w-4 h-4 rounded accent-purple-600"/>
                            <span class="text-sm text-gray-700">{{ campo.placeholder || 'Sí' }}</span>
                          </label>
                          <div *ngIf="campo.tipo === 'ESCALA'" class="flex items-center gap-3 mt-1">
                            <input type="range"
                                   [(ngModel)]="respuestaDinamica[campo.clave]" [ngModelOptions]="{standalone: true}"
                                   min="0" max="10" step="1" class="flex-1 accent-purple-500"/>
                            <span class="text-sm font-bold text-gray-700 w-5 text-center">{{ respuestaDinamica[campo.clave] ?? 0 }}</span>
                          </div>
                          <p *ngIf="campo.tipo === 'TITULO'" class="text-sm font-bold text-gray-800 border-b border-gray-200 pb-1">{{ campo.etiqueta }}</p>
                          <p *ngIf="campo.ayuda && campo.tipo !== 'TITULO'" class="text-[10px] text-gray-400 mt-1">{{ campo.ayuda }}</p>
                        </div>
                      </ng-container>
                    </div>
                  </div>
                </ng-container>
              </div>
            </div>

            <!-- 4-7. Acciones adicionales -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Órdenes y acciones adicionales</p>
              <div class="flex flex-wrap gap-3">

                <!-- Btn Recetas -->
                <button type="button"
                        (click)="togglePanelRecetas()"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all"
                        [class.border-green-400]="panelRecetas() || recetasArr.length"
                        [class.bg-green-50]="panelRecetas() || recetasArr.length"
                        [class.text-green-700]="panelRecetas() || recetasArr.length"
                        [class.border-gray-200]="!panelRecetas() && !recetasArr.length"
                        [class.text-gray-500]="!panelRecetas() && !recetasArr.length"
                        [class.hover:border-green-300]="!panelRecetas() && !recetasArr.length">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                  </svg>
                  Recetas Médicas
                  <span *ngIf="countRecetasReal > 0"
                        class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-green-500 text-white">
                    {{ countRecetasReal }}
                  </span>
                </button>

                <!-- Btn Laboratorio -->
                <button type="button" (click)="togglePanelLaboratorio()"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all"
                        [class.border-indigo-400]="panelLaboratorio() || laboratorioArr.length"
                        [class.bg-indigo-50]="panelLaboratorio() || laboratorioArr.length"
                        [class.text-indigo-700]="panelLaboratorio() || laboratorioArr.length"
                        [class.border-gray-200]="!panelLaboratorio() && !laboratorioArr.length"
                        [class.text-gray-500]="!panelLaboratorio() && !laboratorioArr.length">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                  </svg>
                  Laboratorio
                  <span *ngIf="laboratorioArr.length"
                        class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white">
                    {{ laboratorioArr.length }}
                  </span>
                </button>

                <!-- Btn Radiología -->
                <button type="button" (click)="togglePanelRadiologia()"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all"
                        [class.border-violet-400]="panelRadiologia() || radiologiaArr.length"
                        [class.bg-violet-50]="panelRadiologia() || radiologiaArr.length"
                        [class.text-violet-700]="panelRadiologia() || radiologiaArr.length"
                        [class.border-gray-200]="!panelRadiologia() && !radiologiaArr.length"
                        [class.text-gray-500]="!panelRadiologia() && !radiologiaArr.length">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  Radiología / Imagen
                  <span *ngIf="radiologiaArr.length"
                        class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-violet-500 text-white">
                    {{ radiologiaArr.length }}
                  </span>
                </button>

                <!-- Btn Incapacidades -->
                <button type="button"
                        (click)="togglePanelIncapacidades()"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all"
                        [class.border-amber-400]="panelIncapacidades() || incapacidadesArr.length"
                        [class.bg-amber-50]="panelIncapacidades() || incapacidadesArr.length"
                        [class.text-amber-700]="panelIncapacidades() || incapacidadesArr.length"
                        [class.border-gray-200]="!panelIncapacidades() && !incapacidadesArr.length"
                        [class.text-gray-500]="!panelIncapacidades() && !incapacidadesArr.length">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Incapacidad
                  <span *ngIf="countIncapacidadesReal > 0"
                        class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                    {{ countIncapacidadesReal }}
                  </span>
                </button>

                <!-- Btn Referencias -->
                <button type="button"
                        (click)="togglePanelReferencias()"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all"
                        [class.border-blue-400]="panelReferencias() || referenciasCreadas().length"
                        [class.bg-blue-50]="panelReferencias() || referenciasCreadas().length"
                        [class.text-blue-700]="panelReferencias() || referenciasCreadas().length"
                        [class.border-gray-200]="!panelReferencias() && !referenciasCreadas().length"
                        [class.text-gray-500]="!panelReferencias() && !referenciasCreadas().length"
                        [class.hover:border-blue-300]="!panelReferencias() && !referenciasCreadas().length">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                  </svg>
                  Remisión / Referencia
                  <span *ngIf="referenciasCreadas().length > 0"
                        class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500 text-white">
                    {{ referenciasCreadas().length }}
                  </span>
                </button>
                
                <!-- Btn Epidemiología -->
                <button type="button" *ngIf="diagNotificable()"
                        (click)="mostrarFichaEpi.set(true); inicializarMapa();"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-400 bg-red-50 text-red-700 font-bold text-sm transition-all animate-pulse no-print">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  Ficha Epidemiológica
                </button>

                <!-- Btn Agendar Próxima Cita -->
                <button type="button" (click)="togglePanelCita()"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all"
                        [class.border-indigo-400]="panelCita() || proximaCitaData()"
                        [class.bg-indigo-50]="panelCita() || proximaCitaData()"
                        [class.text-indigo-700]="panelCita() || proximaCitaData()"
                        [class.border-gray-200]="!panelCita() && !proximaCitaData()"
                        [class.text-gray-500]="!panelCita() && !proximaCitaData()"
                        [class.hover:border-indigo-300]="!panelCita() && !proximaCitaData()">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"/>
                  </svg>
                  Agendar Próxima Cita
                  <span *ngIf="proximaCitaData()"
                        class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white">
                    1
                  </span>
                </button>
              </div>

              <!-- Resumen Cita Agendada -->
              <div *ngIf="panelCita() && proximaCitaData() && proximaCitaResumen()" 
                   class="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Próximo Seguimiento</p>
                    <p class="text-sm font-bold text-gray-800">{{ proximaCitaResumen() }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <button type="button" (click)="abrirModalCita()"
                          class="text-indigo-600 hover:text-indigo-700 text-xs font-black uppercase tracking-wider">
                    Editar Cita
                  </button>
                  <div class="w-px h-4 bg-indigo-200"></div>
                  <button type="button" (click)="removerCita()"
                          class="text-red-500 hover:text-red-700 transition-colors p-1"
                          title="Eliminar Cita">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Panel Recetas (expandible) -->
            <div *ngIf="panelRecetas()" id="seccion-recetas" class="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
              <div class="px-6 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
                <h2 class="text-sm font-bold text-green-700 uppercase tracking-wider">Recetas Médicas</h2>
                <button type="button" (click)="agregarReceta()"
                        class="flex items-center gap-1 text-green-600 hover:text-green-700 text-xs font-bold">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  AGREGAR MEDICAMENTO
                </button>
              </div>
              <div class="p-6 space-y-3" formArrayName="recetas">
                <div *ngFor="let r of recetasArr.controls; let i = index" [formGroupName]="i"
                     class="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div class="flex items-start gap-3">
                    <div class="flex-1">
                      <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Medicamento <span class="text-red-500">*</span></label>
                      <input formControlName="medicamento" type="text" autocomplete="off"
                             placeholder="Buscar medicamento…" (input)="buscarMed(i, $event)"
                             class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 placeholder-gray-300"/>
                    </div>
                    <div class="w-28 flex-shrink-0">
                      <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Dosis <span class="text-red-500">*</span></label>
                      <input formControlName="dosis" type="text" placeholder="500mg"
                             class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 placeholder-gray-300"/>
                    </div>
                    <div class="w-36 flex-shrink-0">
                      <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Frecuencia <span class="text-red-500">*</span></label>
                      <select formControlName="frecuencia"
                              class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400">
                        <option value="">Seleccionar…</option>
                        <option value="Cada 4 horas">Cada 4 horas</option>
                        <option value="Cada 6 horas">Cada 6 horas</option>
                        <option value="Cada 8 horas">Cada 8 horas</option>
                        <option value="Cada 12 horas">Cada 12 horas</option>
                        <option value="Una vez al día">Una vez al día</option>
                        <option value="Según necesidad">Según necesidad</option>
                      </select>
                    </div>
                    <div class="w-24 flex-shrink-0">
                      <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Duración <span class="text-red-500">*</span></label>
                      <div class="relative">
                        <input formControlName="duracion" type="number" min="1" placeholder="0"
                               class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 placeholder-gray-300"/>
                        <span class="absolute right-3 top-2 text-[10px] text-gray-400">días</span>
                      </div>
                    </div>
                    <div class="w-24 flex-shrink-0">
                      <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Cantidad</label>
                      <input formControlName="cantidad" type="number" readonly
                             class="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-green-700 outline-none cursor-default"/>
                    </div>
                    <div class="w-20 flex-shrink-0">
                      <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Stock</label>
                      <input formControlName="stock" type="number" readonly
                             [ngClass]="(r.get('stock')?.value ?? 0) > 0 ? 'text-green-600' : 'text-red-600'"
                             class="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-black outline-none cursor-default"/>
                    </div>
                    <button (click)="removerReceta(i)" type="button"
                            class="flex-shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                  <div class="mt-3">
                    <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Indicaciones adicionales</label>
                    <input formControlName="indicaciones" type="text" placeholder="Tomar con alimentos, no mezclar con alcohol…"
                           class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 placeholder-gray-300"/>
                  </div>
                </div>
                <div *ngIf="recetasArr.length === 0" class="text-center py-4 text-gray-400 text-sm">
                  Sin medicamentos prescritos aún.
                </div>
              </div>
            </div>

            <!-- Resumen Lab (expandible) -->
            <div *ngIf="panelLaboratorio()" id="seccion-laboratorio" class="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
              <div class="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                <h2 class="text-sm font-bold text-indigo-700 uppercase tracking-wider">Órdenes de Laboratorio</h2>
                <button type="button" (click)="modalLab.set(true)"
                        class="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  AGREGAR
                </button>
              </div>
              <div class="p-4 space-y-2">
                <div *ngFor="let control of laboratorioArr.controls; let i = index"
                     class="flex items-center justify-between px-4 py-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                  <div class="flex items-center gap-3">
                    <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-black flex items-center justify-center">{{ i + 1 }}</span>
                    <p class="text-sm font-semibold text-gray-700">{{ control.get('nombre')?.value }}</p>
                  </div>
                  <button (click)="removerExamen(i)" type="button" class="text-gray-300 hover:text-red-500 p-1 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Resumen Radiología (expandible) -->
            <div *ngIf="panelRadiologia()" id="seccion-radiologia" class="bg-white rounded-2xl shadow-sm border border-violet-100 overflow-hidden">
              <div class="px-6 py-3 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
                <h2 class="text-sm font-bold text-violet-700 uppercase tracking-wider">Radiología / Imágenes</h2>
                <button type="button" (click)="modalRad.set(true)"
                        class="text-violet-600 hover:text-violet-700 text-xs font-bold flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  AGREGAR
                </button>
              </div>
              <div class="p-4 space-y-2">
                <div *ngFor="let control of radiologiaArr.controls; let i = index"
                     class="flex items-center justify-between px-4 py-2.5 bg-violet-50/50 border border-violet-100 rounded-xl">
                  <div class="flex items-center gap-3">
                    <span class="w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-[10px] font-black flex items-center justify-center">{{ i + 1 }}</span>
                    <p class="text-sm font-semibold text-gray-700">{{ control.get('nombre')?.value }}</p>
                  </div>
                  <button (click)="removerEstudioRad(i)" type="button" class="text-gray-300 hover:text-red-500 p-1 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Panel Incapacidades (expandible) -->
            <div *ngIf="panelIncapacidades()" id="seccion-incapacidades" class="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
              <div class="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                <h2 class="text-sm font-bold text-amber-700 uppercase tracking-wider">Incapacidades</h2>
                <button type="button" (click)="agregarIncapacidad()"
                        class="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-xs font-bold">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  EMITIR INCAPACIDAD
                </button>
              </div>
              <div class="p-6 space-y-3" formArrayName="incapacidades">
                <div *ngFor="let inc of incapacidadesArr.controls; let i = index" [formGroupName]="i"
                     class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div class="flex items-end gap-3 flex-wrap">
                    <div class="flex-shrink-0">
                      <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Fecha inicio <span class="text-red-500">*</span></label>
                      <input formControlName="fechaInicio" type="date" (change)="calcularFechaFin(i)"
                             class="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400"/>
                    </div>
                    <div class="w-24 flex-shrink-0">
                      <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Días <span class="text-red-500">*</span></label>
                      <input formControlName="dias" type="number" min="1" placeholder="0" (input)="calcularFechaFin(i)"
                             class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400 placeholder-gray-300"/>
                    </div>
                    <div class="flex-shrink-0">
                      <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Fecha fin</label>
                      <input formControlName="fechaFin" type="date" readonly
                             class="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 outline-none cursor-default"/>
                    </div>
                    <div class="w-40 flex-shrink-0">
                      <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Tipo</label>
                      <select formControlName="tipo"
                              class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400">
                        <option value="LABORAL">Laboral</option>
                        <option value="ESCOLAR">Escolar</option>
                        <option value="DEPORTIVA">Deportiva</option>
                      </select>
                    </div>
                    <button (click)="removerIncapacidad(i)" type="button"
                            class="flex-shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                  <div class="mt-3">
                    <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Motivo / Diagnóstico <span class="text-red-500">*</span></label>
                    <input formControlName="motivo" type="text" placeholder="Diagnóstico o motivo de la incapacidad…"
                           class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400 placeholder-gray-300"/>
                  </div>
                </div>
                <div *ngIf="incapacidadesArr.length === 0" class="text-center py-4 text-gray-400 text-sm">
                  Sin incapacidades emitidas aún.
                </div>
              </div>
            </div>

            <!-- ── SECCIÓN DE REFERENCIAS (REUBICADA) ── -->
            <div *ngIf="panelReferencias()" 
                 class="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden animate-in slide-in-from-top-4 duration-300 mt-6">
              <div class="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-sm">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                  </div>
                  <h2 class="text-sm font-black text-blue-700 uppercase tracking-wider">Remisiones / Referencias</h2>
                </div>
                <div class="flex items-center gap-2">
                  <button (click)="modalReferencia.set(true)" type="button" 
                          class="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-100 flex items-center gap-1.5 uppercase">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Nueva Remisión
                  </button>
                  <button (click)="panelReferencias.set(false)" type="button" class="text-blue-300 hover:text-blue-600 transition-colors p-1">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>

              <div class="p-6 space-y-3">
                <div *ngFor="let ref of referenciasCreadas(); let i = index"
                     class="flex items-start justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-200 transition-colors group">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <span *ngIf="ref.urgente" class="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase animate-pulse">Urgente</span>
                      <p class="text-sm font-black text-slate-900 uppercase">A: {{ ref.establecimientoNombre }}</p>
                    </div>
                    <p class="text-xs font-bold text-blue-600 uppercase mb-2">{{ ref.especialidadDestino }}</p>
                    <div class="flex items-start gap-2">
                      <svg class="w-3 h-3 text-slate-300 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                      <p class="text-xs text-slate-500 italic leading-relaxed">{{ ref.motivo }}</p>
                    </div>
                  </div>
                  <button (click)="removerReferencia(i)" type="button" 
                          class="ml-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>

                <div *ngIf="referenciasCreadas().length === 0" 
                     class="py-8 flex flex-col items-center justify-center text-slate-400">
                  <svg class="w-12 h-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                  </svg>
                  <p class="text-xs font-bold uppercase tracking-widest">Sin referencias agregadas</p>
                  <button (click)="modalReferencia.set(true)" type="button" class="mt-4 text-blue-600 text-[10px] font-black uppercase hover:underline">
                    + Agregar ahora
                  </button>
                </div>
              </div>
            </div>

            <!-- Botones de Acción Finales -->
            <div class="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button type="button" (click)="cancelar()"
                      class="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm">
                DESCARTAR
              </button>
              <button type="submit" [disabled]="enviando()"
                      class="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50">
                {{ enviando() ? 'GUARDANDO...' : 'FINALIZAR CONSULTA' }}
              </button>
            </div>
          </form>
        </main>
      </div><!-- fin flex layout -->
    </div>

    <!-- ── Modal Referencias (NUEVO) ── -->
    <div *ngIf="modalReferencia()"
         class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
        <div class="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-black uppercase tracking-tight">Nueva Remisión</h3>
              <p class="text-blue-100 text-xs font-medium opacity-80 mt-1">Complete los datos para la referencia médica</p>
            </div>
            <button (click)="modalReferencia.set(false)" type="button"
                    class="p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="p-8 space-y-6" [formGroup]="referenciaForm">
          <!-- Establecimiento Destino -->
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Establecimiento Destino <span class="text-red-500">*</span></label>
            <select formControlName="establecimientoDestinoId"
                    [class.border-red-500]="referenciaForm.get('establecimientoDestinoId')?.invalid && referenciaForm.get('establecimientoDestinoId')?.touched"
                    class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none appearance-none">
              <option [ngValue]="null">Seleccione establecimiento...</option>
              <option *ngFor="let est of establecimientosList()" [ngValue]="est.id">{{ est.nombre }}</option>
            </select>
            <p *ngIf="referenciaForm.get('establecimientoDestinoId')?.invalid && referenciaForm.get('establecimientoDestinoId')?.touched" 
               class="text-[10px] text-red-500 font-bold mt-1 ml-2">Debe seleccionar un centro de destino</p>
          </div>

          <!-- Especialidad Destino -->
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Especialidad Destino <span class="text-red-500">*</span></label>
            <select formControlName="especialidadDestino"
                    [class.border-red-500]="referenciaForm.get('especialidadDestino')?.invalid && referenciaForm.get('especialidadDestino')?.touched"
                    class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none appearance-none">
              <option value="">Seleccione especialidad...</option>
              <option *ngFor="let esp of especialidadesList()" [value]="esp.nombre">{{ esp.nombre }}</option>
            </select>
            <p *ngIf="referenciaForm.get('especialidadDestino')?.invalid && referenciaForm.get('especialidadDestino')?.touched" 
               class="text-[10px] text-red-500 font-bold mt-1 ml-2">Debe seleccionar la especialidad</p>
          </div>

          <!-- Motivo -->
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Motivo de la Referencia <span class="text-red-500">*</span></label>
            <textarea formControlName="motivo" rows="4"
                      [class.border-red-500]="referenciaForm.get('motivo')?.invalid && referenciaForm.get('motivo')?.touched"
                      placeholder="Describa el motivo clínico de la remisión..."
                      class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none resize-none"></textarea>
            <p *ngIf="referenciaForm.get('motivo')?.invalid && referenciaForm.get('motivo')?.touched" 
               class="text-[10px] text-red-500 font-bold mt-1 ml-2">El motivo clínico es obligatorio</p>
          </div>

          <!-- Urgencia -->
          <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <svg class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-black text-slate-800">Referencia Urgente</p>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Marcar para prioridad alta</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" formControlName="urgente" class="sr-only peer">
              <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>

        <div class="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-3">
          <button (click)="modalReferencia.set(false)" type="button"
                  class="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-100 transition-all">
            Cancelar
          </button>
          <button (click)="agregarReferenciaALista(false)" type="button"
                  [disabled]="referenciaForm.invalid"
                  class="flex-1 px-6 py-4 bg-slate-200 text-slate-800 rounded-2xl font-black uppercase text-xs hover:bg-slate-300 transition-all disabled:opacity-50">
            Agregar y Seguir
          </button>
          <button (click)="agregarReferenciaALista(true)" type="button"
                  [disabled]="referenciaForm.invalid"
                  class="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50">
            Agregar y Finalizar
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal búsqueda Medicamentos ── -->
    <div *ngIf="modalMed()"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
         (click)="modalMed.set(false)">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
           (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 class="font-semibold text-gray-900">Buscar Medicamento</h3>
            <p class="text-xs text-gray-400 mt-0.5">{{ medSugerencias().length }} resultado(s) — clic para seleccionar</p>
          </div>
          <button (click)="modalMed.set(false)" type="button"
                  class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <ul class="overflow-y-auto divide-y divide-gray-50" style="max-height:420px">
          <li *ngFor="let m of medSugerencias()"
              (click)="seleccionarMed(m)"
              class="flex items-start gap-4 px-5 py-3.5 hover:bg-green-50 cursor-pointer transition-colors">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-gray-900">{{ m.nombreGenerico }}</p>
                <span *ngIf="m.nombreComercial" class="text-xs text-gray-400">({{ m.nombreComercial }})</span>
                <span *ngIf="m.esControlado"
                      class="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">CONTROLADO</span>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">{{ m.presentacion }} · {{ m.concentracion }} · {{ m.via }}</p>
              <p class="text-xs text-gray-400">{{ m.grupoTerapeutico }}</p>
            </div>
            <!-- Stock Actual -->
            <div class="text-right flex-shrink-0">
              <div [ngClass]="(m.stock ?? 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                   class="px-3 py-1 rounded-xl border border-white shadow-sm inline-block">
                <p class="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Stock</p>
                <p class="text-lg font-black leading-none">{{ m.stock ?? 0 }}</p>
              </div>
              <p *ngIf="(m.stock ?? 0) <= 0" class="text-[9px] font-bold text-red-500 mt-1 uppercase animate-pulse">Agotado</p>
            </div>
          </li>
          <li *ngIf="!medSugerencias().length"
              class="px-5 py-8 text-center text-sm text-gray-400">
            Sin resultados. Escriba al menos 2 caracteres.
          </li>
        </ul>
      </div>
    </div>

    <!-- ── Modal búsqueda CIE-10 ── -->
    <div *ngIf="modalCIE()"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
         (click)="cerrarModal()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
           (click)="$event.stopPropagation()">

        <!-- Cabecera -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 class="font-semibold text-gray-900">Resultados CIE-10</h3>
            <p class="text-xs text-gray-400 mt-0.5">
              {{ sugerencias()[idxActivo()].length }} resultado(s) — haga clic para seleccionar
            </p>
          </div>
          <button (click)="cerrarModal()" type="button"
                  class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Lista de resultados -->
        <ul class="overflow-y-auto divide-y divide-gray-50" style="max-height:420px">
          <li *ngFor="let s of sugerencias()[idxActivo()]"
              (click)="seleccionar(idxActivo(), s)"
              class="flex items-start gap-4 px-5 py-3.5 hover:bg-blue-50 cursor-pointer transition-colors">
            <span class="font-mono font-bold text-sm text-blue-700 bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg flex-shrink-0 min-w-[60px] text-center mt-0.5">
              {{ s.codigo }}
            </span>
            <div class="min-w-0">
              <p class="text-sm text-gray-800 leading-snug">{{ s.descripcion }}</p>
              <p *ngIf="s.capitulo" class="text-xs text-gray-400 mt-0.5 truncate">{{ s.capitulo }}</p>
            </div>
          </li>
          <li *ngIf="!sugerencias()[idxActivo()]?.length"
              class="px-5 py-8 text-center text-sm text-gray-400">
            Sin resultados. Escriba al menos 2 caracteres.
          </li>
        </ul>

      </div>
    </div>


    <!-- ── Modal búsqueda Laboratorio ── -->
    <div *ngIf="modalLab()"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
         (click)="modalLab.set(false)">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
           (click)="$event.stopPropagation()">
        
        <!-- Header del Modal -->
        <div class="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
          <div>
            <h3 class="text-xl font-bold">Solicitar Exámenes de Laboratorio</h3>
            <p class="text-indigo-100 text-xs mt-1">Marque los exámenes que desea solicitar para el paciente.</p>
          </div>
          <button (click)="modalLab.set(false)" type="button"
                  class="p-2 hover:bg-indigo-500 rounded-xl transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Cuerpo: Lista Categorizada -->
        <div class="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
          
          <!-- Estado vacío -->
          <div *ngIf="labSugerencias().length === 0" class="text-center py-20">
            <div class="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-dashed border-gray-200">
              <svg class="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <p class="text-gray-400 font-medium italic">No hay exámenes configurados para este centro asistencial.</p>
          </div>

          <div *ngFor="let cat of categoriasLab()" class="space-y-5">
            <div class="flex items-center gap-4">
              <h4 class="text-xs font-black text-indigo-500 uppercase tracking-widest whitespace-nowrap">{{ cat }}</h4>
              <div class="h-px bg-gray-100 w-full"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <label *ngFor="let ex of filtrarLabPorCat(cat)"
                     [class.bg-indigo-50]="estaSeleccionado(ex.id)"
                     [class.border-indigo-200]="estaSeleccionado(ex.id)"
                     class="flex items-start gap-3 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-all group relative overflow-hidden">
                
                <!-- Indicador visual de selección -->
                <div *ngIf="estaSeleccionado(ex.id)" class="absolute top-0 right-0 w-8 h-8 bg-indigo-600 text-white rounded-bl-2xl flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>

                <div class="mt-0.5">
                  <input type="checkbox"
                         [checked]="estaSeleccionado(ex.id)"
                         (change)="toggleLab(ex)"
                         class="w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                </div>
                <div class="min-w-0 pr-4">
                  <p class="text-sm font-bold text-gray-700 group-hover:text-indigo-700 transition-colors uppercase leading-tight">{{ ex.nombre }}</p>
                  <p *ngIf="ex.indicaciones" class="text-[10px] text-gray-400 italic mt-1.5 line-clamp-2 leading-relaxed">
                    {{ ex.indicaciones }}
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Footer del Modal -->
        <div class="px-8 py-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div>
              <p class="text-lg font-bold text-gray-800">{{ laboratorioArr.length }} Seleccionados</p>
              <p class="text-xs text-gray-500">Los exámenes se añadirán a la orden de consulta.</p>
            </div>
          </div>
          <button (click)="cerrarModalLab()"
                  class="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-200">
            LISTO
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal búsqueda Radiología ── -->
    <div *ngIf="modalRad()"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
         (click)="modalRad.set(false)">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
           (click)="$event.stopPropagation()">
        
        <div class="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-purple-600 text-white">
          <div>
            <h3 class="text-xl font-bold">Solicitar Estudios Radiológicos</h3>
            <p class="text-purple-100 text-xs mt-1">Marque los estudios que desea solicitar.</p>
          </div>
          <button (click)="modalRad.set(false)" type="button"
                  class="p-2 hover:bg-purple-500 rounded-xl transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
          <div *ngFor="let cat of categoriasRad()" class="space-y-5">
            <div class="flex items-center gap-4">
              <h4 class="text-xs font-black text-purple-500 uppercase tracking-widest whitespace-nowrap">{{ cat }}</h4>
              <div class="h-px bg-gray-100 w-full"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <label *ngFor="let ex of filtrarRadPorCat(cat)"
                     [class.bg-purple-50]="estaSeleccionadoRad(ex.id)"
                     [class.border-purple-200]="estaSeleccionadoRad(ex.id)"
                     class="flex items-start gap-3 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-all group relative overflow-hidden">
                
                <div *ngIf="estaSeleccionadoRad(ex.id)" class="absolute top-0 right-0 w-8 h-8 bg-purple-600 text-white rounded-bl-2xl flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>

                <div class="mt-0.5">
                  <input type="checkbox"
                         [checked]="estaSeleccionadoRad(ex.id)"
                         (change)="toggleRad(ex)"
                         class="w-5 h-5 rounded-lg border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer">
                </div>
                <div class="min-w-0 pr-4">
                  <p class="text-sm font-bold text-gray-700 group-hover:text-purple-700 transition-colors uppercase leading-tight">{{ ex.nombre }}</p>
                  <p *ngIf="ex.indicaciones" class="text-[10px] text-gray-400 italic mt-1.5 line-clamp-2 leading-relaxed">
                    {{ ex.indicaciones }}
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="px-8 py-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-lg font-bold text-gray-800">{{ radiologiaArr.length }} Seleccionados</p>
              <p class="text-xs text-gray-500">Los estudios se añadirán a la orden de consulta.</p>
            </div>
          </div>
          <button (click)="cerrarModalRad()"
                  class="px-10 py-3 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-xl hover:shadow-purple-200">
            LISTO
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal confirmación descartar ── -->
    <div *ngIf="confirmarSalida()"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">¿Descartar cambios?</h3>
            <p class="text-sm text-gray-500 mt-1">Los datos ingresados en esta consulta se perderán.</p>
          </div>
        </div>
        <div class="flex gap-3 justify-end">
          <button (click)="confirmarSalida.set(false)"
                  class="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Seguir editando
          </button>
          <button (click)="descartarConfirmado()"
                  class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
            Sí, descartar
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal confirmación finalizar consulta ── -->
    <div *ngIf="confirmarFinalizacion()"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-200">
        <div class="flex items-start gap-6">
          <div class="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100 shadow-sm">
            <svg class="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-black text-gray-900 leading-tight">¿Finalizar Consulta Médica?</h3>
            <p class="text-sm text-gray-500 mt-2 leading-relaxed">
              Al finalizar esta consulta, el registro de la historia clínica se <span class="font-bold text-amber-600 uppercase tracking-tighter">cerrará permanentemente</span>. 
              Asegúrese de haber completado todos los diagnósticos y recetas, ya que no podrá realizar cambios adicionales.
            </p>
          </div>
        </div>
        <div class="flex gap-4 justify-end pt-2">
          <button (click)="confirmarFinalizacion.set(false)"
                  class="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all">
            REGRESAR
          </button>
          <button (click)="ejecutarGuardado()"
                  [disabled]="enviando()"
                  class="px-8 py-3 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-2xl transition-all shadow-lg shadow-amber-100 disabled:opacity-50 disabled:cursor-wait">
            <span *ngIf="!enviando()">SÍ, FINALIZAR CONSULTA</span>
            <span *ngIf="enviando()" class="flex items-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              GUARDANDO...
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal de Historial (Solo Lectura) ── -->
    <div *ngIf="vistaHistorial() as h"
         class="fixed inset-0 z-[60] flex items-center justify-center bg-transparent p-4 no-print"
         (click)="cerrarVistaHistorial()">
      
      <!-- Backdrop con desenfoque -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-md"></div>

      <!-- Contenedor del Documento -->
      <div id="print-section" class="bg-gray-100 rounded-[3rem] w-full max-w-6xl max-h-[94vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 relative z-10 print-container"
           (click)="$event.stopPropagation()">
        
        <!-- Header del Modal / Barra de Herramientas -->
        <div class="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between no-print flex-shrink-0">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Registro de Consulta</p>
              <h3 class="font-bold text-gray-800 leading-none">Resumen Clínico #{{ h.id }}</h3>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button *ngIf="vistaModo() === 'RESUMEN'" (click)="verPDF()"
                    class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              VER PDF
            </button>
            <div class="w-px h-8 bg-gray-200 mx-1"></div>
            <button (click)="cerrarVistaHistorial()"
                    class="p-2.5 bg-gray-100 text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Contenido del Documento (Scrollable) / O Visor PDF -->
        <div class="flex-1 overflow-hidden flex flex-col relative">
          
          <!-- Vista Resumen (HTML) -->
          <div *ngIf="vistaModo() === 'RESUMEN'" class="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
            
            <!-- Encabezado Institucional (Visible en PDF/Impresión) -->
            <div class="mb-10 border-b-4 border-blue-600 pb-8 px-2 flex justify-between items-end">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <h1 class="text-4xl font-black text-gray-900 tracking-tighter uppercase">SISS <span class="text-blue-600">CLÍNICO</span></h1>
                </div>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1">Expediente Médico Digital Automatizado</p>
              </div>
              <div class="text-right">
                <p class="text-lg font-black text-gray-900 leading-tight uppercase">{{ h.medico.establecimiento?.nombre || 'Establecimiento Médico' }}</p>
                <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">HONDURAS, CENTROAMÉRICA</p>
              </div>
            </div>

            <!-- Banner de Fecha y Médico -->
            <div class="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-blue-100 relative overflow-hidden print-shadow-none print-border">
              <div class="absolute top-0 right-0 p-4 opacity-10 no-print">
                <svg class="w-40 h-40" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              
              <div class="relative z-10 space-y-6">
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <span class="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">Consulta Médica</span>
                    <span class="text-blue-100 text-[10px] font-bold uppercase tracking-widest italic opacity-80">— Finalizada con éxito</span>
                  </div>
                  <h2 class="text-4xl font-black tracking-tight mb-2">
                    {{ h.fecha | date:'EEEE, d MMMM yyyy':'UTC' | uppercase }}
                  </h2>
                  <div class="flex flex-wrap items-center gap-x-8 gap-y-3 text-blue-50 font-medium no-print">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      </div>
                      {{ h.medico.nombres }} {{ h.medico.apellidos }}
                    </div>
                    <div *ngIf="h.medico.establecimiento" class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                      </div>
                      {{ h.medico.establecimiento.nombre }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              <!-- Columna Izquierda: Biometría y Diagnósticos -->
              <div class="space-y-10">
                
                <!-- Signos Vitales -->
                <div class="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 print-shadow-none print-border">
                  <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                    <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Signos Vitales
                  </h3>
                  <div class="grid grid-cols-2 gap-5">
                    <div class="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                      <p class="text-[9px] font-bold text-gray-400 uppercase mb-2">Presión Arterial</p>
                      <p class="text-xl font-black text-gray-900 leading-none">{{ h.presionSistolica ?? '—' }}/{{ h.presionDiastolica ?? '—' }} <span class="text-xs text-gray-400 font-medium">mmHg</span></p>
                    </div>
                    <div class="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                      <p class="text-[9px] font-bold text-gray-400 uppercase mb-2">Frec. Cardíaca</p>
                      <p class="text-xl font-black text-gray-900 leading-none">{{ h.frecuenciaCardiaca ?? '—' }} <span class="text-xs text-gray-400 font-medium">lpm</span></p>
                    </div>
                    <div class="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                      <p class="text-[9px] font-bold text-gray-400 uppercase mb-2">Temperatura</p>
                      <p class="text-xl font-black text-gray-900 leading-none">{{ h.temperatura ?? '—' }} <span class="text-xs text-gray-400 font-medium">°C</span></p>
                    </div>
                    <div class="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                      <p class="text-[9px] font-bold text-gray-400 uppercase mb-2">Saturación O₂</p>
                      <p class="text-xl font-black text-gray-900 leading-none">{{ h.saturacionO2 ?? '—' }} <span class="text-xs text-gray-400 font-medium">%</span></p>
                    </div>
                    <div class="p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 col-span-2 shadow-sm">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Biometría</p>
                        
                        <!-- Valores Principales -->
                        <div class="flex justify-between items-start mb-6">
                          <div>
                            <p class="text-2xl font-black text-gray-800 tracking-tighter">{{ h.peso || '—' }} <span class="text-[10px] text-gray-400 font-bold uppercase ml-0.5">kg</span> &nbsp;·&nbsp; {{ h.talla || '—' }} <span class="text-[10px] text-gray-400 font-bold uppercase ml-0.5">cm</span></p>
                            <p class="text-[9px] text-gray-400 font-black uppercase mt-1 tracking-widest">Peso y Estatura</p>
                          </div>
                          <div class="text-right">
                            <p class="text-3xl font-black text-gray-900 leading-none tracking-tighter">{{ imc(h.peso, h.talla) }}</p>
                            <p class="text-[9px] text-gray-400 font-black uppercase mt-1 tracking-widest">IMC</p>
                          </div>
                        </div>

                        <!-- Clasificación (Al fondo para mayor espacio) -->
                        <div *ngIf="getClasificacionIMC(imc(h.peso, h.talla), h.paciente?.fechaNacimiento) as cl"
                             [class]="'w-full py-2.5 rounded-2xl text-[11px] font-black uppercase shadow-sm border border-black/5 text-center tracking-widest ' + cl.textColor + ' ' + cl.bgColor">
                          {{ cl.label }}
                        </div>
                     </div>
                  </div>
                </div>

                <!-- Diagnósticos -->
                <div class="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 print-shadow-none print-border">
                  <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                    <span class="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    Diagnósticos CIE-10
                  </h3>
                  <div class="space-y-4">
                    <div *ngFor="let d of h.diagnosticos" class="flex items-start gap-4 p-4 bg-indigo-50/30 rounded-3xl border border-indigo-100/50">
                      <span class="flex-shrink-0 font-mono font-black text-indigo-600 bg-white border border-indigo-200 px-2.5 py-1 rounded-xl text-xs shadow-sm">{{ d.codigoCIE10 }}</span>
                      <div class="min-w-0">
                        <p class="text-[13px] font-bold text-gray-800 leading-tight mb-1">{{ d.descripcion }}</p>
                        <span class="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{{ d.tipo }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Columna Central/Derecha: Evolución y Órdenes -->
              <div class="lg:col-span-2 space-y-10">
                
                <!-- Nota Médica SOAP -->
                <div class="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden print-shadow-none print-border">
                  <div class="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      Evolución Médica (SOAP)
                    </h3>
                  </div>
                  <div class="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div class="space-y-2">
                      <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest">S - Subjetivo</p>
                      <p class="text-sm text-gray-700 leading-relaxed pr-4 border-l-2 border-blue-100 pl-4">{{ h.subjetivo }}</p>
                    </div>
                    <div class="space-y-2">
                      <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest">O - Objetivo</p>
                      <p class="text-sm text-gray-700 leading-relaxed pr-4 border-l-2 border-blue-100 pl-4">{{ h.objetivo }}</p>
                    </div>
                    <div class="space-y-2">
                      <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest">A - Análisis</p>
                      <p class="text-sm text-gray-700 leading-relaxed pr-4 border-l-2 border-blue-100 pl-4">{{ h.analisis }}</p>
                    </div>
                    <div class="space-y-2">
                      <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest">P - Plan de Manejo</p>
                      <p class="text-sm text-gray-700 leading-relaxed pr-4 border-l-2 border-blue-100 pl-4">{{ h.plan }}</p>
                    </div>
                  </div>
                </div>
                
                <!-- Información de Especialidad (Dinámico) -->
                <div *ngIf="h.respuestaFormulario" class="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden print-shadow-none print-border">
                  <div class="px-8 py-6 border-b border-gray-100 bg-blue-50/20">
                    <h3 class="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em] flex items-center gap-3">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                      </svg>
                      Información de Especialidad: {{ h.respuestaFormulario.plantilla.nombre }}
                    </h3>
                  </div>
                  <div class="p-10 space-y-8">
                    <div *ngFor="let sec of h.respuestaFormulario.plantilla.secciones" class="space-y-4">
                      <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">{{ sec.nombre }}</h4>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        <div *ngFor="let campo of sec.campos" [class.col-span-full]="campo.tipo === 'ODONTOGRAMA'">
                          <ng-container *ngIf="campo.tipo !== 'TITULO' && campo.tipo !== 'SEPARADOR'">
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{{ campo.etiqueta }}</p>
                            <div [class]="campo.tipo !== 'ODONTOGRAMA' ? 'p-3 bg-gray-50/50 rounded-2xl border' : ''" 
                                 class="text-sm text-gray-800 leading-relaxed border-gray-100/50">
                              <ng-container *ngIf="campo.tipo !== 'ODONTOGRAMA'">
                                {{ formatRespuesta(h.respuestaFormulario.respuestas[campo.clave]) }}
                              </ng-container>
                              <app-odontograma *ngIf="campo.tipo === 'ODONTOGRAMA'"
                                [readonly]="true"
                                [edadPaciente]="calcularEdad(paciente()?.fechaNacimiento)"
                                [initialData]="parseOdontoData(extraerMapaOdonto(h.respuestaFormulario.respuestas, campo.clave))">
                              </app-odontograma>

                               <!-- Tabla de hallazgos para consulta histórica -->
                               <div *ngIf="campo.tipo === 'ODONTOGRAMA' && calcularHistorialHasta(h).length > 0" class="mt-6 border-t border-gray-100 pt-6">
                                 <h5 class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Antecedentes y Hallazgos a esta fecha:</h5>
                                 <div class="bg-gray-50/50 rounded-3xl border border-gray-100 overflow-hidden">
                                   <table class="w-full text-left">
                                     <thead>
                                       <tr class="bg-gray-100/50 border-b border-gray-100">
                                         <th class="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                         <th class="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Pieza</th>
                                         <th class="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Hallazgo</th>
                                       </tr>
                                     </thead>
                                     <tbody class="divide-y divide-gray-100">
                                       <tr *ngFor="let hall of calcularHistorialHasta(h).slice(0, 10)" class="text-[10px]">
                                         <td class="px-4 py-2 text-gray-500 font-bold">{{ hall.fecha | date:'dd/MM/yyyy':'UTC' }}</td>
                                         <td class="px-4 py-2 text-blue-700 font-black">
                                           <span [class]="getColorPieza(hall.hallazgo).bg + ' ' + getColorPieza(hall.hallazgo).text" 
                                                 class="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black">
                                             {{ hall.pieza }}
                                           </span>
                                         </td>
                                         <td class="px-4 py-2 text-gray-600 font-medium">{{ hall.hallazgo }}</td>
                                       </tr>
                                     </tbody>
                                   </table>
                                 </div>
                               </div>
                            </div>
                          </ng-container>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Recetas Médicas -->
                <div *ngIf="h.recetas?.length" class="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden print-shadow-none print-border">
                  <div class="px-8 py-6 border-b border-gray-100 bg-green-50/30">
                    <h3 class="text-[10px] font-black text-green-700 uppercase tracking-[0.2em] flex items-center gap-3">
                       <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                       Tratamiento Farmacológico
                    </h3>
                  </div>
                  <div class="p-8 space-y-5">
                    <div *ngFor="let receta of h.recetas" class="space-y-4">
                      <div *ngFor="let det of receta.detalles" class="flex items-start gap-6 p-6 border border-green-100 bg-green-50/20 rounded-[2rem] hover:bg-green-50/50 transition-colors">
                        <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-green-600 flex-shrink-0 border border-green-100">
                          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                        </div>
                        <div class="flex-1">
                          <p class="text-base font-black text-gray-900 uppercase mb-1">{{ det.medicamento.nombreGenerico }}</p>
                          <div class="flex items-center gap-3 text-xs font-bold text-green-700 uppercase tracking-wider mb-2">
                            <span>{{ det.dosis }}</span>
                            <span class="w-1 h-1 bg-green-300 rounded-full"></span>
                            <span>{{ det.frecuencia }}</span>
                            <span class="w-1 h-1 bg-green-300 rounded-full"></span>
                            <span>{{ det.duracion }} días</span>
                          </div>
                          <p *ngIf="det.indicaciones" class="text-xs text-gray-500 italic p-3 bg-white border border-green-50 rounded-2xl shadow-sm">
                            <span class="font-black text-green-600 not-italic mr-2">INDICACIONES:</span> {{ det.indicaciones }}
                          </p>
                        </div>
                        <div class="text-right flex-shrink-0">
                          <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Cantidad</p>
                          <p class="text-2xl font-black text-gray-900 leading-none">{{ det.cantidad }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Laboratorio y Radiología -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div *ngIf="h.solicitudesLab?.length" class="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden print-shadow-none print-border">
                    <div class="px-6 py-4 border-b border-gray-50 bg-indigo-50/30">
                      <h3 class="text-[10px] font-black text-indigo-700 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span class="w-2 h-2 bg-indigo-500 rounded-full"></span>
                        Laboratorio
                      </h3>
                    </div>
                    <div class="p-6 space-y-3">
                      <div *ngFor="let sol of h.solicitudesLab">
                        <div *ngFor="let det of sol.detalles" class="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-[1.8rem] text-[11px] font-black text-indigo-800 uppercase tracking-widest leading-tight">
                          {{ det.examen.nombre }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div *ngIf="h.solicitudesRad?.length" class="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden print-shadow-none print-border">
                    <div class="px-6 py-4 border-b border-gray-50 bg-purple-50/30">
                      <h3 class="text-[10px] font-black text-purple-700 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
                        Radiología
                      </h3>
                    </div>
                    <div class="p-6 space-y-3">
                      <div *ngFor="let sol of h.solicitudesRad">
                        <div *ngFor="let det of sol.detalles" class="p-4 bg-purple-50/50 border border-purple-100/50 rounded-[1.8rem] text-[11px] font-black text-purple-800 uppercase tracking-widest leading-tight">
                          {{ det.estudio.nombre }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Incapacidades -->
                <div *ngIf="h.incapacidades?.length" class="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden print-shadow-none print-border">
                  <div class="px-8 py-6 border-b border-gray-100 bg-amber-50/30">
                    <h3 class="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em] flex items-center gap-3">
                       <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"/></svg>
                       Incapacidades Autorizadas
                    </h3>
                  </div>
                  <div class="p-8 space-y-5">
                    <div *ngFor="let inc of h.incapacidades" class="flex flex-col md:flex-row md:items-center justify-between p-6 bg-amber-50/40 border border-amber-100 rounded-[2rem] gap-6">
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-3 mb-2">
                           <span class="px-3 py-1 bg-amber-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">{{ inc.tipo }}</span>
                           <h4 class="text-base font-black text-gray-800 leading-none">{{ inc.motivo }}</h4>
                        </div>
                        <p class="text-xs font-bold text-amber-900/60 uppercase tracking-wider">— Vigencia de {{ inc.dias }} días autorizados</p>
                      </div>
                      <div class="flex items-center gap-6 md:border-l-2 md:border-amber-100 md:pl-8">
                        <div class="text-center">
                           <p class="text-[px] font-black text-gray-400 uppercase tracking-widest mb-1 uppercase">Inicio</p>
                           <p class="text-sm font-black text-gray-800">{{ inc.fechaInicio | date:'dd/MM/yyyy':'UTC' }}</p>
                        </div>
                        <div class="w-8 h-px bg-amber-200 hidden md:block"></div>
                        <div class="text-center">
                           <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 uppercase">Finalización</p>
                           <p class="text-sm font-black text-gray-800 text-amber-600">{{ inc.fechaFin | date:'dd/MM/yyyy':'UTC' }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Firma y Sello del Médico (Solo para Impresión/PDF) -->
                <div class="mt-20 pt-10 border-t-2 border-gray-100 flex justify-center text-center">
                  <div class="max-w-xs w-full">
                    <div class="h-16 mb-4 flex items-end justify-center">
                      <!-- Espacio para firma -->
                      <div class="w-48 h-px bg-gray-300"></div>
                    </div>
                    <p class="text-sm font-black text-gray-900 leading-tight uppercase">{{ h.medico.nombres }} {{ h.medico.apellidos }}</p>
                    <p class="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] mt-1">Médico Colegiado: {{ h.medico.numeroColegiado || '—' }}</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- Vista PDF (Visor Profesional V4 - Full Width) -->
          <div *ngIf="vistaModo() === 'PDF' && pdfUrl()" 
               class="flex-1 w-full bg-slate-900 flex flex-col items-center p-0 overflow-auto"
               style="height: 100%; min-height: 800px;">
            <div class="w-full bg-white shadow-2xl flex flex-col" style="min-height: 1120px;">
              <iframe [src]="pdfUrl()" width="100%" height="1120px" style="border: none; flex: 1;" title="Vista Previa PDF"></iframe>
            </div>
          </div>

        </div>
      </div>
    </div>


    <!-- ── Modal Notificación Epidemiológica (Ficha Epidemiológica) ── -->
    <div *ngIf="mostrarFichaEpi()"
         class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
      <div class="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="px-8 py-6 bg-gradient-to-r from-red-600 to-orange-600 text-white flex-shrink-0">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-black uppercase tracking-tight">Ficha Epidemiológica Obligatoria</h3>
                <p class="text-red-100 text-xs font-medium opacity-90 mt-1">Vigilancia Especial: {{ diagNotificable()?.descripcion }}</p>
              </div>
            </div>
            <button (click)="mostrarFichaEpi.set(false)" type="button" class="p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="p-8 space-y-8 overflow-y-auto custom-scrollbar" [formGroup]="notificacionEpiGroup">
          
          <!-- Alerta -->
          <div class="p-5 bg-red-50 rounded-[2rem] border border-red-100 flex items-start gap-4">
            <div class="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p class="text-xs font-bold text-red-800 uppercase tracking-wide">Notificación Requerida por SISS</p>
              <p class="text-[11px] text-red-700 leading-relaxed mt-1">Este diagnóstico requiere el bloqueo epidemiológico inmediato del domicilio. Es vital capturar las coordenadas exactas y antecedentes de viaje.</p>
            </div>
          </div>

          <!-- Georeferenciación -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest">Georeferenciación del Domicilio</h4>
              <div class="flex items-center gap-3">
                <button (click)="repararMapa()" type="button"
                        class="text-[10px] font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 uppercase tracking-tighter">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Reparar Mapa
                </button>
                <button (click)="obtenerUbicacion()" [disabled]="geoCargando()"
                        class="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-tighter disabled:opacity-50">
                  <svg class="w-3.5 h-3.5" [class.animate-spin]="geoCargando()" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  GPS Automático
                </button>
              </div>
            </div>
            
            <!-- Alerta dinámica de coordenadas -->
            <div *ngIf="!paciente()?.latitud" class="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-xl border border-red-100 mb-2 animate-pulse">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <p class="text-[10px] font-bold uppercase tracking-tight">Atención: El paciente no cuenta con georreferenciación previa. Debe registrarla usted en este momento.</p>
            </div>
            
            <div *ngIf="paciente()?.latitud" class="flex items-center gap-2 p-3 bg-green-50 text-green-800 rounded-xl border border-green-100 mb-2">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p class="text-[10px] font-bold uppercase tracking-tight">Ubicación cargada automáticamente desde el expediente del paciente.</p>
            </div>

            <!-- Mapa Interactivo -->
            <div id="map-epi" class="map-container mb-4"></div>
            <p class="text-[9px] text-gray-400 italic">Haga clic en el mapa o arrastre el marcador para ajustar la ubicación exacta de la casa.</p>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Latitud</label>
                <input type="number" formControlName="latitud" step="any"
                       class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-mono text-gray-700 focus:bg-white focus:ring-2 focus:ring-red-200 outline-none transition-all"/>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Longitud</label>
                <input type="number" formControlName="longitud" step="any"
                       class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-mono text-gray-700 focus:bg-white focus:ring-2 focus:ring-red-200 outline-none transition-all"/>
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Dirección Detallada (Puntos de Referencia)</label>
              <textarea formControlName="direccionDetallada" rows="2" placeholder="Ej: Frente a pulpería 'La Bendición', casa color verde..."
                        class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-red-200 outline-none transition-all resize-none"></textarea>
            </div>
          </div>

          <!-- Antecedentes Epidemiológicos -->
          <div class="space-y-4">
            <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest">Datos Clínico-Epidemiológicos</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fecha Inicio Síntomas</label>
                <input type="date" formControlName="fechaInicioSintomas"
                       class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-red-200 outline-none transition-all"/>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Antecedentes de Viaje (Últimos 15 días)</label>
                <select formControlName="antecedentesViaje"
                        class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-red-200 outline-none transition-all">
                  <option value="">No reporta viajes</option>
                  <option value="NACIONAL">Viaje Nacional</option>
                  <option value="INTERNACIONAL">Viaje Internacional</option>
                  <option value="CONTACTO">Contacto con personas de fuera</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lugares Visitados</label>
              <input type="text" formControlName="lugaresVisitados" placeholder="Municipios, Departamentos o Países..."
                     class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-red-200 outline-none transition-all"/>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Observaciones Especiales</label>
              <textarea formControlName="observaciones" rows="2" placeholder="Otras notas relevantes para el equipo de vigilancia..."
                        class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-red-200 outline-none transition-all resize-none"></textarea>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-8 py-6 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <button (click)="mostrarFichaEpi.set(false)" type="button"
                  class="w-full py-4 bg-gray-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-[0.98]">
            VINCULAR FICHA A CONSULTA
          </button>
          <p class="text-[9px] text-gray-400 text-center mt-3 font-bold uppercase tracking-widest">Los datos se guardarán automáticamente al finalizar la consulta médica.</p>
        </div>
      </div>
    </div>

    <!-- ── Modal Medicamento Duplicado ── -->
    <div *ngIf="modalDuplicado()"
         class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-red-100 animate-in fade-in zoom-in duration-300">
        <div class="bg-red-50 p-8 flex flex-col items-center text-center">
          <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h3 class="text-xl font-black text-gray-900 leading-tight mb-2 uppercase tracking-tight">Receta Pendiente Detectada</h3>
          <p class="text-sm font-medium text-red-800 leading-relaxed">
            El paciente ya tiene una receta para <span class="font-black underline">{{ infoDuplicado()?.medicamento }}</span> que no ha sido retirada totalmente de farmacia.
          </p>
        </div>
        
        <div class="p-8 space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cantidad Pendiente</p>
              <p class="text-xl font-black text-gray-900">{{ infoDuplicado()?.cantidadPendiente }}</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Prescrito en</p>
              <p class="text-[11px] font-bold text-gray-800 leading-tight">{{ infoDuplicado()?.establecimiento }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-[10px] font-bold uppercase tracking-wide">Para evitar la duplicidad terapéutica, no se permite agregar este medicamento nuevamente.</p>
          </div>

          <button (click)="entendidoDuplicado()" 
                  class="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-[0.98]">
            ENTENDIDO
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal Agendar Próxima Cita (NUEVO) ── -->
    <div *ngIf="modalCita()"
         class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
        <div class="px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-black uppercase tracking-tight">Agendar Próxima Cita</h3>
              <p class="text-indigo-100 text-xs font-medium opacity-80 mt-1">Programe el seguimiento para este paciente</p>
            </div>
            <button (click)="modalCita.set(false)" type="button"
                    class="p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="p-8 space-y-6" [formGroup]="citaForm">
          <!-- Médico -->
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Médico <span *ngIf="esMedico()" class="text-indigo-500">(Su Agenda)</span></label>
            <select formControlName="medicoId"
                    class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none appearance-none disabled:opacity-70 disabled:cursor-not-allowed">
              <option [ngValue]="null">Seleccione médico...</option>
              <option *ngFor="let med of medicosCentroList()" [ngValue]="med.id">{{ med.nombres }} {{ med.apellidos }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Fecha -->
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fecha</label>
              <input type="date" formControlName="fecha" [min]="minFecha" (change)="sugerirHora()"
                     class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none">
            </div>
            <!-- Hora -->
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Hora</label>
              <input type="time" formControlName="hora"
                     class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none">
            </div>
          </div>

          <!-- Motivo -->
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Motivo de Consulta</label>
            <textarea formControlName="motivo" rows="2"
                      placeholder="Describa el objetivo del seguimiento..."
                      class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none resize-none"></textarea>
          </div>

          <!-- Info Parámetro -->
          <div class="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-[10px] font-bold text-indigo-800 uppercase tracking-wide">
              Margen de seguridad: El sistema requiere al menos {{ minutosEntreConsultas() }} minutos entre consultas para evitar traslapes.
            </p>
          </div>
        </div>

        <div class="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button (click)="modalCita.set(false)" type="button"
                  class="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-100 transition-all">
            Cancelar
          </button>
          <button (click)="agendarCita()" type="button"
                  [disabled]="citaForm.invalid"
                  class="flex-[2] px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50">
            CONFIRMAR AGENDAMIENTO
          </button>
        </div>
      </div>
    </div>


  `
})
export class NuevaConsultaComponent implements OnInit {
  private fb           = inject(FormBuilder);
  private svc          = inject(HistoriaClinicaService);
  private pdfSvc       = inject(ReportePdfService);
  private ps           = inject(PacientesService);
  private router       = inject(Router);
  private notification = inject(NotificationService);
  private diagSvc      = inject(DiagnosticosService);
  private medSvc       = inject(MedicamentosService);
  private labSvc       = inject(LaboratorioService);
  private radSvc       = inject(RadiologiaService);
  private auth         = inject(AuthService);
  private sanitizer    = inject(DomSanitizer);
  private fSvc         = inject(FormulariosService);
  private dispSvc      = inject(DispensacionService);
  private citasSvc     = inject(CitasService);
  private paramSvc     = inject(ParametrosService);
  private geoSvc       = inject(GeoService);

  paciente            = signal<any>(null);
  plantilla             = signal<any>(null);
  respuestaDinamica: Record<string, any> = {};
  JSON = JSON;
  
  private map?: L.Map;
  private mapMarker?: L.Marker;
  validandoDinamico     = signal(false);
  enviando        = signal(false);
  confirmarSalida = signal(false);
  confirmarFinalizacion = signal(false);
  triaje          = signal<any>(null);
  mostrarModalImpresion = signal(false);
  datosGuardados = signal<any>(null);
  
  // PDF Viewer
  pdfUrl    = signal<SafeResourceUrl | null>(null);
  vistaModo = signal<'RESUMEN' | 'PDF'>('RESUMEN');

  // ── Panel lateral de historial ──
  panelAbierto      = signal(true);
  historial         = signal<HistoriaClinica[]>([]);
  cargandoHistorial = signal(false);
  detalleAbierto    = signal<number | null>(null);
  vistaHistorial    = signal<HistoriaClinica | null>(null);
  
  // Filtros y paginación del historial
  filtroHistorialTexto = signal('');
  filtroTipo           = signal<'TODAS' | 'PRENATAL' | 'ANIO_ACTUAL'>('TODAS');
  paginaHistorial      = signal(1);
  elementosPorPagina   = signal(5);

  historialFiltrado = computed(() => {
    const text = this.filtroHistorialTexto().toLowerCase().trim();
    const tipo = this.filtroTipo();
    const currentYear = new Date().getFullYear();

    return this.historial().filter(h => {
      if (tipo === 'PRENATAL' && !h.controlPrenatal) return false;
      if (tipo === 'ANIO_ACTUAL') {
        const fechaAño = new Date(h.fecha).getUTCFullYear();
        if (fechaAño !== currentYear) return false;
      }

      if (text) {
        const enMedico = `${h.medico?.nombres} ${h.medico?.apellidos}`.toLowerCase().includes(text);
        const enLugar  = h.medico?.establecimiento?.nombre?.toLowerCase().includes(text) || false;
        const enDiags  = h.diagnosticos?.some(d => 
          d.codigoCIE10?.toLowerCase().includes(text) || d.descripcion?.toLowerCase().includes(text)
        ) || false;
        const enSubjetivo = h.subjetivo?.toLowerCase().includes(text) || false;

        let enFecha = false;
        if (h.fecha) {
          const d = new Date(h.fecha);
          if (!isNaN(d.getTime())) {
            const day   = String(d.getUTCDate()).padStart(2, '0');
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const year  = String(d.getUTCFullYear());
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const mesNom = meses[d.getUTCMonth()];

            enFecha = `${day}/${month}/${year}`.includes(text) || 
                      `${year}-${month}-${day}`.includes(text) || 
                      `${day}-${month}-${year}`.includes(text) || 
                      `${day} ${mesNom} ${year}`.includes(text);
          }
        }

        return enMedico || enLugar || enDiags || enSubjetivo || enFecha;
      }

      return true;
    });
  });

  totalPaginasHistorial = computed(() => {
    const total = Math.ceil(this.historialFiltrado().length / this.elementosPorPagina());
    return total > 0 ? total : 1;
  });

  historialPaginado = computed(() => {
    const pag = Math.min(this.paginaHistorial(), this.totalPaginasHistorial());
    const inicio = (pag - 1) * this.elementosPorPagina();
    return this.historialFiltrado().slice(inicio, inicio + this.elementosPorPagina());
  });

  cambiarPaginaHistorial(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginasHistorial()) {
      this.paginaHistorial.set(nuevaPagina);
    }
  }

  historialHallazgos = signal<{pieza: number, hallazgo: string, fecha: Date}[]>([]);
  hallazgosHoy = signal<{pieza: number, hallazgo: string, fecha: Date}[]>([]);
  odontogramaInicial = signal<DienteEstado[]>([]);
  registrosProcesados = signal<number>(0);
  hoy = new Date();

  hallazgosCompletos = computed(() => {
    return [...this.hallazgosHoy(), ...this.historialHallazgos()];
  });

  sugerencias = signal<Record<number, CatDiagnostico[]>>({});
  modalCIE    = signal(false);
  idxActivo   = signal(0);
  private cie$ = new Subject<{ idx: number; q: string }>();

  medSugerencias  = signal<Medicamento[]>([]);
  modalMed        = signal(false);
  modalDuplicado = signal(false);
  infoDuplicado = signal<any>(null);

  // Referencias
  modalReferencia = signal(false);
  referenciasSvc  = inject(ReferenciasService);
  estSvc          = inject(EstablecimientosService);
  uSvc            = inject(UsuariosService);
  establecimientosList = signal<any[]>([]);
  especialidadesList   = signal<any[]>([]);

  referenciaForm = this.fb.group({
    establecimientoDestinoId: [null as number | null, [Validators.required]],
    especialidadDestino:      ['', [Validators.required]],
    motivo:                   ['', [Validators.required]],
    urgente:                  [false]
  });

  // Agendamiento de Cita
  modalCita = signal(false);
  citaForm = this.fb.group({
    medicoId: [null as number | null, [Validators.required]],
    especialidadId: [null as number | null, [Validators.required]],
    fecha: [DateUtils.getHoyString(), [Validators.required]],
    hora: ['', [Validators.required]],
    motivo: ['Consulta de Seguimiento', [Validators.required]],
  });
  medicosCentroList = signal<any[]>([]);
  minutosEntreConsultas = signal(20);
  esMedico = signal(false);
  minFecha = DateUtils.getHoyString();

  // Lista local para guardar las referencias creadas en esta sesión antes de enviar la consulta
  referenciasCreadas = signal<any[]>([]);
  proximaCitaId = signal<number | null>(null);
  proximaCitaResumen = signal<string | null>(null);
  proximaCitaData = signal<any | null>(null);

  abrirModalReferencia() {
    this.modalReferencia.set(true);
    this.panelReferencias.set(true);
    if (this.establecimientosList().length === 0) {
      this.estSvc.listarSimplificado().subscribe((list: any[]) => {
        this.establecimientosList.set(list);
      });
    }
    if (this.especialidadesList().length === 0) {
      this.uSvc.listarEspecialidades().subscribe((res: any) => {
        this.especialidadesList.set(res?.data ?? res ?? []);
      });
    }
  }

  agregarReferenciaALista(cerrarModal: boolean = true) {
    if (this.referenciaForm.invalid) {
      this.notification.warn('Por favor complete todos los campos requeridos de la remisión');
      return;
    }

    const formVal = this.referenciaForm.value;
    const targetId = Number(formVal.establecimientoDestinoId);
    const estDestino = this.establecimientosList().find(e => Number(e.id) === targetId);

    this.referenciasCreadas.update(list => [...list, {
      ...formVal,
      establecimientoDestinoId: targetId,
      establecimientoNombre: estDestino?.nombre || 'Centro no identificado'
    }]);

    this.referenciaForm.reset({ 
      establecimientoDestinoId: null,
      especialidadDestino: '',
      motivo: '',
      urgente: false 
    });

    if (cerrarModal) {
      this.modalReferencia.set(false);
    }
    this.notification.success('Remisión agregada exitosamente a la consulta');
  }

  removerReferencia(idx: number) {
    this.referenciasCreadas.update(list => list.filter((_, i) => i !== idx));
  }

  abrirModalCita() {
    this.modalCita.set(true);
    const user = this.auth.obtenerUsuario();
    if (!user) return;

    this.esMedico.set(user.rol === 'MEDICO');

    // Auto-seleccionar y bloquear si el usuario es médico
    if (this.esMedico()) {
      this.citaForm.patchValue({
        medicoId: user.id,
        especialidadId: user.especialidadId
      });
      this.citaForm.get('medicoId')?.disable();
      this.citaForm.get('especialidadId')?.disable();
    } else {
      this.citaForm.get('medicoId')?.enable();
      this.citaForm.get('especialidadId')?.enable();
    }

    // Siempre habilitar fecha y hora para permitir agendar a futuro
    this.citaForm.get('fecha')?.enable();
    this.citaForm.get('hora')?.enable();

    if (this.medicosCentroList().length === 0) {
      this.citasSvc.listarMedicosDelCentro().subscribe(medicos => {
        this.medicosCentroList.set(medicos);
        
        // Si el usuario es médico, ya tiene su ID seteado, sugerimos hora ahora que la lista está lista
        if (this.esMedico()) {
          this.sugerirHora();
        }
      });
    }

    this.paramSvc.obtenerPorClave('MINUTOS_ENTRE_CONSULTAS').subscribe(p => {
      this.minutosEntreConsultas.set(parseInt(p.valor));
    });

    // Sugerir hora inicial
    this.sugerirHora();
  }

  sugerirHora() {
    const medicoId = this.citaForm.get('medicoId')?.value;
    const fecha    = this.citaForm.get('fecha')?.value;

    if (medicoId && fecha) {
      this.citasSvc.obtenerHorarioDisponible(medicoId, fecha).subscribe({
        next: (res: any) => {
          if (res?.siguienteHoraISO) {
            const d = new Date(res.siguienteHoraISO);
            // Usamos UTC para coincidir con el patrón de la base de datos (Hora Local + Z)
            const hh = String(d.getUTCHours()).padStart(2, '0');
            const mm = String(d.getUTCMinutes()).padStart(2, '0');
            this.citaForm.get('hora')?.setValue(`${hh}:${mm}`);
          } else if (res?.horaSugerida) {
            this.citaForm.get('hora')?.setValue(res.horaSugerida);
          } else {
            this.citaForm.get('hora')?.setValue('08:00');
          }
        },
        error: () => {
          this.citaForm.get('hora')?.setValue('08:00');
        }
      });
    }
  }

  agendarCita() {
    if (this.citaForm.invalid) {
      this.notification.warn('Por favor complete todos los campos de la cita');
      return;
    }

    const val = this.citaForm.getRawValue();
    const fechaHoraStr = `${val.fecha}T${val.hora}:00`;
    const isoString = DateUtils.getDateTimeISO(fechaHoraStr);

    const dto = {
      medicoId: val.medicoId,
      especialidadId: val.especialidadId,
      fechaHora: isoString, // Enviamos sin Z para que el servidor lo tome como hora local pura
      tipo: 'CONTROL',
      motivo: val.motivo,
      duracionMinutos: this.minutosEntreConsultas()
    };

    // NO llamar al servicio todavía. Solo guardar localmente.
    this.proximaCitaData.set(dto);
    
    // Crear resumen legible
    if (dto.fechaHora) {
      const f = new Date(dto.fechaHora);
      const resumen = f.toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) + 
                      ' a las ' + f.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
      this.proximaCitaResumen.set(resumen.toUpperCase());
    }

    this.notification.success('Cita preparada para guardar al finalizar consulta');
    this.modalCita.set(false);
    this.citaForm.reset({
      fecha: DateUtils.getHoyString(),
      motivo: 'Consulta de Seguimiento'
    });
  }

  removerCita() {
    this.proximaCitaData.set(null);
    this.proximaCitaResumen.set(null);
    this.notification.info('Cita de seguimiento removida');
  }

  private idxMed  = 0;
  private med$    = new Subject<string>();

  entendidoDuplicado() {
    this.modalDuplicado.set(false);
    // Limpiar el input del medicamento que causó el duplicado
    this.recetasArr.at(this.idxMed).get('medicamento')?.setValue('');
  }

  labSugerencias = signal<ExamenLaboratorio[]>([]);
  categoriasLab  = signal<string[]>([]);
  modalLab       = signal(false);

  estudiosRad    = signal<ExamenRadiologico[]>([]);
  categoriasRad  = signal<string[]>([]);
  modalRad       = signal(false);

  panelRecetas       = signal(false);
  panelIncapacidades = signal(false);
  panelLaboratorio   = signal(false);
  panelRadiologia    = signal(false);
  panelReferencias   = signal(false);
  panelCita          = signal(false);
  
  // Epidemiología
  mostrarFichaEpi      = signal(false);
  diagNotificable      = signal<CatDiagnostico | null>(null);
  geoCargando          = signal(false);

  form = this.fb.group({
    pacienteId: [null as number | null, Validators.required],
    citaId:     [null as number | null],
    plantillaId:[null as number | null],
    subjetivo: ['', Validators.required],
    objetivo: ['', Validators.required],
    analisis: ['', Validators.required],
    plan: ['', Validators.required],
    presionSistolica: [null],
    presionDiastolica: [null],
    frecuenciaCardiaca: [null],
    temperatura: [null],
    peso: [null],
    talla: [null],
    saturacionO2: [null],
    diagnosticos:   this.fb.array([]),
    recetas:        this.fb.array([]),
    incapacidades:  this.fb.array([]),
    laboratorio:    this.fb.array([]),
    radiologia:     this.fb.array([]),
    notificacionEpi: this.fb.group({
      diagnosticoCIE10: [''],
      latitud:           [null as number | null],
      longitud:          [null as number | null],
      direccionDetallada: [''],
      fechaInicioSintomas: [''],
      antecedentesViaje:  [''],
      lugaresVisitados:   [''],
      observaciones:      [''],
    }),
  });

  get diagnosticosArr()   { return this.form.get('diagnosticos')  as FormArray; }
  get recetasArr()        { return this.form.get('recetas')        as FormArray; }
  get incapacidadesArr()  { return this.form.get('incapacidades')  as FormArray; }
  get laboratorioArr()    { return this.form.get('laboratorio')    as FormArray; }
  get radiologiaArr()     { return this.form.get('radiologia')     as FormArray; }
  get notificacionEpiGroup() { return this.form.get('notificacionEpi') as FormGroup; }

  ngOnInit() {
    console.log('[NUEVA-CONSULTA] ngOnInit cargado!');
    console.log('[NUEVA-CONSULTA] history.state:', JSON.stringify(history.state));
    const pid   = history.state?.pacienteId    as number | undefined;
    const cid   = history.state?.citaId        as number | undefined;
    const usuarioActual = this.auth.obtenerUsuario();
    console.log('[NUEVA-CONSULTA] Usuario Actual:', JSON.stringify(usuarioActual));
    const currentEspId = usuarioActual?.especialidadId;
    console.log('[NUEVA-CONSULTA] currentEspId (de token):', currentEspId);
    let espId = (history.state?.especialidadId as number | undefined) || currentEspId;
    console.log('[NUEVA-CONSULTA] espId inicial:', espId);

    console.log('[NUEVA-CONSULTA] tieneRol(ODONTOLOGIA):', this.auth.tieneRol('ODONTOLOGIA'));
    console.log('[NUEVA-CONSULTA] tieneRol(MEDICO_PEDIATRA):', this.auth.tieneRol('MEDICO_PEDIATRA'));

    if (this.auth.tieneRol('ODONTOLOGIA')) {
      espId = 11; // ID de Odontología
      console.log('[NUEVA-CONSULTA] Forzado espId a 11 por rol ODONTOLOGIA');
    } else if (this.auth.tieneRol('MEDICO_PEDIATRA')) {
      espId = 2;  // ID de Pediatría
      console.log('[NUEVA-CONSULTA] Forzado espId a 2 por rol MEDICO_PEDIATRA');
    }

    console.log('[NUEVA-CONSULTA] espId final a cargar:', espId);

    if (!pid) {
      this.router.navigate(['/historia-clinica']);
      return;
    }

    this.form.patchValue({ pacienteId: pid });
    if (cid) this.form.patchValue({ citaId: cid });

    if (espId) {
      this.fSvc.obtenerPlantillaActivaPorEspecialidad(espId).subscribe({
        next: (res: any) => {
          const p = res?.data ?? res;
          this.plantilla.set(p);
          this.form.patchValue({ plantillaId: p.id });
          // Si el historial ya cargó, pre-llenar y consolidar
          if (this.historial().length > 0) {
            this.prellenarDesdeUltimaConsulta(this.historial());
            this.consolidarOdontograma(this.historial());
          }
        },
        error: () => {},
      });
    }

    const t = history.state?.triaje;
    if (t) {
      this.triaje.set(t);
      this.form.patchValue({
        presionSistolica:    t.presionSistolica    ?? null,
        presionDiastolica:   t.presionDiastolica   ?? null,
        frecuenciaCardiaca:  t.frecuenciaCardiaca  ?? null,
        temperatura:         t.temperatura         ?? null,
        peso:                t.peso                ?? null,
        talla:               t.talla               ?? null,
        saturacionO2:        t.saturacionO2        ?? null,
      });
    }

    this.ps.obtenerPerfil(pid).subscribe({
      next: (res: any) => this.paciente.set(res.data ?? res),
      error: ()        => this.router.navigate(['/historia-clinica']),
    });

    // Cargar historial previo del paciente
    this.cargandoHistorial.set(true);
    this.svc.listarPorPaciente(pid).subscribe({
      next: (res: any) => {
        const h = res.data ?? res ?? [];
        this.historial.set(h);
        this.cargandoHistorial.set(false);
        this.prellenarDesdeUltimaConsulta(h);
        this.consolidarOdontograma(h);
      },
      error: () => {
        this.historial.set([]);
        this.cargandoHistorial.set(false);
      },
    });

    this.agregarDiagnostico();

    // Auto-geocodificación por dirección
    this.form.get('notificacionEpi.direccionDetallada')?.valueChanges.pipe(
      debounceTime(1500),
      distinctUntilChanged(),
      switchMap(val => {
        if (!val || val.length < 10) return of(null);
        this.geoCargando.set(true);
        return this.geoSvc.geocodificar(val);
      })
    ).subscribe(res => {
      this.geoCargando.set(false);
      if (res && res.length > 0) {
        const top = res[0];
        this.notificacionEpiGroup.patchValue({
          latitud: parseFloat(top.lat),
          longitud: parseFloat(top.lon)
        } as any);
        this.actualizarMapa(parseFloat(top.lat), parseFloat(top.lon));
        this.notification.info('Ubicación estimada por dirección actualizada');
      }
    });

    this.med$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q.length >= 2 ? this.medSvc.buscar(q) : of([] as Medicamento[])),
    ).subscribe(res => {
      this.medSugerencias.set(res);
      if (res.length) this.modalMed.set(true);
    });

    // Cargar oferta de laboratorios del establecimiento
    const estId = this.auth.obtenerUsuario()?.establecimientoId;
    if (estId) {
      this.labSvc.listarPorEstablecimiento(estId).subscribe({
        next: (data: ExamenLaboratorio[]) => {
          this.labSugerencias.set(data);
          const cats = [...new Set(data.map(ex => ex.categoria))].sort();
          this.categoriasLab.set(cats);
        },
        error: (err: any) => console.error('Error al cargar laboratorios del centro', err)
      });

      this.radSvc.listarPorEstablecimiento(estId).subscribe({
        next: (data: ExamenRadiologico[]) => {
          this.estudiosRad.set(data);
          const cats = [...new Set(data.map(ex => ex.categoria))].sort();
          this.categoriasRad.set(cats);
        },
        error: (err: any) => console.error('Error al cargar radiología del centro', err)
      });
    }

    this.cie$.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => a.idx === b.idx && a.q === b.q),
      switchMap(({ idx, q }) =>
        q.length >= 2
          ? this.diagSvc.buscar(q).pipe(switchMap(res => of({ idx, res })))
          : of({ idx, res: [] as CatDiagnostico[] })
      ),
    ).subscribe(({ idx, res }) => {
      this.sugerencias.update(m => ({ ...m, [idx]: res }));
      if (res.length) this.modalCIE.set(true);
    });

    // Escuchar cambios en fecha y médico para sugerir hora (agendamiento)
    this.citaForm.get('fecha')?.valueChanges.subscribe(() => this.sugerirHora());
    this.citaForm.get('medicoId')?.valueChanges.subscribe(mid => {
      if (mid) {
        // Auto-seleccionar especialidad del médico
        const med = this.medicosCentroList().find(m => m.id === mid);
        if (med && med.especialidadId) {
          this.citaForm.get('especialidadId')?.setValue(med.especialidadId);
        }
      }
      this.sugerirHora();
    });
  }

  filtrarLabPorCat(cat: string) {
    return this.labSugerencias().filter(ex => ex.categoria === cat);
  }

  estaSeleccionado(id: number): boolean {
    return this.laboratorioArr.controls.some(ctrl => ctrl.get('examenId')?.value === id);
  }

  toggleLab(ex: ExamenLaboratorio) {
    const idx = this.laboratorioArr.controls.findIndex(ctrl => ctrl.get('examenId')?.value === ex.id);
    if (idx >= 0) {
      this.laboratorioArr.removeAt(idx);
    } else {
      this.laboratorioArr.push(this.fb.group({
        examenId: [ex.id],
        nombre: [ex.nombre],
        indicaciones: [ex.indicaciones]
      }));
    }
  }

  removerExamen(i: number) {
    this.laboratorioArr.removeAt(i);
  }

  // ── Radiología ─────────────────────────────────────────────────────────────
  toggleRad(ex: ExamenRadiologico) {
    const idx = this.radiologiaArr.controls.findIndex(ctrl => ctrl.get('estudioId')?.value === ex.id);
    if (idx >= 0) {
      this.radiologiaArr.removeAt(idx);
    } else {
      this.radiologiaArr.push(this.fb.group({
        estudioId: [ex.id],
        nombre:    [ex.nombre],
        indicaciones: [ex.indicaciones]
      }));
    }
  }

  removerEstudioRad(i: number) {
    this.radiologiaArr.removeAt(i);
  }

  estaSeleccionadoRad(id: number): boolean {
    return this.radiologiaArr.controls.some(ctrl => ctrl.get('estudioId')?.value === id);
  }

  filtrarRadPorCat(cat: string) {
    return this.estudiosRad().filter(ex => ex.categoria === cat);
  }

  toggleDetalle(id: number) {
    this.detalleAbierto.set(this.detalleAbierto() === id ? null : id);
  }

  verDetalleCompleto(h: HistoriaClinica) {
    this.cargandoHistorial.set(true);
    this.svc.obtenerDetalle(h.id).subscribe({
      next: (res: any) => {
        this.vistaHistorial.set(res.data ?? res);
        this.cargandoHistorial.set(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => {
        this.notification.error('No se pudo cargar el detalle de la consulta');
        this.cargandoHistorial.set(false);
      }
    });
  }

  cerrarVistaHistorial() {
    this.vistaHistorial.set(null);
    this.cerrarVistaPdf();
  }

  imprimir() {
    window.print();
  }

  scrollASeccion(id: string) {
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  togglePanelRecetas() {
    const abrir = !this.panelRecetas();
    if (abrir) {
      this.panelIncapacidades.set(false);
      this.panelLaboratorio.set(false);
      this.panelRadiologia.set(false);
      this.panelReferencias.set(false);
      this.limpiarIncapacidadesVacias();
      if (this.recetasArr.length === 0) this.agregarReceta();
      this.scrollASeccion('seccion-recetas');
    } else {
      this.limpiarRecetasVacias();
    }
    this.panelRecetas.set(abrir);
  }

  togglePanelIncapacidades() {
    const abrir = !this.panelIncapacidades();
    if (abrir) {
      this.panelRecetas.set(false);
      this.panelLaboratorio.set(false);
      this.panelRadiologia.set(false);
      this.panelReferencias.set(false);
      this.limpiarRecetasVacias();
      if (this.incapacidadesArr.length === 0) this.agregarIncapacidad();
      this.scrollASeccion('seccion-incapacidades');
    } else {
      this.limpiarIncapacidadesVacias();
    }
    this.panelIncapacidades.set(abrir);
  }

  togglePanelLaboratorio() {
    const abrir = !this.panelLaboratorio();
    if (abrir) {
      this.panelRecetas.set(false);
      this.panelIncapacidades.set(false);
      this.panelRadiologia.set(false);
      this.panelReferencias.set(false);
      this.limpiarRecetasVacias();
      this.limpiarIncapacidadesVacias();
      this.scrollASeccion('seccion-laboratorio');
      if (this.laboratorioArr.length === 0) {
        this.modalLab.set(true);
      }
    }
    this.panelLaboratorio.set(abrir);
  }

  togglePanelRadiologia() {
    const abrir = !this.panelRadiologia();
    if (abrir) {
      this.panelRecetas.set(false);
      this.panelIncapacidades.set(false);
      this.panelLaboratorio.set(false);
      this.panelReferencias.set(false);
      this.limpiarRecetasVacias();
      this.limpiarIncapacidadesVacias();
      this.scrollASeccion('seccion-radiologia');
      if (this.radiologiaArr.length === 0) {
        this.modalRad.set(true);
      }
    }
    this.panelRadiologia.set(abrir);
  }

  togglePanelReferencias() {
    const abrir = !this.panelReferencias();
    if (abrir) {
      this.panelRecetas.set(false);
      this.panelIncapacidades.set(false);
      this.panelLaboratorio.set(false);
      this.panelRadiologia.set(false);
      this.panelCita.set(false);
      this.limpiarRecetasVacias();
      this.limpiarIncapacidadesVacias();
      
      // Si no hay referencias, abrir el modal automáticamente
      if (this.referenciasCreadas().length === 0) {
        this.abrirModalReferencia();
      }
    }
    this.panelReferencias.set(abrir);
  }

  togglePanelCita() {
    const abrir = !this.panelCita();
    if (abrir) {
      this.panelRecetas.set(false);
      this.panelIncapacidades.set(false);
      this.panelLaboratorio.set(false);
      this.panelRadiologia.set(false);
      this.panelReferencias.set(false);
      this.limpiarRecetasVacias();
      this.limpiarIncapacidadesVacias();

      if (!this.proximaCitaData()) {
        this.abrirModalCita();
      }
    }
    this.panelCita.set(abrir);
  }

  cerrarModalLab() {
    this.modalLab.set(false);
    this.panelLaboratorio.set(true);
    if (this.laboratorioArr.length > 0) {
      this.scrollASeccion('seccion-laboratorio');
    }
  }

  cerrarModalRad() {
    this.modalRad.set(false);
    this.panelRadiologia.set(true);
    if (this.radiologiaArr.length > 0) {
      this.scrollASeccion('seccion-radiologia');
    }
  }

  limpiarRecetasVacias() {
    for (let i = this.recetasArr.length - 1; i >= 0; i--) {
      const v = this.recetasArr.at(i).value;
      if (!v.medicamento?.trim() && !v.medicamentoId && !v.indicaciones?.trim()) {
        this.recetasArr.removeAt(i);
      }
    }
  }

  limpiarIncapacidadesVacias() {
    for (let i = this.incapacidadesArr.length - 1; i >= 0; i--) {
      const v = this.incapacidadesArr.at(i).value;
      if (!v.motivo?.trim() && !v.fechaInicio && !v.dias) {
        this.incapacidadesArr.removeAt(i);
      }
    }
  }

  get countRecetasReal(): number {
    return this.recetasArr.controls.filter(c => c.get('medicamento')?.value?.trim()).length;
  }

  get countIncapacidadesReal(): number {
    return this.incapacidadesArr.controls.filter(c => c.get('motivo')?.value?.trim() || c.get('fechaInicio')?.value).length;
  }

  imc(peso?: number | null, talla?: number | null): string {
    if (!peso || !talla) return '—';
    return (peso / Math.pow(talla / 100, 2)).toFixed(1);
  }

  private readonly labels: Record<string, string> = {
    subjetivo: 'Subjetivo (S)',
    objetivo: 'Objetivo (O)',
    analisis: 'Análisis (A)',
    plan: 'Plan (P)',
  };

  actualizarDatosOdontograma(clave: string, data: DienteEstado[]) {
    this.respuestaDinamica[clave] = JSON.stringify(data);
    this.respuestaDinamica = { ...this.respuestaDinamica };
    
    // Calcular hallazgos realizados HOY comparando con el estado inicial consolidado
    // Siguiendo la REGLA DE ORO: Guardar hora local como si fuera UTC literal
    const inicial = this.odontogramaInicial();
    const hoy: {pieza: number, hallazgo: string, fecha: Date}[] = [];
    
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const fechaHoyLiteral = new Date(base + 'Z');

    if (inicial.length > 0) {
      data.forEach((d: DienteEstado) => {
        const dIni = inicial.find(t => t.id === d.id);
        if (dIni) {
          // Comparar caras
          (Object.keys(d.caras) as (keyof DienteEstado['caras'])[]).forEach(cara => {
            const estAct = d.caras[cara].estado;
            const estIni = dIni.caras[cara].estado;
            if (estAct !== estIni && estAct !== 'NORMAL') {
              const label = estAct === 'CARIES' ? 'Caries' : (estAct === 'OBTURADO' ? 'Obturación' : 'Restauración');
              hoy.push({ pieza: d.id, hallazgo: `${label} (${cara})`, fecha: fechaHoyLiteral });
            }
          });
          // Comparar estados generales
          if (d.ausente && !dIni.ausente) hoy.push({ pieza: d.id, hallazgo: 'Pieza Ausente', fecha: fechaHoyLiteral });
          if (d.corona && !dIni.corona) hoy.push({ pieza: d.id, hallazgo: 'Corona colocada', fecha: fechaHoyLiteral });
          if (d.implante && !dIni.implante) hoy.push({ pieza: d.id, hallazgo: 'Implante colocado', fecha: fechaHoyLiteral });
          if (d.brakets && !dIni.brakets) hoy.push({ pieza: d.id, hallazgo: 'Brackets colocados', fecha: fechaHoyLiteral });
        }
      });
    }
    this.hallazgosHoy.set(hoy);
  }

  consolidarOdontograma(historial: HistoriaClinica[]) {
    if (!historial || historial.length === 0) return;

    // 1. Identificar la clave del campo de odontograma en la plantilla actual
    const p = this.plantilla();
    let claveOdonto = 'odontograma_map'; // Valor por defecto
    if (p) {
      for (const sec of p.secciones) {
        const campo = sec.campos.find((c: any) => c.tipo === 'ODONTOGRAMA');
        if (campo) {
          claveOdonto = campo.clave;
          break;
        }
      }
    }

    // 2. Ordenar historial por fecha ascendente
    const ordenado = [...historial].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    let odontogramaConsolidado: DienteEstado[] = [];
    const hallazgos: {pieza: number, hallazgo: string, fecha: Date}[] = [];

    ordenado.forEach(h => {
      let respuestas = h.respuestaFormulario?.respuestas || {};
      // Si respuestas es un string (sucede a veces según el ORM), intentar parsear
      if (typeof respuestas === 'string') {
        try { respuestas = JSON.parse(respuestas); } catch(e) { respuestas = {}; }
      }

      const resp = this.extraerMapaOdonto(respuestas, claveOdonto);
      
      if (resp) {
        this.registrosProcesados.update(n => n + 1);
        try {
          const dataSesion: DienteEstado[] = typeof resp === 'string' ? JSON.parse(resp) : resp;
          
          // Inicializar con un estado base si está vacío
          if (odontogramaConsolidado.length === 0) {
            // Creamos un odontograma base de 32 dientes NORMAL
            const base: DienteEstado[] = [];
            const ids = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28,48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
            ids.forEach(id => {
              base.push({
                id,
                caras: {
                  superior: { estado: 'NORMAL' }, inferior: { estado: 'NORMAL' },
                  izquierda: { estado: 'NORMAL' }, derecha: { estado: 'NORMAL' }, centro: { estado: 'NORMAL' }
                },
                ausente: false, protesis: false, corona: false, implante: false, brakets: false
              });
            });
            odontogramaConsolidado = base;
          }

          // Consolidar y registrar hallazgos (para todos los registros)
          dataSesion.forEach(dSesion => {
            const idx = odontogramaConsolidado.findIndex(d => d.id === dSesion.id);
            if (idx !== -1) {
              const dCons = odontogramaConsolidado[idx];
              
              // Caras
              (Object.keys(dSesion.caras) as (keyof DienteEstado['caras'])[]).forEach(cara => {
                const estSesion = dSesion.caras[cara].estado;
                const estAnterior = dCons.caras[cara].estado;
                
                // Solo registrar si es un hallazgo nuevo o cambio respecto al estado consolidado previo
                if (estSesion !== 'NORMAL' && estSesion !== estAnterior) {
                  const label = estSesion === 'CARIES' ? 'Caries' : (estSesion === 'OBTURADO' ? 'Obturación' : 'Restauración');
                  hallazgos.push({ pieza: dSesion.id, hallazgo: `${label} (${cara})`, fecha: new Date(h.fecha) });
                }
                
                // Actualizar consolidado (siempre el último estado gana)
                dCons.caras[cara].estado = estSesion;
              });

              // Estados generales (Solo registrar si cambian de false a true en esta sesión)
              if (dSesion.ausente && !dCons.ausente) {
                dCons.ausente = true;
                hallazgos.push({ pieza: dSesion.id, hallazgo: 'Pieza Ausente', fecha: new Date(h.fecha) });
              }
              if (dSesion.corona && !dCons.corona) {
                dCons.corona = true;
                hallazgos.push({ pieza: dSesion.id, hallazgo: 'Corona', fecha: new Date(h.fecha) });
              }
              if (dSesion.implante && !dCons.implante) {
                dCons.implante = true;
                hallazgos.push({ pieza: dSesion.id, hallazgo: 'Implante', fecha: new Date(h.fecha) });
              }
              if (dSesion.brakets && !dCons.brakets) {
                dCons.brakets = true;
                hallazgos.push({ pieza: dSesion.id, hallazgo: 'Brackets', fecha: new Date(h.fecha) });
              }
            }
          });
        } catch (e) {
          console.error('Error parseando odontograma histórico', e);
        }
      }
    });

    if (odontogramaConsolidado.length > 0) {
      this.respuestaDinamica[claveOdonto] = JSON.stringify(odontogramaConsolidado);
      // Guardar copia del estado inicial para detectar cambios hoy
      this.odontogramaInicial.set(JSON.parse(JSON.stringify(odontogramaConsolidado)));
      
      // Forzar actualización de la referencia para que Angular detecte el cambio en el input
      this.respuestaDinamica = { ...this.respuestaDinamica };
      
      // Ordenar hallazgos por fecha descendente (más reciente primero) para la tabla
      this.historialHallazgos.set(hallazgos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()));
    } else {
      // Si no hay historia, el inicial es un odontograma limpio (esto debería venir de una función)
      // Por ahora, si no hay historia, no hay odontogramaConsolidado
    }
  }

  /**
   * Re-calcula la línea del tiempo dental hasta una consulta específica.
   * Útil para mostrar el estado histórico en resúmenes pasados.
   */
  calcularHistorialHasta(h: HistoriaClinica): {pieza: number, hallazgo: string, fecha: Date}[] {
    const todos = this.historial();
    if (!todos || todos.length === 0) return [];
    
    // Filtrar consultas iguales o anteriores a la fecha de h
    const fechaLimite = h.fecha ? new Date(h.fecha).getTime() : 0;
    const previas = todos.filter(t => t.fecha && new Date(t.fecha).getTime() <= fechaLimite);
    
    // Realizar una mini-consolidación para obtener los hallazgos en ese punto del tiempo
    const ordenado = [...previas].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    let odontogramaConsolidado: DienteEstado[] = [];
    const hallazgos: {pieza: number, hallazgo: string, fecha: Date}[] = [];

    ordenado.forEach(sess => {
      let respuestas = sess.respuestaFormulario?.respuestas || {};
      if (typeof respuestas === 'string') { try { respuestas = JSON.parse(respuestas); } catch(e) {} }
      const resp = this.extraerMapaOdonto(respuestas, 'odontograma_map');
      if (resp) {
        try {
          const dataSesion: DienteEstado[] = typeof resp === 'string' ? JSON.parse(resp) : resp;
          
          if (odontogramaConsolidado.length === 0) {
            // Inicializar con base NORMAL de 32 dientes
            const ids = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28,48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
            odontogramaConsolidado = ids.map(id => ({
              id,
              caras: { superior: {estado:'NORMAL'}, inferior:{estado:'NORMAL'}, izquierda:{estado:'NORMAL'}, derecha:{estado:'NORMAL'}, centro:{estado:'NORMAL'} },
              ausente:false, protesis:false, corona:false, implante:false, brakets:false
            }));
          }

          dataSesion.forEach(dSesion => {
            const dCons = odontogramaConsolidado.find(d => d.id === dSesion.id);
            if (dCons) {
              (Object.keys(dSesion.caras) as (keyof DienteEstado['caras'])[]).forEach(cara => {
                const estSesion = dSesion.caras[cara].estado;
                const estAnterior = dCons.caras[cara].estado;
                if (estSesion !== 'NORMAL' && estSesion !== estAnterior) {
                  const label = estSesion === 'CARIES' ? 'Caries' : (estSesion === 'OBTURADO' ? 'Obturación' : 'Restauración');
                  hallazgos.push({ pieza: dSesion.id, hallazgo: `${label} (${cara})`, fecha: new Date(sess.fecha) });
                }
                dCons.caras[cara].estado = estSesion;
              });
              if (dSesion.ausente && !dCons.ausente) { dCons.ausente = true; hallazgos.push({ pieza: dSesion.id, hallazgo: 'Pieza Ausente', fecha: new Date(sess.fecha) }); }
              if (dSesion.corona && !dCons.corona) { dCons.corona = true; hallazgos.push({ pieza: dSesion.id, hallazgo: 'Corona', fecha: new Date(sess.fecha) }); }
              if (dSesion.implante && !dCons.implante) { dCons.implante = true; hallazgos.push({ pieza: dSesion.id, hallazgo: 'Implante', fecha: new Date(sess.fecha) }); }
              if (dSesion.brakets && !dCons.brakets) { dCons.brakets = true; hallazgos.push({ pieza: dSesion.id, hallazgo: 'Brackets', fecha: new Date(sess.fecha) }); }
            }
          });
        } catch(e) {}
      }
    });

    return hallazgos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  /**
   * Extrae los datos del odontograma de un objeto de respuestas,
   * intentando primero con la clave sugerida y luego buscando patrones conocidos.
   */
  extraerMapaOdonto(respuestas: any, claveSugerida: string): any {
    if (!respuestas) return null;
    
    // Si respuestas es un string, parsear primero
    let obj = respuestas;
    if (typeof respuestas === 'string') {
      try { obj = JSON.parse(respuestas); } catch(e) { return null; }
    }
    
    // 1. Intentar con la clave sugerida
    if (obj[claveSugerida]) return obj[claveSugerida];
    
    // 2. Buscar cualquier clave que parezca un odontograma
    for (const k in obj) {
      const val = obj[k];
      if (!val) continue;

      let testVal = val;
      // Si es string, intentar parsear para ver si es un array de dientes
      if (typeof val === 'string' && (val.includes('"caras"') || val.includes('"id"'))) {
        try { testVal = JSON.parse(val); } catch(e) {}
      }
      
      // Si ya es un objeto/array, verificar estructura
      if (Array.isArray(testVal) && testVal.length > 0) {
        if (testVal[0].caras || testVal[0].id !== undefined) {
          return val; // Retornamos el valor original para que el llamador lo procese
        }
      }
    }
    return null;
  }

  parseOdontoData(data: any): DienteEstado[] {
    if (!data) return [];
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      return [];
    }
  }

  formatRespuesta(valor: any): string {
    if (valor === true || valor === 'true') return 'Sí';
    if (valor === false || valor === 'false') return 'No';
    if (valor === undefined || valor === null || valor === '') return '—';
    return String(valor);
  }

  getColorPieza(hallazgo: string): { bg: string, text: string } {
    const h = hallazgo.toLowerCase();
    if (h.includes('caries')) return { bg: 'bg-red-100', text: 'text-red-700' };
    if (h.includes('obturación') || h.includes('restauración')) return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    if (h.includes('ausente')) return { bg: 'bg-gray-100', text: 'text-gray-700' };
    if (h.includes('corona')) return { bg: 'bg-orange-100', text: 'text-orange-700' };
    if (h.includes('implante')) return { bg: 'bg-slate-200', text: 'text-slate-700' };
    if (h.includes('brackets')) return { bg: 'bg-indigo-100', text: 'text-indigo-700' };
    return { bg: 'bg-blue-100', text: 'text-blue-700' };
  }

  /**
   * Pre-llena el formulario dinámico con los valores de la última consulta realizada que contenga un formulario.
   */
  prellenarDesdeUltimaConsulta(historial: HistoriaClinica[]) {
    if (!historial || historial.length === 0) return;

    // Buscar la consulta más reciente que TENGA respuestas en su formulario
    // (Ignoramos consultas que no usaron formularios dinámicos)
    const ultimaConRespuestas = [...historial]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .find(h => {
        const r = h.respuestaFormulario?.respuestas;
        if (!r) return false;
        // Si es un string, verificar que no sea un objeto vacío "{}"
        if (typeof r === 'string') return r.length > 2;
        // Si es objeto, verificar que tenga claves
        return Object.keys(r).length > 0;
      });
    
    if (ultimaConRespuestas && ultimaConRespuestas.respuestaFormulario?.respuestas) {
      let respuestas = ultimaConRespuestas.respuestaFormulario.respuestas;
      if (typeof respuestas === 'string') {
        try { respuestas = JSON.parse(respuestas); } catch(e) { respuestas = {}; }
      }

      console.log('Pre-llenando formulario desde consulta del:', ultimaConRespuestas.fecha);

      // Copiar valores al formulario actual
      for (const key in respuestas) {
        const valor = respuestas[key];
        
        // Regla: Solo copiamos si el campo actual está vacío para no sobreescribir triaje o cambios manuales
        // Y evitamos el mapa odontológico que tiene su propia lógica de consolidación
        if (!this.esMapaOdontograma(valor)) {
          // Si el valor es 'true' o 'false' como string (común en base de datos), convertir a booleano real
          let valorLimpio = valor;
          if (valor === 'true') valorLimpio = true;
          if (valor === 'false') valorLimpio = false;

          this.respuestaDinamica[key] = valorLimpio;
        }
      }
      this.respuestaDinamica = { ...this.respuestaDinamica };
    }
  }

  esMapaOdontograma(valor: any): boolean {
    if (!valor) return false;
    let test = valor;
    if (typeof valor === 'string' && (valor.includes('"caras"') || valor.includes('"id"'))) {
      try { test = JSON.parse(valor); } catch(e) { return false; }
    }
    return Array.isArray(test) && test.length > 0 && (test[0].caras || test[0].id !== undefined);
  }

  constructor() {}

  getClasificacionIMC(imcStr: string, fechaNacimiento?: string): { label: string, textColor: string, bgColor: string } | null {
    const valor = parseFloat(imcStr);
    if (isNaN(valor) || valor <= 0) return null;

    // Solo para adultos (>= 18 años)
    if (fechaNacimiento && this.calcularEdad(fechaNacimiento) < 18) return null;

    if (valor < 18.5) return { label: 'Bajo peso', textColor: 'text-blue-700', bgColor: 'bg-blue-100/50' };
    if (valor < 25)   return { label: 'Normal',    textColor: 'text-green-700', bgColor: 'bg-green-100/50' };
    if (valor < 30)   return { label: 'Sobrepeso', textColor: 'text-amber-700', bgColor: 'bg-amber-100/50' };
    if (valor < 35)   return { label: 'Obesidad I', textColor: 'text-orange-700', bgColor: 'bg-orange-100/50' };
    if (valor < 40)   return { label: 'Obesidad II',textColor: 'text-red-700', bgColor: 'bg-red-100/50' };
    return { label: 'Obesidad III', textColor: 'text-purple-700', bgColor: 'bg-purple-100/50' };
  }

  async verPDF() {
    const h = this.vistaHistorial();
    if (!h) return;
    console.log('Datos de historia para PDF:', h);
    
    try {
      // Si es una consulta nueva (sin ID), usamos hallazgosCompletos()
      // Si es una consulta del historial, calculamos el historial hasta esa fecha
      const hallazgosParaPdf = (!h.id || h.id === 0) ? this.hallazgosCompletos() : this.calcularHistorialHasta(h);
      
      const url = await this.pdfSvc.generarConsultaPdfUrl(h, hallazgosParaPdf);
      this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      this.vistaModo.set('PDF');
    } catch (error) {
      console.error('Error al generar vista PDF:', error);
    }
  }

  cerrarVistaPdf() {
    this.pdfUrl.set(null);
    this.vistaModo.set('RESUMEN');
  }

  buscarMed(idx: number, ev: Event) {
    this.idxMed = idx;
    this.med$.next((ev.target as HTMLInputElement).value);
  }

  seleccionarMed(med: Medicamento) {
    const yaExiste = this.recetasArr.controls.some((ctrl, i) =>
      i !== this.idxMed && ctrl.get('medicamentoId')?.value === med.id
    );

    if (yaExiste) {
      this.notification.warn(`El medicamento ${med.nombreGenerico} ya ha sido agregado a esta receta.`);
      this.medSugerencias.set([]);
      this.modalMed.set(false);
      return;
    }

    // REQUERIMIENTO: Revisar si el paciente ya tiene este medicamento pendiente de entrega
    const pacienteId = this.paciente()?.id;
    if (!pacienteId) return;

    this.dispSvc.validarPendiente(pacienteId, med.id).subscribe({
      next: (res) => {
        console.log('[DuplicateCheck] Backend response:', res);
        // Manejar el caso donde la respuesta viene envuelta en 'data' y puede ser null
        const existe = (res && res.hasOwnProperty('data')) ? res.data : res;
        
        if (existe) {
          console.log('[DuplicateCheck] Found duplicate:', existe);
          this.infoDuplicado.set({
            ...existe,
            medicamento: med.nombreGenerico
          });
          this.modalDuplicado.set(true);
          this.medSugerencias.set([]);
          this.modalMed.set(false);
        } else {
          console.log('[DuplicateCheck] No duplicate found.');
          // Continuar con la selección normal
          this.recetasArr.at(this.idxMed).patchValue({
            medicamentoId: med.id,
            medicamento:   med.nombreGenerico,
            dosis:         med.concentracion,
            stock:         med.stock ?? 0,
          });
          this.medSugerencias.set([]);
          this.modalMed.set(false);
        }
      },
      error: (err) => {
        console.error('Error al validar medicamento pendiente:', err);
        // En caso de error de red, permitimos continuar por seguridad operativa, o podrías bloquearlo
        this.recetasArr.at(this.idxMed).patchValue({
          medicamentoId: med.id,
          medicamento:   med.nombreGenerico,
          dosis:         med.concentracion,
          stock:         med.stock ?? 0,
        });
        this.medSugerencias.set([]);
        this.modalMed.set(false);
      }
    });
  }

  buscarDiag(idx: number, ev: Event, _campo: 'codigo' | 'descripcion') {
    const q = (ev.target as HTMLInputElement).value;
    this.idxActivo.set(idx);
    this.cie$.next({ idx, q });
  }

  seleccionar(idx: number, item: CatDiagnostico) {
    const yaExiste = this.diagnosticosArr.controls.some((ctrl, i) =>
      i !== idx && ctrl.get('codigoCIE10')?.value === item.codigo
    );
    if (yaExiste) {
      this.notification.error(`El diagnóstico ${item.codigo} ya fue agregado.`);
      return;
    }
    this.diagnosticosArr.at(idx).patchValue({ codigoCIE10: item.codigo, descripcion: item.descripcion });
    this.sugerencias.update(m => ({ ...m, [idx]: [] }));
    this.modalCIE.set(false);

    // Trigger de Notificación Obligatoria
    if (item.notificable) {
      const currentNotifCode = this.notificacionEpiGroup.get('diagnosticoCIE10')?.value;
      
      // Solo pre-llenar si es un código diferente o si el formulario está vacío
      if (currentNotifCode !== item.codigo) {
        this.diagNotificable.set(item);
        
        const p = this.paciente();
        this.notificacionEpiGroup.patchValue({
          diagnosticoCIE10: item.codigo,
          fechaInicioSintomas: DateUtils.getHoyString(),
          direccionDetallada: p ? `${p.direccion || ''} ${p.comunidad ? '(' + p.comunidad + ')' : ''}`.trim() : ''
        } as any);

        // REQUERIMIENTO: Obtener ubicación del perfil del paciente si existe
        if (p?.latitud && p?.longitud) {
          const lat = parseFloat(p.latitud);
          const lng = parseFloat(p.longitud);
          this.notificacionEpiGroup.patchValue({
            latitud: lat,
            longitud: lng
          } as any);
          this.actualizarMapa(lat, lng);
          this.notification.info('Ubicación cargada automáticamente desde el perfil del paciente');
        } else {
          this.notification.warn('El paciente no tiene coordenadas registradas. Por favor, ubique el domicilio en el mapa.');
        }
      }
      
      this.mostrarFichaEpi.set(true);
      this.inicializarMapa();
    }
  }

  obtenerUbicacion() {
    if ('geolocation' in navigator) {
      this.geoCargando.set(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.notificacionEpiGroup.patchValue({
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude
          } as any);
          this.actualizarMapa(pos.coords.latitude, pos.coords.longitude);
          this.geoCargando.set(false);
          this.notification.info('Ubicación GPS capturada con éxito');
        },
        (err) => {
          console.error('Error al obtener ubicación:', err);
          this.geoCargando.set(false);
          this.notification.warn('No se pudo obtener la ubicación GPS automática. Por favor ingrésela manualmente si es posible.');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }

  cambiarTipo(idx: number, tipo: string) {
    if (tipo === 'PRINCIPAL') {
      this.diagnosticosArr.controls.forEach((ctrl, i) => {
        if (i !== idx && ctrl.get('tipo')?.value === 'PRINCIPAL') {
          ctrl.get('tipo')?.setValue('SECUNDARIO');
          this.notification.info('El diagnóstico principal anterior fue cambiado a secundario.');
        }
      });
    }
    this.diagnosticosArr.at(idx).get('tipo')?.setValue(tipo);
  }

  cerrarModal() {
    this.modalCIE.set(false);
  }

  agregarDiagnostico() {
    const tipo = this.diagnosticosArr.length === 0 ? 'PRINCIPAL' : 'SECUNDARIO';
    this.diagnosticosArr.push(this.fb.group({
      codigoCIE10: ['', Validators.required],
      descripcion: ['', Validators.required],
      tipo:        [tipo],
    }));
  }

  removerDiagnostico(i: number) {
    this.diagnosticosArr.removeAt(i);
  }

  agregarReceta() {
    const grupo = this.fb.group({
      medicamentoId: [null as number | null, Validators.required],
      medicamento:   ['', Validators.required],
      dosis:         ['', Validators.required],
      frecuencia:    ['', Validators.required],
      duracion:      [null as number | null, [Validators.required, Validators.min(1)]], // Cambiado a número (días)
      cantidad:      [0, [Validators.required, Validators.min(1)]],
      indicaciones:  [''],
      stock:         [0],
    });

    // Escuchar cambios para calcular cantidad
    grupo.valueChanges.subscribe(() => {
      this.calcularCantidad(grupo);
    });

    this.recetasArr.push(grupo);
  }

  calcularCantidad(grupo: any) {
    const frecuencia = grupo.get('frecuencia')?.value;
    const duracion   = grupo.get('duracion')?.value;
    
    if (!frecuencia || !duracion) return;

    let vecesAlDia = 0;
    switch (frecuencia) {
      case 'Cada 4 horas':  vecesAlDia = 6; break;
      case 'Cada 6 horas':  vecesAlDia = 4; break;
      case 'Cada 8 horas':  vecesAlDia = 3; break;
      case 'Cada 12 horas': vecesAlDia = 2; break;
      case 'Una vez al día':vecesAlDia = 1; break;
      default: vecesAlDia = 0;
    }

    if (vecesAlDia > 0) {
      const total = vecesAlDia * duracion;
      grupo.get('cantidad')?.setValue(total, { emitEvent: false });
    }
  }

  removerReceta(i: number) {
    this.recetasArr.removeAt(i);
  }

  agregarIncapacidad() {
    this.incapacidadesArr.push(this.fb.group({
      fechaInicio: ['', Validators.required],
      dias:        [null as number | null, [Validators.required, Validators.min(1)]],
      fechaFin:    [''],
      tipo:        ['LABORAL'],
      motivo:      ['', Validators.required],
    }));
  }

  removerIncapacidad(i: number) {
    this.incapacidadesArr.removeAt(i);
  }

  calcularFechaFin(i: number) {
    const grupo = this.incapacidadesArr.at(i);
    const inicio = grupo.get('fechaInicio')?.value as string;
    const dias   = grupo.get('dias')?.value as number;
    if (inicio && dias > 0) {
      // Usar split para evitar problemas de zona horaria al parsear "YYYY-MM-DD"
      const [y, m, d] = inicio.split('-').map(Number);
      const fin = new Date(y, m - 1, d);
      fin.setDate(fin.getDate() + dias - 1);
      grupo.get('fechaFin')?.setValue(DateUtils.getFechaISO(fin));
    }
  }

  dinamicoValido(): boolean {
    const p = this.plantilla();
    if (!p) return true;
    for (const sec of p.secciones ?? []) {
      for (const campo of sec.campos ?? []) {
        if (campo.requerido) {
          const val = this.respuestaDinamica[campo.clave];
          if (val === null || val === undefined || val === '') return false;
        }
      }
    }
    return true;
  }

  getAnchoCampo(ancho: string): string {
    return ancho === 'COMPLETO' ? 'col-span-2' : 'col-span-1';
  }

  getOpciones(campo: any): string[] {
    try {
      const cfg = campo.configuracion;
      if (!cfg) return [];
      const parsed = typeof cfg === 'string' ? JSON.parse(cfg) : cfg;
      return Array.isArray(parsed.opciones) ? parsed.opciones : [];
    } catch { return []; }
  }

  calcularEdad(fecha: string) {
    if (!fecha) return 0;
    const nacimiento = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  }

  cancelar() {
    this.confirmarSalida.set(true);
  }

  descartarConfirmado() {
    this.confirmarSalida.set(false);
    this.router.navigate(['/historia-clinica']);
  }

  guardar() {
    this.limpiarRecetasVacias();
    this.limpiarIncapacidadesVacias();

    if (this.diagnosticosArr.length === 0) {
      this.notification.error('Debe agregar al menos un diagnóstico antes de finalizar la consulta.');
      return;
    }
    if (this.form.invalid) {
      this.notification.warnForm(this.form, this.labels);
      return;
    }
    if (!this.dinamicoValido()) {
      this.validandoDinamico.set(true);
      this.notification.error('Complete los campos requeridos del formulario de especialidad.');
      return;
    }

    // Validación específica para Odontología
    if (this.plantilla()?.especialidad?.codigo === 'ODON') {
      const odonData = this.respuestaDinamica['odontograma_map'];
      if (odonData) {
        try {
          const parsed = JSON.parse(odonData);
          const tieneHallazgos = parsed.some((d: any) => 
            d.ausente || 
            Object.values(d.caras).some((c: any) => c.estado !== 'NORMAL')
          );
          
          if (!tieneHallazgos) {
            this.notification.warn('No ha registrado hallazgos en el odontograma. Asegúrese de marcar caries, obturaciones o ausencias si corresponde.');
          }
        } catch (e) {}
      }
    }

    this.confirmarFinalizacion.set(true);
  }

  ejecutarGuardado() {
    this.confirmarFinalizacion.set(false);
    this.enviando.set(true);

    // Construcción manual del payload para asegurar exactitud con el DTO
    const f = this.form.value;
    
    // Función auxiliar para convertir valores vacíos o nulos a undefined
    const cleanNum = (val: any, round = false) => {
      if (val === null || val === undefined || val === '' || isNaN(val)) return undefined;
      const n = Number(val);
      if (isNaN(n)) return undefined;
      return round ? Math.round(n) : n;
    };

    const payload = {
      pacienteId:         Number(f.pacienteId),
      citaId:             f.citaId ? Number(f.citaId) : undefined,
      plantillaId:        cleanNum(f.plantillaId),
      respuestaFormulario: this.respuestaDinamica,
      subjetivo:          f.subjetivo,
      objetivo:           f.objetivo,
      analisis:           f.analisis,
      plan:               f.plan,
      presionSistolica:   cleanNum(f.presionSistolica, true),
      presionDiastolica:  cleanNum(f.presionDiastolica, true),
      frecuenciaCardiaca: cleanNum(f.frecuenciaCardiaca, true),
      temperatura:        cleanNum(f.temperatura),
      peso:               cleanNum(f.peso),
      talla:              cleanNum(f.talla),
      saturacionO2:       cleanNum(f.saturacionO2, true),
      diagnosticos: this.diagnosticosArr.value
        .filter((d: any) => d.codigoCIE10 && d.descripcion)
        .map((d: any) => ({
          codigoCIE10: d.codigoCIE10,
          descripcion: String(d.descripcion || '').substring(0, 499),
          tipo:        d.tipo
        })),
      recetas: this.recetasArr.value
        .filter((r: any) => r.medicamentoId)
        .map((r: any) => ({
          medicamentoId: Number(r.medicamentoId),
          dosis:         r.dosis,
          frecuencia:    r.frecuencia,
          duracion:      String(r.duracion),
          cantidad:      Number(r.cantidad),
          indicaciones:  r.indicaciones || undefined,
        })),
      laboratorio: this.laboratorioArr.value
        .map((l: any) => Number(l.examenId))
        .filter((id: number) => id > 0),
      radiologia:  this.radiologiaArr.value
        .map((r: any) => Number(r.estudioId))
        .filter((id: number) => id > 0),
      incapacidades: this.incapacidadesArr.value
        .filter((i: any) => i.motivo && i.fechaInicio)
        .map((i: any) => ({
          fechaInicio: i.fechaInicio,
          fechaFin:    i.fechaFin,
          dias:        Number(i.dias),
          tipo:        i.tipo,
          motivo:      i.motivo
        })),
      referencias: this.referenciasCreadas().map((r: any) => ({
        establecimientoDestinoId: Number(r.establecimientoDestinoId),
        especialidadDestino: String(r.especialidadDestino || ''),
        motivo: String(r.motivo || ''),
        urgente: !!r.urgente
      })),
      proximaCita: this.proximaCitaData() || undefined,
      notificacionEpidemiologica: this.diagNotificable() 
        ? { 
            ...this.form.get('notificacionEpi')?.value,
            diagnosticoCIE10: this.diagNotificable()?.codigo,
            fechaInicioSintomas: this.form.get('notificacionEpi.fechaInicioSintomas')?.value || undefined,
            latitud: this.form.get('notificacionEpi.latitud')?.value ?? undefined,
            longitud: this.form.get('notificacionEpi.longitud')?.value ?? undefined,
            direccionDetallada: this.form.get('notificacionEpi.direccionDetallada')?.value || undefined,
            antecedentesViaje: this.form.get('notificacionEpi.antecedentesViaje')?.value || undefined,
            lugaresVisitados: this.form.get('notificacionEpi.lugaresVisitados')?.value || undefined,
            observaciones: this.form.get('notificacionEpi.observaciones')?.value || undefined
          } 
        : undefined,
    };

    console.log('Enviando payload:', payload);

    this.svc.crear(payload as any).subscribe({
      next: (res: any) => {
        const historiaId = res?.data?.id ?? res?.id;
        console.log('CONSULTA GUARDADA EXITOSAMENTE. ID:', historiaId);

        if (!historiaId) {
          this.notification.error('Error: No se recibió ID de consulta');
          this.enviando.set(false);
          return;
        }

        // Mostrar modal inmediatamente con la data básica
        console.log('Mostrando modal de impresión...');
        this.datosGuardados.set(res.data ?? res);
        this.mostrarModalImpresion.set(true);
        this.enviando.set(false);
        this.notification.success('Consulta guardada con éxito');

        // Intentar enriquecer los datos en segundo plano
        this.svc.obtenerDetalle(historiaId).subscribe({
          next: (fullData: any) => {
            console.log('Datos enriquecidos cargados para impresión:', fullData);
            this.datosGuardados.set(fullData);
          },
          error: (err) => {
            console.error('Error al cargar datos enriquecidos para impresión', err);
          }
        });

        const p = this.plantilla();
        if (p && historiaId && Object.keys(this.respuestaDinamica).length > 0) {
          this.fSvc.guardarRespuesta(historiaId, {
            plantillaId: p.id,
            respuestas: this.respuestaDinamica,
          }).subscribe({
            error: (err) => console.error('Error al guardar respuestas dinámicas:', err)
          });
        }

        // Intentar enriquecer los datos (médico, paciente, etc) para reportes más completos
        this.svc.obtenerDetalle(historiaId).subscribe({
          next: (fullData: any) => {
            console.log('Datos enriquecidos cargados para impresión');
            this.datosGuardados.set(fullData);
          },
          error: (err: any) => {
            console.warn('No se pudo enriquecer la data, se usará la data básica del guardado:', err);
          }
        });
      },
      error: (err) => {
        console.error('Error al guardar consulta:', err);
        this.enviando.set(false);
        this.notification.error('Error al guardar la consulta');
      },
    });
  }

  async imprimirDocumento(tipo: string, formato: 'NORMAL' | 'POS') {
    const data = this.datosGuardados();
    if (!data) return;

    let url = '';
    try {
      switch (tipo) {
        case 'RECETA':
          url = await this.pdfSvc.generarRecetaPdfUrl(data, formato);
          break;
        case 'LABORATORIO':
          url = await this.pdfSvc.generarLaboratorioPdfUrl(data, formato);
          break;
        case 'RADIOLOGIA':
          url = await this.pdfSvc.generarRadiologiaPdfUrl(data, formato);
          break;
        case 'INCAPACIDAD':
          url = await this.pdfSvc.generarIncapacidadPdfUrl(data, formato);
          break;
        case 'REMISION':
          url = await this.pdfSvc.generarRemisionPdfUrl(data, formato);
          break;
        case 'CONSULTA':
          url = await this.pdfSvc.generarConsultaPdfUrl(data, this.historialHallazgos());
          break;
      }

      if (url) {
        abrirPdfEnVisor(url);
      }
    } catch (error) {
      console.error('Error generando impresión:', error);
      this.notification.error('Error al generar el documento');
    }
  }

  finalizarYSalir() {
    this.mostrarModalImpresion.set(false);
    this.router.navigate(['/historia-clinica']);
  }

  public inicializarMapa() {
    setTimeout(() => {
      if (this.map) {
        this.map.remove();
      }

      const lat = this.notificacionEpiGroup.get('latitud')?.value || 14.1; // Default Honduras
      const lng = this.notificacionEpiGroup.get('longitud')?.value || -87.2;

      this.map = L.map('map-epi').setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map);

      // Icono SVG para evitar problemas con assets faltantes
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style='background-color:#ef4444; width:30px; height:30px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); border:2px solid white; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);'>
                <div style='width:10px; height:10px; background-color:white; border-radius:50%; transform:rotate(45deg);'></div>
               </div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      this.mapMarker = L.marker([lat, lng], { draggable: true, icon })
        .addTo(this.map)
        .on('dragend', (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          this.notificacionEpiGroup.patchValue({
            latitud: position.lat,
            longitud: position.lng
          } as any);
        });

      this.map.on('click', (e) => {
        const position = e.latlng;
        this.mapMarker?.setLatLng(position);
        this.notificacionEpiGroup.patchValue({
          latitud: position.lat,
          longitud: position.lng
        } as any);
      });

      // Forzar redraw para evitar problemas de tiles en modales
      const forceResize = () => {
        this.map?.invalidateSize();
        window.dispatchEvent(new Event('resize'));
      };

      setTimeout(forceResize, 100);
      setTimeout(forceResize, 500);
      setTimeout(forceResize, 1000);
      setTimeout(forceResize, 2000);
    }, 1000);
  }

  private actualizarMapa(lat: number, lng: number) {
    if (this.map && this.mapMarker) {
      const pos = new L.LatLng(lat, lng);
      this.map.setView(pos, 15);
      this.mapMarker.setLatLng(pos);
      this.repararMapa();
    }
  }

  repararMapa() {
    if (this.map) {
      setTimeout(() => {
        this.map?.invalidateSize();
        window.dispatchEvent(new Event('resize'));
      }, 100);
      setTimeout(() => this.map?.invalidateSize(), 500);
    }
  }

  esFechaValida(fecha: string): boolean {
    return DateUtils.esFechaValida(fecha);
  }
}
