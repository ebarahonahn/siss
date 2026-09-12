import { abrirPdfEnVisor } from '../../shared/utils/pdf-viewer';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PacientesService } from '../../core/services/pacientes.service';
import { ReportePdfService } from '../../core/services/reporte-pdf.service';
import { AuthService } from '../../core/services/auth.service';
import { DateUtils } from '../../core/utils/date-utils';
import { ConfiguracionDocumentosService } from '../../core/services/configuracion-documentos.service';
import { BehaviorSubject, debounceTime, switchMap, of, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historial-unificado',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div class="max-w-7xl mx-auto space-y-8">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="p-4 bg-blue-600/10 text-blue-600 rounded-3xl">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Historial Clínico Unificado</h1>
              <p class="text-xs md:text-sm text-slate-500 font-medium mt-1">Búsqueda global y trazabilidad completa de atenciones clínicas por DNI, Expediente o Nombre</p>
            </div>
          </div>

          <div *ngIf="datosHistorial() && puedeExportar()" class="flex items-center gap-3">
            <button (click)="imprimirHistorialCompleto()" class="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-100">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Imprimir Expediente
            </button>
          </div>
        </div>

        <!-- Buscador de Pacientes -->
        <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
          <label class="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Buscar Paciente</label>
          <div class="relative">
            <svg class="w-6 h-6 absolute left-5 top-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              [(ngModel)]="terminoBusqueda"
              (keyup.enter)="ejecutarBusquedaDirecta()"
              (input)="onSearchInput($event)"
              placeholder="Ingrese número de DNI (ej: 0801199012345), expediente o nombre completo..."
              class="w-full pl-14 pr-32 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
            />
            <button type="button" (click)="ejecutarBusquedaDirecta()"
                    class="absolute right-3 top-2.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all">
              Buscar
            </button>

            <!-- Dropdown de Resultados de Búsqueda -->
            <div *ngIf="mostrarResultados() && resultadosBusqueda().length > 0" 
                 class="absolute z-50 left-0 right-0 mt-3 bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden p-3 space-y-1">
              <button *ngFor="let p of resultadosBusqueda()" (click)="seleccionarPaciente(p)"
                      class="w-full text-left p-4 hover:bg-blue-50/60 rounded-2xl transition-all flex items-center justify-between group">
                <div>
                  <div class="font-black text-slate-800 text-sm group-hover:text-blue-700">{{ p.apellidos }}, {{ p.nombres }}</div>
                  <div class="text-xs text-slate-400 font-medium mt-0.5">DNI: <span class="font-bold text-slate-600">{{ p.dni || '—' }}</span> | Expediente: <span class="font-mono text-blue-600 font-bold">{{ p.numeroExpediente }}</span></div>
                </div>
                <div class="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider group-hover:bg-blue-600 group-hover:text-white transition-all">
                  Ver Historial
                </div>
              </button>
            </div>

            <!-- Sin resultados -->
            <div *ngIf="mostrarResultados() && resultadosBusqueda().length === 0 && !cargando()" 
                 class="absolute z-50 left-0 right-0 mt-3 bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 text-center text-xs font-bold text-slate-400">
              No se encontró ningún paciente con el término ingresado.
            </div>
          </div>
        </div>

        <!-- Indicador de Carga -->
        <div *ngIf="cargando()" class="bg-white p-16 rounded-[2.5rem] text-center border border-slate-100 shadow-sm">
          <div class="inline-block animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p class="text-sm font-bold text-slate-500">Cargando trazabilidad e historial médico unificado...</p>
        </div>

        <!-- Vista del Paciente y su Historial -->
        <div *ngIf="datosHistorial() && !cargando()" class="space-y-8">
          <!-- Banner de Paciente -->
          <div class="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/50 pb-6">
              <div>
                <span class="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest">Paciente Seleccionado</span>
                <h2 class="text-2xl md:text-3xl font-black mt-2">{{ datosHistorial().paciente?.apellidos }}, {{ datosHistorial().paciente?.nombres }}</h2>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-4 py-2 bg-slate-800 rounded-2xl border border-slate-700 text-xs font-mono font-bold text-blue-400">Expediente: {{ datosHistorial().paciente?.numeroExpediente }}</span>
                <span class="px-4 py-2 bg-slate-800 rounded-2xl border border-slate-700 text-xs font-bold text-slate-300">DNI: {{ datosHistorial().paciente?.dni || '—' }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-xs">
              <div><div class="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Fecha Nacimiento</div><div class="font-bold mt-1 text-slate-200">{{ formatDate(datosHistorial().paciente?.fechaNacimiento) }}</div></div>
              <div><div class="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Edad</div><div class="font-bold mt-1 text-slate-200">{{ calcularEdad(datosHistorial().paciente?.fechaNacimiento) }}</div></div>
              <div><div class="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Sexo</div><div class="font-bold mt-1 text-slate-200">{{ datosHistorial().paciente?.sexo?.nombre || '—' }}</div></div>
              <div><div class="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Tipo Sangre</div><div class="font-bold mt-1 text-rose-400">{{ datosHistorial().paciente?.tipoSangre?.nombre || '—' }}</div></div>
              <div><div class="text-slate-400 font-bold uppercase text-[9px] tracking-wider">EstablecimientoOrigen</div><div class="font-bold mt-1 text-slate-200">{{ datosHistorial().paciente?.establecimiento?.nombre || '—' }}</div></div>
              <div><div class="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Municipio</div><div class="font-bold mt-1 text-slate-200">{{ datosHistorial().paciente?.municipio?.nombre || '—' }}</div></div>
            </div>
          </div>

          <!-- Navegación por pestañas de historia -->
          <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button (click)="tabActiva.set('TIMELINE')" [class]="tabActiva() === 'TIMELINE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'" class="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap">
              Línea de Tiempo
            </button>
            <button (click)="tabActiva.set('CONSULTAS')" [class]="tabActiva() === 'CONSULTAS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'" class="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap">
              Consultas Médicas ({{ datosHistorial().historias?.length || 0 }})
            </button>
            <button (click)="tabActiva.set('TRIAJE')" [class]="tabActiva() === 'TRIAJE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'" class="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap">
              Triaje ({{ datosHistorial().triajes?.length || 0 }})
            </button>
            <button (click)="tabActiva.set('PEDIATRIA')" [class]="tabActiva() === 'PEDIATRIA' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'" class="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap">
              Pediatría / CRED ({{ datosHistorial().controlesPediatricos?.length || 0 }})
            </button>
            <button (click)="tabActiva.set('PRENATAL')" [class]="tabActiva() === 'PRENATAL' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'" class="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap">
              Prenatal ({{ datosHistorial().controlesPrenatales?.length || 0 }})
            </button>
            <button (click)="tabActiva.set('HOSPITALIZACION')" [class]="tabActiva() === 'HOSPITALIZACION' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'" class="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap">
              Hospitalización ({{ datosHistorial().hospitalizaciones?.length || 0 }})
            </button>
            <button (click)="tabActiva.set('VACUNAS')" [class]="tabActiva() === 'VACUNAS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'" class="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap">
              Vacunas PAI ({{ datosHistorial().vacunaciones?.length || 0 }})
            </button>
          </div>

          <!-- CONTENIDO TAB: TIMELINE -->
          <div *ngIf="tabActiva() === 'TIMELINE'" class="space-y-6">
            <div *ngIf="eventosCronologicos().length === 0" class="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100">
              <p class="text-sm font-bold text-slate-400">No hay atenciones médicas registradas para este paciente.</p>
            </div>

            <div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              <div *ngFor="let ev of eventosCronologicos()" class="relative flex items-start gap-4 group">
                <div [class]="'w-5 h-5 rounded-full ring-4 ring-slate-50 shrink-0 mt-1.5 ' + ev.badgeClass"></div>
                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex-1 space-y-3">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-3">
                    <div class="flex items-center gap-2">
                      <span [class]="'px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ' + ev.tagClass">{{ ev.tipoLabel }}</span>
                      <h4 class="text-sm font-black text-slate-900">{{ ev.titulo }}</h4>
                    </div>
                    <span class="text-xs font-bold text-slate-400">{{ formatDate(ev.fecha) }}</span>
                  </div>
                  <p class="text-xs text-slate-600 font-medium">{{ ev.descripcion }}</p>
                  <div *ngIf="ev.profesional || ev.establecimiento" class="flex items-center justify-between text-[11px] text-slate-400 font-bold pt-2 border-t border-slate-50">
                    <span>{{ ev.profesional ? 'Atendido por: ' + ev.profesional : '' }}</span>
                    <span>{{ ev.establecimiento || '' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CONTENIDO TAB: CONSULTAS -->
          <div *ngIf="tabActiva() === 'CONSULTAS'" class="space-y-6">
            <div *ngIf="datosHistorial().historias?.length === 0" class="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100">
              <p class="text-sm font-bold text-slate-400">No se registraron consultas médicas.</p>
            </div>

            <div *ngFor="let c of datosHistorial().historias" class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 class="text-lg font-black text-slate-900">Consulta Médica - {{ c.medico?.especialidad?.nombre || 'Medicina General' }}</h3>
                  <p class="text-xs text-slate-400 font-medium">Médico: {{ c.medico?.nombres }} {{ c.medico?.apellidos }} | {{ formatDate(c.fecha) }}</p>
                </div>
                <button *ngIf="puedeExportar()" (click)="imprimirConsulta(c.id)" class="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all">
                  PDF Consulta
                </button>
              </div>

              <!-- Signos Vitales -->
              <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                <div class="p-3 bg-slate-50 rounded-2xl"><div class="text-[9px] font-black text-slate-400 uppercase">P. Arterial</div><div class="text-xs font-black text-slate-800">{{ c.presionSistolica }}/{{ c.presionDiastolica }}</div></div>
                <div class="p-3 bg-slate-50 rounded-2xl"><div class="text-[9px] font-black text-slate-400 uppercase">Frec. Cardíaca</div><div class="text-xs font-black text-slate-800">{{ c.frecuenciaCardiaca || '—' }} bpm</div></div>
                <div class="p-3 bg-slate-50 rounded-2xl"><div class="text-[9px] font-black text-slate-400 uppercase">Temperatura</div><div class="text-xs font-black text-slate-800">{{ c.temperatura || '—' }} °C</div></div>
                <div class="p-3 bg-slate-50 rounded-2xl"><div class="text-[9px] font-black text-slate-400 uppercase">Peso</div><div class="text-xs font-black text-slate-800">{{ c.peso || '—' }} kg</div></div>
                <div class="p-3 bg-slate-50 rounded-2xl"><div class="text-[9px] font-black text-slate-400 uppercase">Talla</div><div class="text-xs font-black text-slate-800">{{ c.talla || '—' }} cm</div></div>
                <div class="p-3 bg-slate-50 rounded-2xl"><div class="text-[9px] font-black text-slate-400 uppercase">Sat. O2</div><div class="text-xs font-black text-slate-800">{{ c.saturacionO2 || '—' }} %</div></div>
              </div>

              <!-- Diagnósticos CIE-10 -->
              <div>
                <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Diagnósticos (CIE-10)</h4>
                <div class="flex flex-wrap gap-2">
                  <span *ngFor="let d of c.diagnosticos" class="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100">
                    <strong class="font-mono">{{ d.codigoCIE10 }}</strong> - {{ d.descripcion }} ({{ d.tipo }})
                  </span>
                </div>
              </div>

              <!-- Nota SOAP -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div class="p-4 bg-slate-50 rounded-2xl space-y-1">
                  <span class="font-black text-slate-400 uppercase tracking-wider text-[10px]">Subjetivo (Anamnesis)</span>
                  <p class="text-slate-700 font-medium">{{ c.subjetivo || 'Sin detalles' }}</p>
                </div>
                <div class="p-4 bg-slate-50 rounded-2xl space-y-1">
                  <span class="font-black text-slate-400 uppercase tracking-wider text-[10px]">Análisis / Evaluación</span>
                  <p class="text-slate-700 font-medium">{{ c.analisis || 'Sin detalles' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- CONTENIDO TAB: TRIAJE -->
          <div *ngIf="tabActiva() === 'TRIAJE'" class="space-y-4">
            <div *ngIf="datosHistorial().triajes?.length === 0" class="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100">
              <p class="text-sm font-bold text-slate-400">No hay triajes de urgencia registrados.</p>
            </div>

            <div *ngFor="let t of datosHistorial().triajes" class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <span [class]="'px-3 py-1 font-black text-[10px] uppercase rounded-xl ' + getTriajeBadge(t.nivelPrioridad)">
                  Prioridad {{ t.nivelPrioridad }}
                </span>
                <span class="text-xs font-bold text-slate-400">{{ formatDate(t.creadoEn || t.fechaRegistro) }}</span>
              </div>
              <div>
                <h4 class="text-sm font-black text-slate-800 mt-1">Motivo: {{ t.motivoConsulta }}</h4>
                <p class="text-xs text-slate-500 font-medium">Evaluado por: {{ t.enfermera?.nombres }} {{ t.enfermera?.apellidos }}</p>
              </div>
              <div class="text-right text-xs font-bold text-slate-600">
                P.A: {{ t.presionSistolica }}/{{ t.presionDiastolica }} | Temp: {{ t.temperatura }}°C
              </div>
            </div>
          </div>

          <!-- CONTENIDO TAB: PEDIATRIA -->
          <div *ngIf="tabActiva() === 'PEDIATRIA'" class="space-y-4">
            <div *ngIf="datosHistorial().controlesPediatricos?.length === 0" class="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100">
              <p class="text-sm font-bold text-slate-400">No hay controles de niño sano (CRED) registrados.</p>
            </div>

            <div *ngFor="let p of datosHistorial().controlesPediatricos" class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <span class="px-3 py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase rounded-xl">Control CRED</span>
                <span class="text-xs font-bold text-slate-400">{{ formatDate(p.creadoEn || p.fechaControl) }}</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span class="text-slate-400 font-bold">Peso:</span> <strong>{{ p.peso }} kg</strong></div>
                <div><span class="text-slate-400 font-bold">Talla:</span> <strong>{{ p.talla }} cm</strong></div>
                <div><span class="text-slate-400 font-bold">Perímetro Cefálico:</span> <strong>{{ p.perimetroCefalico || '—' }} cm</strong></div>
                <div><span class="text-slate-400 font-bold">Estado Nutricional:</span> <strong class="text-emerald-600">{{ p.estadoNutricional || 'NORMAL' }}</strong></div>
              </div>
              <p class="text-xs text-slate-600 font-medium">Observaciones: {{ p.observaciones }}</p>
            </div>
          </div>

          <!-- CONTENIDO TAB: PRENATAL -->
          <div *ngIf="tabActiva() === 'PRENATAL'" class="space-y-4">
            <div *ngIf="datosHistorial().controlesPrenatales?.length === 0" class="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100">
              <p class="text-sm font-bold text-slate-400">No hay controles prenatales registrados.</p>
            </div>

            <div *ngFor="let cp of datosHistorial().controlesPrenatales" class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <span class="px-3 py-1 bg-rose-50 text-rose-700 font-black text-[10px] uppercase rounded-xl">Control Obstétrico</span>
                <span class="text-xs font-bold text-slate-400">{{ formatDate(cp.fechaControl || cp.creadoEn) }}</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span class="text-slate-400 font-bold">Edad Gestacional:</span> <strong>{{ cp.semanasGestacion ?? cp.edadGestacionalSemanas ?? '—' }} Semanas</strong></div>
                <div><span class="text-slate-400 font-bold">Altura Uterina:</span> <strong>{{ cp.alturaUterina || '—' }} cm</strong></div>
                <div><span class="text-slate-400 font-bold">FCF:</span> <strong>{{ cp.frecuenciaCardiacaFetal || '—' }} lpm</strong></div>
                <div><span class="text-slate-400 font-bold">Presión:</span> <strong>{{ cp.presionArterial || '—' }}</strong></div>
              </div>
            </div>
          </div>

          <!-- CONTENIDO TAB: HOSPITALIZACION -->
          <div *ngIf="tabActiva() === 'HOSPITALIZACION'" class="space-y-4">
            <div *ngIf="datosHistorial().hospitalizaciones?.length === 0" class="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100">
              <p class="text-sm font-bold text-slate-400">No hay ingresos hospitalarios registrados.</p>
            </div>

            <div *ngFor="let h of datosHistorial().hospitalizaciones" class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <span class="px-3 py-1 bg-purple-50 text-purple-700 font-black text-[10px] uppercase rounded-xl">Estancia Hospitalaria ({{ h.estado }})</span>
                <span class="text-xs font-bold text-slate-400">{{ formatDate(h.fechaIngreso) }}</span>
              </div>
              <div class="text-xs text-slate-700 font-medium">
                <p><strong>Diagnóstico Ingreso:</strong> {{ h.diagnosticoIngreso }}</p>
                <p><strong>Ubicación:</strong> Sala {{ h.cama?.habitacion?.sala?.nombre || '—' }} - Cama {{ h.cama?.numero || '—' }}</p>
              </div>
            </div>
          </div>

          <!-- CONTENIDO TAB: VACUNAS -->
          <div *ngIf="tabActiva() === 'VACUNAS'" class="space-y-4">
            <div *ngIf="datosHistorial().vacunaciones?.length === 0" class="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100">
              <p class="text-sm font-bold text-slate-400">No hay vacunas registradas en el esquema PAI.</p>
            </div>

            <div *ngFor="let v of datosHistorial().vacunaciones" class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <span class="px-3 py-1 bg-cyan-50 text-cyan-700 font-black text-[10px] uppercase rounded-xl">Vacunación PAI</span>
                <span class="text-xs font-bold text-slate-400">{{ formatDate(v.fechaAplicacion) }}</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div><span class="text-slate-400 font-bold">Biológico:</span> <strong class="text-cyan-700">{{ v.vacuna?.nombre }}</strong></div>
                <div><span class="text-slate-400 font-bold">Dosis Aplicada:</span> <strong>{{ v.esquema?.descripcion || v.esquema?.numeroDosis }}</strong></div>
                <div><span class="text-slate-400 font-bold">Lote:</span> <strong class="font-mono">{{ v.lote?.codigoLote }}</strong></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class HistorialUnificadoComponent implements OnInit {
  private ps = inject(PacientesService);
  private pdfSvc = inject(ReportePdfService);
  private auth = inject(AuthService);
  private documentosService = inject(ConfiguracionDocumentosService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  terminoBusqueda = '';
  cargando = signal(false);
  resultadosBusqueda = signal<any[]>([]);
  mostrarResultados = signal(false);
  datosHistorial = signal<any>(null);
  tabActiva = signal<'TIMELINE' | 'CONSULTAS' | 'TRIAJE' | 'PEDIATRIA' | 'PRENATAL' | 'HOSPITALIZACION' | 'VACUNAS'>('TIMELINE');

  searchSubject = new BehaviorSubject<string>('');

  puedeExportar(): boolean {
    return this.auth.tienePermiso('historial_unificado:exportar');
  }

  ngOnInit() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        switchMap((q: string) => {
          if (!q || q.trim().length < 2) {
            this.mostrarResultados.set(false);
            return of(null);
          }
          return this.ps.buscar(q.trim());
        })
      )
      .subscribe((res: any) => {
        if (!res) return;
        const arr = this.extraerLista(res);
        this.resultadosBusqueda.set(arr);
        this.mostrarResultados.set(true);
      });

    // Cargar paciente por parámetro de URL si existe
    const pid = this.route.snapshot.paramMap.get('pacienteId');
    if (pid) {
      this.cargarHistorialCompleto(Number(pid));
    }
  }

  private extraerLista(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  }

  onSearchInput(event: any) {
    this.terminoBusqueda = event.target.value;
    this.searchSubject.next(this.terminoBusqueda);
  }

  ejecutarBusquedaDirecta() {
    const term = this.terminoBusqueda?.trim();
    if (!term) return;

    this.cargando.set(true);
    this.ps.buscar(term).subscribe({
      next: (res: any) => {
        this.cargando.set(false);
        const arr = this.extraerLista(res);
        this.resultadosBusqueda.set(arr);
        
        if (arr.length === 1) {
          // Si solo hay 1 coincidencia exacta, seleccionarlo directamente
          this.seleccionarPaciente(arr[0]);
        } else {
          this.mostrarResultados.set(true);
        }
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  seleccionarPaciente(paciente: any) {
    this.mostrarResultados.set(false);
    this.cargarHistorialCompleto(paciente.id);
  }

  cargarHistorialCompleto(pacienteId: number) {
    this.cargando.set(true);
    this.http.get(`${environment.apiUrl}/historia-clinica/paciente/${pacienteId}/historial-unificado`).subscribe({
      next: (res: any) => {
        const payload = res?.data || res;
        this.datosHistorial.set(payload);
        this.cargando.set(false);
      },
      error: (err: any) => {
        this.cargando.set(false);
        Swal.fire('Error', 'No se pudo cargar el historial unificado del paciente', 'error');
      }
    });
  }

  eventosCronologicos() {
    const data = this.datosHistorial();
    if (!data) return [];

    const list: any[] = [];

    // Consultas
    (data.historias || []).forEach((h: any) => {
      list.push({
        fecha: h.fecha,
        tipoLabel: 'Consulta Médica',
        titulo: `Consulta - ${h.medico?.especialidad?.nombre || 'Medicina General'}`,
        descripcion: `Diagnóstico: ${h.diagnosticos?.map((d: any) => d.descripcion).join(', ') || 'Atención Médica'}`,
        profesional: `${h.medico?.nombres || ''} ${h.medico?.apellidos || ''}`,
        establecimiento: h.medico?.establecimiento?.nombre,
        badgeClass: 'bg-blue-600',
        tagClass: 'bg-blue-50 text-blue-700'
      });
    });

    // Triajes
    (data.triajes || []).forEach((t: any) => {
      list.push({
        fecha: t.creadoEn || t.fechaRegistro,
        tipoLabel: 'Triaje',
        titulo: `Triaje Urgencias (Prioridad ${t.nivelPrioridad})`,
        descripcion: `Motivo: ${t.motivoConsulta}`,
        profesional: `${t.enfermera?.nombres || ''} ${t.enfermera?.apellidos || ''}`,
        establecimiento: t.establecimiento?.nombre,
        badgeClass: 'bg-amber-500',
        tagClass: 'bg-amber-50 text-amber-700'
      });
    });

    // Pediatría
    (data.controlesPediatricos || []).forEach((p: any) => {
      const prof = p.creadoPor || p.evaluadoPor;
      list.push({
        fecha: p.creadoEn || p.fechaControl,
        tipoLabel: 'Control CRED',
        titulo: `Control Pediátrico / CRED`,
        descripcion: `Peso: ${p.peso}kg | Talla: ${p.talla}cm | Estado: ${p.estadoNutricional || 'Normal'}`,
        profesional: `${prof?.nombres || ''} ${prof?.apellidos || ''}`,
        badgeClass: 'bg-emerald-500',
        tagClass: 'bg-emerald-50 text-emerald-700'
      });
    });

    // Prenatal
    (data.controlesPrenatales || []).forEach((cp: any) => {
      const prof = cp.creadoPor || cp.evaluadoPor;
      const sem = cp.semanasGestacion !== undefined && cp.semanasGestacion !== null ? cp.semanasGestacion : (cp.edadGestacionalSemanas || '—');
      list.push({
        fecha: cp.fechaControl || cp.creadoEn,
        tipoLabel: 'Control Prenatal',
        titulo: `Control Obstétrico (${sem} Semanas)`,
        descripcion: `AU: ${cp.alturaUterina || '—'}cm | FCF: ${cp.frecuenciaCardiacaFetal || '—'}lpm`,
        profesional: `${prof?.nombres || ''} ${prof?.apellidos || ''}`,
        badgeClass: 'bg-rose-500',
        tagClass: 'bg-rose-50 text-rose-700'
      });
    });

    // Hospitalización
    (data.hospitalizaciones || []).forEach((hos: any) => {
      list.push({
        fecha: hos.fechaIngreso,
        tipoLabel: 'Hospitalización',
        titulo: `Ingreso Hospitalario (${hos.estado})`,
        descripcion: `Diagnóstico: ${hos.diagnosticoIngreso}`,
        profesional: `${hos.medicoIngreso?.nombres || ''} ${hos.medicoIngreso?.apellidos || ''}`,
        badgeClass: 'bg-purple-600',
        tagClass: 'bg-purple-50 text-purple-700'
      });
    });

    // Vacunas
    (data.vacunaciones || []).forEach((v: any) => {
      list.push({
        fecha: v.fechaAplicacion,
        tipoLabel: 'Vacuna PAI',
        titulo: `Vacunación: ${v.vacuna?.nombre}`,
        descripcion: `Dosis: ${v.esquema?.descripcion || v.esquema?.numeroDosis} | Lote: ${v.lote?.codigoLote}`,
        profesional: `${v.aplicadoPor?.nombres || ''} ${v.aplicadoPor?.apellidos || ''}`,
        badgeClass: 'bg-cyan-500',
        tagClass: 'bg-cyan-50 text-cyan-700'
      });
    });

    // Ordenar por fecha descendente
    return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  formatDate(f: string): string {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-HN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  calcularEdad(fechaNac: string): string {
    if (!fechaNac) return '—';
    const nac = new Date(fechaNac);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
      edad--;
    }
    return `${edad} años`;
  }

  getTriajeBadge(nivel: number): string {
    switch (nivel) {
      case 1: return 'bg-red-600 text-white';
      case 2: return 'bg-orange-500 text-white';
      case 3: return 'bg-amber-400 text-slate-900';
      case 4: return 'bg-green-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  }

  async imprimirHistorialCompleto() {
    if (!this.puedeExportar()) {
      Swal.fire('Acceso denegado', 'No tiene permisos para exportar ni imprimir documentos', 'warning');
      return;
    }

    const data = this.datosHistorial();
    if (!data) return;

    try {
      Swal.fire({
        title: 'Generando PDF',
        text: 'Preparando expediente clínico unificado...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const configDocumento = await firstValueFrom(
        this.documentosService.obtener('HISTORIAL_UNIFICADO'),
      );
      const url = await this.pdfSvc.generarExpedienteUnificadoPdfUrl(data, configDocumento);
      Swal.close();

      if (url) {
        abrirPdfEnVisor(
          url,
          configDocumento.tituloVisor,
          this.nombreArchivoExpediente(configDocumento.nombreArchivo, data),
        );
      }
    } catch (err) {
      console.error('Error al generar PDF de expediente unificado:', err);
      Swal.fire('Error', 'No se pudo generar el expediente unificado en PDF', 'error');
    }
  }

  private nombreArchivoExpediente(plantilla: string, data: any): string {
    const identificador = String(
      data?.paciente?.numeroExpediente || data?.paciente?.dni || 'paciente',
    )
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '-');
    const nombre = (plantilla || 'expediente-clinico-{expediente}.pdf')
      .replaceAll('{expediente}', identificador || 'paciente');

    return nombre.toLowerCase().endsWith('.pdf') ? nombre : `${nombre}.pdf`;
  }

  async imprimirConsulta(id: number) {
    if (!this.puedeExportar()) {
      Swal.fire('Acceso denegado', 'No tiene permisos para exportar ni imprimir documentos', 'warning');
      return;
    }

    const data = this.datosHistorial();
    if (!data) return;

    const h = (data.historias || []).find((item: any) => item.id === id);
    if (!h) {
      Swal.fire('Error', 'No se encontraron los datos de la consulta seleccionada', 'error');
      return;
    }

    try {
      Swal.fire({
        title: 'Generando PDF',
        text: `Preparando comprobante de consulta #${id}...`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const historiaCompleta = {
        ...h,
        paciente: data.paciente || h.paciente,
      };

      const configHistorial = await firstValueFrom(
        this.documentosService.obtener('HISTORIAL_UNIFICADO'),
      );
      let configDocumento = configHistorial;
      try {
        configDocumento = await firstValueFrom(
          this.documentosService.obtener('CONSULTA_CLINICA'),
        );
      } catch {
        // Mantiene la configuración actual hasta que se cree la específica de consulta.
      }
      const url = await this.pdfSvc.generarConsultaPdfUrl(
        historiaCompleta,
        undefined,
        configDocumento,
      );
      Swal.close();

      if (url) {
        abrirPdfEnVisor(
          url,
          configDocumento.tituloVisor,
          this.nombreArchivoExpediente(configDocumento.nombreArchivo, data),
        );
      }
    } catch (err) {
      console.error('Error al generar PDF de consulta:', err);
      Swal.fire('Error', 'No se pudo generar la nota de consulta en PDF', 'error');
    }
  }
}
