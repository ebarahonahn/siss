import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReportesService, DashboardKPIs } from '../../core/services/reportes.service';
import { AuthService } from '../../core/services/auth.service';
import { ReportePdfService } from '../../core/services/reporte-pdf.service';
import { NotificationService } from '../../core/services/notification.service';
import { DateUtils } from '../../core/utils/date-utils';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        
        <!-- Header & Filters -->
        <div class="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div class="flex-1">
            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Centro de Reportes</h1>
            <p class="text-slate-500 mt-2">Analice el rendimiento médico, administrativo e inventarios en tiempo real.</p>
          </div>
          
          <div class="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-2">
            <div class="flex flex-col px-3 border-r border-slate-100">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rango de Fecha</label>
              <div class="flex items-center gap-2">
                <input type="date" [(ngModel)]="fechaInicio" (ngModelChange)="cargarKPIs()" 
                       [class.text-red-500]="!esFechaValida(fechaInicio)"
                       class="text-xs font-bold text-slate-700 border-none p-0 focus:ring-0 cursor-pointer">
                <span class="text-slate-300">/</span>
                <input type="date" [(ngModel)]="fechaFin" (ngModelChange)="cargarKPIs()" 
                       [class.text-red-500]="!esFechaValida(fechaFin)"
                       class="text-xs font-bold text-slate-700 border-none p-0 focus:ring-0 cursor-pointer">
              </div>
            </div>
            
            <button (click)="cargarKPIs()" [disabled]="cargando() || !esFechaValida(fechaInicio) || !esFechaValida(fechaFin)" class="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 disabled:opacity-50">
              <svg [class.animate-spin]="cargando()" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path *ngIf="!cargando()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                <path *ngIf="cargando()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>
            
            <a *ngIf="canSee('reportes:gestionar')" routerLink="gestion" class="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2.5 rounded-xl font-bold transition-all ml-2">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Administrar
            </a>
          </div>
        </div>

        <!-- Dashboard Stats (KPIs) -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10">Consultas</p>
            <h3 class="text-3xl font-black text-slate-800 relative z-10">{{ kpis()?.consultasHoy ?? '0' }}</h3>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-purple-200 transition-all group relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10">Pacientes Nuevos</p>
            <h3 class="text-3xl font-black text-slate-800 relative z-10">{{ kpis()?.pacientesNuevos ?? '0' }}</h3>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-rose-200 transition-all group relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10">Stock Crítico</p>
            <h3 class="text-3xl font-black text-slate-800 relative z-10">{{ kpis()?.stockCritico ?? '0' }}</h3>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10">Citas</p>
            <h3 class="text-3xl font-black text-blue-600 relative z-10">{{ kpis()?.citasPendientes ?? '0' }}</h3>
          </div>
        </div>

        <!-- Categorías de Reportes Dinámicas -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div *ngFor="let cat of categoriasKeys()" class="space-y-4">
            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
               <span class="w-8 h-8 rounded-lg flex items-center justify-center" [ngClass]="getCatColor(cat)">
                 <!-- Médica -->
                 <svg *ngIf="cat === 'MEDICA'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                 </svg>
                 <!-- Administrativa -->
                 <svg *ngIf="cat === 'ADMINISTRATIVA'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0a2 2 0 002-2v-3a2 2 0 00-2-2h-2a2 2 0 00-2 2v3a2 2 0 002 2z"/>
                 </svg>
                 <!-- Farmacia -->
                 <svg *ngIf="cat === 'FARMACIA'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                 </svg>
                 <!-- Vacunación -->
                 <svg *ngIf="cat === 'VACUNACION'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                 </svg>
               </span>
               {{ getCatTitle(cat) }}
            </h2>
            <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
               <div class="p-2">
                 <ng-container *ngFor="let rep of reportesPorCategoria()[cat]">
                   <button *ngIf="canSee(rep.permiso)" 
                           (click)="ejecutarReporte(rep)" 
                           class="w-full text-left p-4 hover:bg-slate-50 rounded-2xl transition-all flex items-center justify-between group border-b border-slate-50 last:border-0">
                      <div>
                        <span class="text-sm font-bold text-slate-700">{{ rep.nombre }}</span>
                        <p class="text-[10px] text-slate-400">{{ rep.descripcion }}</p>
                      </div>
                      <svg class="w-4 h-4 text-slate-300 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                   </button>
                 </ng-container>
               </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
})
export class ReportesComponent implements OnInit {
  private reportesSvc = inject(ReportesService);
  private authSvc = inject(AuthService);
  private pdfSvc = inject(ReportePdfService);
  private notifSvc = inject(NotificationService);

  kpis = signal<DashboardKPIs | null>(null);
  cargando = signal<boolean>(false);

  fechaInicio = this.getFechaLocal();
  fechaFin = new Date().toISOString().split('T')[0];

  reportesPorCategoria = signal<Record<string, any[]>>({});
  categoriasKeys = signal<string[]>([]);

  private getFechaLocal(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  }

  esFechaValida(fecha: string): boolean {
    return DateUtils.esFechaValida(fecha);
  }

