import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map, Subject, debounceTime, distinctUntilChanged, takeUntil, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PacientesService } from '../../core/services/pacientes.service';
import * as XLSX from 'xlsx';

interface RecetaHistorial {
  id: number;
  estado: string;
  creadaEn: string;
  dispensadaEn: string | null;
  establecimiento: { nombre: string };
  historia: {
    medico: { nombres: string; apellidos: string };
  };
  paciente: {
    id: number;
    nombres: string;
    apellidos: string;
    numeroExpediente: string;
    dni: string;
    fechaNacimiento: string;
  };
  detalles: {
    id: number;
    dosis: string;
    frecuencia: string;
    duracion: string;
    cantidad: number;
    cantidadEntregada: number;
    indicaciones: string | null;
    medicamento: {
      codigo: string | null;
      nombreGenerico: string;
      nombreComercial: string | null;
      presentacion: string;
      concentracion: string;
    };
  }[];
  dispensaciones: {
    id: number;
    fecha: string;
    usuario: { nombres: string; apellidos: string };
    detalles: { cantidad: number; detalleRecetaId: number }[];
  }[];
}

@Component({
  selector: 'app-recetas-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">

      <!-- Encabezado -->
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Recetas por Paciente</h1>
          <p class="text-sm text-gray-500 mt-1">Historial completo de recetas y dispensaciones</p>
        </div>
        <div class="flex gap-2" *ngIf="recetas.length > 0">
          <button (click)="exportarExcelResumen()"
                  class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm active:scale-95">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 014-4h4m0 0l-4-4m4 4l-4 4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Exportar Resumen
          </button>
          <button (click)="exportarExcelDetallado()"
                  class="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm active:scale-95">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Exportar Detallado
          </button>
        </div>
      </div>

      <!-- Buscador -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 relative">
        <label class="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Buscar Paciente</label>
        <div class="flex gap-3">
          <div class="relative flex-1">
            <input [(ngModel)]="busqueda" (ngModelChange)="onSearchChange()" (keyup.enter)="buscarPacientes()" type="text"
                   placeholder="DNI, N° expediente o nombre del paciente..."
                   class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all" />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>

            <!-- Resultados desplegables -->
            <div *ngIf="pacientesEncontrados.length > 0 && !pacienteSeleccionado" 
                 class="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto">
              <button *ngFor="let p of pacientesEncontrados" (click)="seleccionarPaciente(p)"
                      class="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 flex items-center justify-between">
                <div>
                  <p class="text-sm font-bold text-gray-800">{{ p.nombres }} {{ p.apellidos }}</p>
                  <p class="text-xs text-gray-500">DNI: {{ p.dni }} | Exp: {{ p.numeroExpediente }}</p>
                </div>
                <svg class="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
          <button (click)="buscarPacientes()" [disabled]="!busqueda.trim() || cargando"
                  class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all active:scale-95">
            {{ (cargando && !pacienteSeleccionado) ? 'Buscando...' : 'Buscar' }}
          </button>
          <button *ngIf="recetas.length > 0 || busqueda || pacienteSeleccionado" (click)="limpiar()"
                  class="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-all">
            Limpiar
          </button>
        </div>
      </div>

      <!-- Sin búsqueda -->
      <div *ngIf="!buscado && !cargando && !pacienteSeleccionado" class="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
        <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <p class="text-gray-500 font-semibold mb-1">Busque un paciente para ver su historial</p>
        <p class="text-gray-400 text-sm">Use DNI, número de expediente o nombre</p>
      </div>

      <!-- Cargando -->
      <div *ngIf="cargando" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-3">
        <svg class="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <p class="text-sm text-gray-500 font-medium">{{ pacienteSeleccionado ? 'Cargando recetas...' : 'Buscando pacientes...' }}</p>
      </div>

      <!-- Sin resultados -->
      <div *ngIf="buscado && !cargando && recetas.length === 0 && pacienteSeleccionado"
           class="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <p class="text-gray-400 font-medium">No se encontraron recetas para este paciente</p>
      </div>

      <!-- Info del paciente (si hay resultados) -->
      <div *ngIf="paciente" class="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4 flex items-center gap-4">
        <div class="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <span class="text-white font-bold text-lg">{{ paciente.nombres.charAt(0) }}{{ paciente.apellidos.charAt(0) }}</span>
        </div>
        <div class="flex-1">
          <p class="font-bold text-blue-800 text-base">{{ paciente.nombres }} {{ paciente.apellidos }}</p>
          <div class="flex gap-4 mt-0.5">
            <span class="text-xs text-blue-600 font-medium">Exp: {{ paciente.numeroExpediente || '—' }}</span>
            <span class="text-xs text-blue-600 font-medium">DNI: {{ paciente.dni || '—' }}</span>
            <span class="text-xs text-blue-600 font-medium">Nacimiento: {{ formatFecha(paciente.fechaNacimiento) }}</span>
          </div>
        </div>
        <div class="text-right flex-shrink-0" *ngIf="recetas.length > 0">
          <p class="text-xs font-bold text-blue-500 uppercase tracking-wide">Total Recetas</p>
          <p class="text-3xl font-black text-blue-800">{{ recetas.length }}</p>
        </div>
      </div>

      <!-- Tarjetas de resumen -->
      <div *ngIf="recetas.length > 0" class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <div *ngFor="let est of estadosResumen" class="bg-white rounded-xl border shadow-sm p-3 text-center"
             [ngClass]="est.border">
          <p class="text-xs font-bold uppercase tracking-wide mb-1" [ngClass]="est.color">{{ est.label }}</p>
          <p class="text-2xl font-black" [ngClass]="est.color">{{ est.count }}</p>
        </div>
      </div>

      <!-- Lista de Recetas -->
      <div *ngIf="recetas.length > 0" class="space-y-4">
        <div *ngFor="let receta of recetas"
             class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          <!-- Cabecera receta -->
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 bg-gray-50/50">
            <div class="flex items-center gap-3">
              <span class="text-xs font-mono text-gray-400">#{{ receta.id }}</span>
              <span class="text-sm font-bold text-gray-700">{{ formatFecha(receta.creadaEn) }}</span>
              <span *ngIf="receta.establecimiento" class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                {{ receta.establecimiento.nombre }}
              </span>
              <span *ngIf="receta.dispensadaEn" class="text-xs text-gray-400">
                → Dispensada: {{ formatFecha(receta.dispensadaEn) }}
              </span>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-bold"
                  [ngClass]="badgeEstado(receta.estado)">
              {{ etiquetaEstado(receta.estado) }}
            </span>
          </div>

          <!-- Medicamentos prescritos -->
          <div class="px-5 py-4">
            <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Medicamentos Prescritos</p>
            <div class="space-y-2">
              <div *ngFor="let det of receta.detalles"
                   class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-gray-800 truncate">{{ det.medicamento.nombreGenerico }}</p>
                  <p class="text-xs text-gray-500">
                    {{ det.medicamento.presentacion }} · {{ det.medicamento.concentracion }} ·
                    {{ det.dosis }} cada {{ det.frecuencia }} por {{ det.duracion }}
                  </p>
                  <p *ngIf="det.indicaciones" class="text-xs text-blue-600 mt-0.5 italic">{{ det.indicaciones }}</p>
                </div>
                <div class="text-right flex-shrink-0 ml-4">
                  <p class="text-xs text-gray-500">Entregado / Recetado</p>
                  <p class="text-base font-black"
                     [ngClass]="det.cantidadEntregada >= det.cantidad ? 'text-green-600' : det.cantidadEntregada > 0 ? 'text-amber-600' : 'text-gray-700'">
                    {{ det.cantidadEntregada }} / {{ det.cantidad }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Dispensaciones -->
          <div *ngIf="receta.dispensaciones.length > 0" class="border-t border-gray-50 px-5 py-3">
            <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              Entregas ({{ receta.dispensaciones.length }})
            </p>
            <div class="space-y-1.5">
              <div *ngFor="let disp of receta.dispensaciones"
                   class="flex items-center justify-between text-xs py-1.5 px-3 bg-green-50 rounded-lg border border-green-100">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center">
                    <span class="text-green-800 text-[9px] font-bold">
                      {{ disp.usuario.nombres.charAt(0) }}{{ disp.usuario.apellidos.charAt(0) }}
                    </span>
                  </div>
                  <span class="font-medium text-green-800">
                    {{ disp.usuario.nombres }} {{ disp.usuario.apellidos }}
                  </span>
                </div>
                <span class="text-green-600 font-semibold">{{ formatFecha(disp.fecha) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RecetasPacienteComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private pacientesService = inject(PacientesService);
  private base = `${environment.apiUrl}/dispensacion`;

  busqueda = '';
  cargando = false;
  buscado = false;
  recetas: RecetaHistorial[] = [];
  paciente: RecetaHistorial['paciente'] | null = null;
  pacientesEncontrados: any[] = [];
  pacienteSeleccionado = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  get estadosResumen() {
    const estados = [
      { key: 'DISPENSADA',          label: 'Dispensadas',  color: 'text-green-600',  border: 'border-green-100' },
      { key: 'PENDIENTE',           label: 'Pendientes',   color: 'text-blue-600',   border: 'border-blue-100'  },
      { key: 'PARCIAL',             label: 'Parciales',    color: 'text-amber-600',  border: 'border-amber-100' },
      { key: 'CANCELADA',           label: 'Canceladas',   color: 'text-red-500',    border: 'border-red-100'   },
      { key: 'DEMANDA_INSATISFECHA',label: 'Sin Stock',    color: 'text-gray-500',   border: 'border-gray-100'  },
    ];
    return estados.map(e => ({ ...e, count: this.recetas.filter(r => r.estado === e.key).length }));
  }

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.trim().length < 3) {
          this.pacientesEncontrados = [];
          return of(null);
        }
        this.cargando = true;
        return this.pacientesService.buscar(term.trim());
      }),
      takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      this.cargando = false;
      if (res) {
        this.pacientesEncontrados = res.data?.data || [];
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange() {
    this.pacienteSeleccionado = false;
    this.searchSubject.next(this.busqueda);
  }

  buscarPacientes() {
    if (!this.busqueda.trim()) return;
    this.cargando = true;
    this.pacientesService.buscar(this.busqueda.trim()).subscribe({
      next: (res: any) => {
        this.pacientesEncontrados = res.data?.data || [];
        this.cargando = false;
        if (this.pacientesEncontrados.length === 1) {
          this.seleccionarPaciente(this.pacientesEncontrados[0]);
        }
      },
      error: () => { this.cargando = false; }
    });
  }

  seleccionarPaciente(paciente: any) {
    this.pacienteSeleccionado = true;
    this.paciente = paciente;
    this.pacientesEncontrados = [];
    this.busqueda = `${paciente.nombres} ${paciente.apellidos}`;
    this.obtenerHistorial(paciente.dni);
  }

  obtenerHistorial(dni: string) {
    this.cargando = true;
    this.buscado = true;
    this.recetas = [];

    this.http.get<any>(`${this.base}/historial-paciente`, { params: { identificador: dni } })
      .pipe(map(r => r.data ?? r))
      .subscribe({
        next: (data: RecetaHistorial[]) => {
          this.recetas = data;
          this.cargando = false;
        },
        error: () => { this.cargando = false; }
      });
  }

  limpiar() {
    this.busqueda = '';
    this.recetas = [];
    this.paciente = null;
    this.buscado = false;
    this.pacientesEncontrados = [];
    this.pacienteSeleccionado = false;
  }

  formatFecha(fechaISO: string | null): string {
    if (!fechaISO) return '—';
    const utc = new Date(fechaISO);
    const local = new Date(utc.getTime() - 6 * 60 * 60 * 1000);
    return `${String(local.getUTCDate()).padStart(2,'0')}/${String(local.getUTCMonth()+1).padStart(2,'0')}/${local.getUTCFullYear()} ${String(local.getUTCHours()).padStart(2,'0')}:${String(local.getUTCMinutes()).padStart(2,'0')}`;
  }

  badgeEstado(estado: string): string {
    const map: Record<string, string> = {
      DISPENSADA:           'bg-green-100 text-green-700',
      PENDIENTE:            'bg-blue-100 text-blue-700',
      PARCIAL:              'bg-amber-100 text-amber-700',
      CANCELADA:            'bg-red-100 text-red-700',
      DEMANDA_INSATISFECHA: 'bg-gray-100 text-gray-600',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-600';
  }

  etiquetaEstado(estado: string): string {
    const map: Record<string, string> = {
      DISPENSADA:           'Dispensada',
      PENDIENTE:            'Pendiente',
      PARCIAL:              'Parcial',
      CANCELADA:            'Cancelada',
      DEMANDA_INSATISFECHA: 'Sin Stock',
    };
    return map[estado] ?? estado;
  }

  exportarExcelResumen() {
    if (!this.paciente || this.recetas.length === 0) return;

    const ahora = new Date();
    const fechaReporte = `${String(ahora.getDate()).padStart(2,'0')}/${String(ahora.getMonth()+1).padStart(2,'0')}/${ahora.getFullYear()} ${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`;

    const filas: any[] = [];
    this.recetas.forEach(receta => {
      receta.detalles.forEach(det => {
        const ultimaDispensacion = receta.dispensaciones[0];
        filas.push({
          'Receta #': receta.id,
          'Estado': this.etiquetaEstado(receta.estado),
          'Fecha Receta': this.formatFecha(receta.creadaEn),
          'Medicamento': det.medicamento.nombreGenerico,
          'Presentación': det.medicamento.presentacion,
          'Concentración': det.medicamento.concentracion,
          'Dosis': det.dosis,
          'Frecuencia': det.frecuencia,
          'Duración': det.duracion,
          'Cantidad Recetada': det.cantidad,
          'Cantidad Entregada': det.cantidadEntregada,
          'Dispensado por': ultimaDispensacion ? `${ultimaDispensacion.usuario?.nombres} ${ultimaDispensacion.usuario?.apellidos}` : '—',
          'Fecha Entrega': ultimaDispensacion ? this.formatFecha(ultimaDispensacion.fecha) : '—',
          'Establecimiento': receta.establecimiento?.nombre || '—'
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = {};

    XLSX.utils.sheet_add_aoa(ws, [
      [`Historial de Recetas (Resumen) - ${this.paciente.nombres} ${this.paciente.apellidos}`],
      [`Exp: ${this.paciente.numeroExpediente || '—'} | DNI: ${this.paciente.dni || '—'}`],
      [`Generado: ${fechaReporte} | Total recetas: ${this.recetas.length}`],
      [],
    ], { origin: 'A1' });

    XLSX.utils.sheet_add_json(ws, filas, { origin: 'A5' });

    ws['!cols'] = [
      { wch: 9 }, { wch: 14 }, { wch: 18 }, { wch: 28 }, { wch: 16 },
      { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 14 },
      { wch: 14 }, { wch: 26 }, { wch: 18 }, { wch: 25 },
    ];

    const nombreArchivo = `resumen_recetas_${this.paciente.numeroExpediente || this.paciente.dni || 'paciente'}.xlsx`;
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
    XLSX.writeFile(wb, nombreArchivo);
  }

  exportarExcelDetallado() {
    if (!this.paciente || this.recetas.length === 0) return;

    const ahora = new Date();
    const fechaReporte = `${String(ahora.getDate()).padStart(2,'0')}/${String(ahora.getMonth()+1).padStart(2,'0')}/${ahora.getFullYear()} ${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`;

    const filas: any[] = [];
    this.recetas.forEach(receta => {
      receta.detalles.forEach(det => {
        // Buscar todas las dispensaciones que incluyen este medicamento
        const entregasDeEsteMedicamento = receta.dispensaciones.filter(disp => 
          disp.detalles.some(d => d.detalleRecetaId === det.id)
        );

        if (entregasDeEsteMedicamento.length === 0) {
          // No dispensado
          filas.push({
            'Código': det.medicamento.codigo || '—',
            'Medicamento': det.medicamento.nombreGenerico,
            'Fecha Prescripción': this.formatFecha(receta.creadaEn),
            'Médico': `${receta.historia.medico.nombres} ${receta.historia.medico.apellidos}`,
            'Cant. Prescrita': det.cantidad,
            'Fecha Dispensación': '—',
            'Usuario Dispensó': '—',
            'Cant. Dispensada': 0,
            'Establecimiento': receta.establecimiento?.nombre || '—',
            'Estado': 'No Dispensado'
          });
        } else {
          // Una fila por cada evento de dispensación
          entregasDeEsteMedicamento.forEach(disp => {
            const detalleDisp = disp.detalles.find(d => d.detalleRecetaId === det.id);
            filas.push({
              'Código': det.medicamento.codigo || '—',
              'Medicamento': det.medicamento.nombreGenerico,
              'Fecha Prescripción': this.formatFecha(receta.creadaEn),
              'Médico': `${receta.historia.medico.nombres} ${receta.historia.medico.apellidos}`,
              'Cant. Prescrita': det.cantidad,
              'Fecha Dispensación': this.formatFecha(disp.fecha),
              'Usuario Dispensó': `${disp.usuario?.nombres} ${disp.usuario?.apellidos}`,
              'Cant. Dispensada': detalleDisp?.cantidad || 0,
              'Establecimiento': receta.establecimiento?.nombre || '—',
              'Estado': 'Dispensado'
            });
          });

          // Si hay una parte pendiente, podríamos agregarla también
          if (det.cantidadEntregada < det.cantidad) {
            filas.push({
              'Código': det.medicamento.codigo || '—',
              'Medicamento': det.medicamento.nombreGenerico,
              'Fecha Prescripción': this.formatFecha(receta.creadaEn),
              'Médico': `${receta.historia.medico.nombres} ${receta.historia.medico.apellidos}`,
              'Cant. Prescrita': det.cantidad,
              'Fecha Dispensación': '—',
              'Usuario Dispensó': '—',
              'Cant. Dispensada': 0,
              'Establecimiento': receta.establecimiento?.nombre || '—',
              'Estado': 'Pendiente'
            });
          }
        }
      });
    });

    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = {};

    XLSX.utils.sheet_add_aoa(ws, [
      [`Reporte Detallado de Medicamentos - ${this.paciente.nombres} ${this.paciente.apellidos}`],
      [`Exp: ${this.paciente.numeroExpediente || '—'} | DNI: ${this.paciente.dni || '—'}`],
      [`Generado: ${fechaReporte} | Historial completo`],
      [],
    ], { origin: 'A1' });

    XLSX.utils.sheet_add_json(ws, filas, { origin: 'A5' });

    ws['!cols'] = [
      { wch: 15 }, { wch: 35 }, { wch: 20 }, { wch: 25 }, { wch: 15 },
      { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 15 }
    ];

    const nombreArchivo = `detallado_medicamentos_${this.paciente.numeroExpediente || this.paciente.dni || 'paciente'}.xlsx`;
    XLSX.utils.book_append_sheet(wb, ws, 'Detallado');
    XLSX.writeFile(wb, nombreArchivo);
  }
}