  ngOnInit() {
    this.cargarKPIs();
    this.cargarReportesDisponibles();
  }

  cargarReportesDisponibles() {
    this.reportesSvc.obtenerReportesDisponibles().subscribe(reportes => {
      const grupos: Record<string, any[]> = {};
      reportes.forEach(r => {
        if (!grupos[r.categoria]) grupos[r.categoria] = [];
        grupos[r.categoria].push(r);
      });
      this.reportesPorCategoria.set(grupos);
      this.categoriasKeys.set(Object.keys(grupos));
    });
  }

  getCatTitle(cat: string): string {
    const titles: Record<string, string> = {
      'MEDICA': 'Área Médica',
      'ADMINISTRATIVA': 'Administración',
      'FARMACIA': 'Farmacia',
      'VACUNACION': 'Inmunizaciones (PAI)'
    };
    return titles[cat] || cat;
  }

  getCatColor(cat: string): string {
    const colors: Record<string, string> = {
      'MEDICA': 'bg-blue-100 text-blue-600',
      'ADMINISTRATIVA': 'bg-purple-100 text-purple-600',
      'FARMACIA': 'bg-emerald-100 text-emerald-600',
      'VACUNACION': 'bg-cyan-100 text-cyan-600'
    };
    return colors[cat] || 'bg-slate-100 text-slate-600';
  }

  ejecutarReporte(rep: any) {
    if (rep.tipo === 'EXCEL') {
      this.exportarExcel(rep.slug);
    } else if (rep.tipo === 'PDF') {
      this.exportarPDF(rep.slug);
    }
  }

  canSee(slug: string): boolean {
    return this.authSvc.tienePermiso(slug);
  }

  cargarKPIs() {
    if (!this.esFechaValida(this.fechaInicio) || !this.esFechaValida(this.fechaFin)) {
      return;
    }
    this.cargando.set(true);
    const usuario = this.authSvc.obtenerUsuario();
    const estId = usuario?.rol === 'ADMIN_ESTABLECIMIENTO' ? usuario.establecimientoId : undefined;
    
    this.reportesSvc.getDashboardKPIs(estId, this.fechaInicio, this.fechaFin)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (data) => this.kpis.set(data),
        error: (err) => console.error('Error al cargar KPIs:', err)
      });
  }

  exportarExcel(tipo: string) {
    if (!this.esFechaValida(this.fechaInicio) || !this.esFechaValida(this.fechaFin)) {
      this.notifSvc.warn('Rango de fechas inválido');
      return;
    }
    this.cargando.set(true);
    const usuario = this.authSvc.obtenerUsuario();
    const estId = usuario?.rol === 'ADMIN_ESTABLECIMIENTO' ? usuario.establecimientoId : undefined;
    
    this.reportesSvc.descargarExcel(tipo, this.fechaInicio, this.fechaFin, estId)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `reporte-${tipo}-${new Date().toISOString().split('T')[0]}.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        },
        error: (err) => {
          console.error('Error al exportar excel:', err);
          this.notifSvc.error('Error al generar el reporte. Token inválido o sesión expirada.');
        }
      });
  }

  exportarPDF(tipo: string) {
    if (!this.esFechaValida(this.fechaInicio) || !this.esFechaValida(this.fechaFin)) {
      this.notifSvc.warn('Rango de fechas inválido');
      return;
    }
    if (tipo === 'morbilidad') {
      this.cargando.set(true);
      const usuario = this.authSvc.obtenerUsuario();
      const estId = usuario?.rol === 'ADMIN_ESTABLECIMIENTO' ? usuario.establecimientoId : undefined;

      this.reportesSvc.getMorbilidad(this.fechaInicio, this.fechaFin, estId)
        .pipe(finalize(() => this.cargando.set(false)))
        .subscribe({
          next: async (data) => {
            const url = await this.pdfSvc.generarMorbilidadPdf(data, this.fechaInicio, this.fechaFin);
            window.open(url, '_blank');
          },
          error: (err) => {
            console.error('Error al generar PDF de morbilidad:', err);
            this.notifSvc.error('Error al generar el reporte de morbilidad.');
          }
        });
    } else if (tipo === 'cobertura-vacunacion') {
      this.cargando.set(true);
      const usuario = this.authSvc.obtenerUsuario();
      const estId = usuario?.rol === 'ADMIN_ESTABLECIMIENTO' ? usuario.establecimientoId : undefined;

      this.reportesSvc.getCobertura(this.fechaInicio, this.fechaFin, estId)
        .pipe(finalize(() => this.cargando.set(false)))
        .subscribe({
          next: async (data) => {
            const estInfo = usuario ? { 
              id: usuario.establecimientoId, 
              nombre: usuario.establecimientoNombre 
            } : null;
            const url = await this.pdfSvc.generarCoberturaPdf(data, this.fechaInicio, this.fechaFin, estInfo);
            window.open(url, '_blank');
          },
          error: (err) => {
            console.error('Error al generar PDF de cobertura:', err);
            this.notifSvc.error('Error al generar el reporte de cobertura.');
          }
        });
    }
  }
}
