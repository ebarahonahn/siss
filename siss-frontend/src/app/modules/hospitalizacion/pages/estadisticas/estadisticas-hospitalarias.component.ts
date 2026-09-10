import { Component, OnInit, signal, inject, ViewChild, ElementRef, AfterViewInit, NgZone, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { HospitalizacionService } from '../../../../core/services/hospitalizacion.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-estadisticas-hospitalarias',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="stats()" class="p-8 bg-slate-50 min-h-screen animate-in">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <button (click)="regresar()" class="group p-2 hover:bg-white hover:shadow-sm rounded-2xl transition-all border border-transparent hover:border-slate-100">
             <svg class="w-6 h-6 text-slate-400 group-hover:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
             </svg>
          </button>
          <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">Indicadores Hospitalarios</h1>
            <p class="text-slate-500 font-medium">Análisis de eficiencia y ocupación del centro médico</p>
          </div>
        </div>
        
        <div class="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <button (click)="cargarEstadisticas()" class="p-3 hover:bg-slate-50 rounded-xl transition-all">
             <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
           </button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Ocupación -->
        <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div class="relative">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ocupación Actual</p>
            <h2 class="text-4xl font-black text-slate-900">{{ stats()?.indicadores?.ocupacionPorcentual }}%</h2>
            <div class="mt-4 flex items-center gap-2">
              <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-violet-500 rounded-full" [style.width.%]="stats()?.indicadores?.ocupacionPorcentual"></div>
              </div>
              <span class="text-[10px] font-bold text-slate-500">{{ stats()?.indicadores?.ingresosActivos }}/{{ stats()?.indicadores?.totalCamas }}</span>
            </div>
          </div>
        </div>

        <!-- Promedio Estadía -->
        <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div class="relative">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Promedio Estadía</p>
            <h2 class="text-4xl font-black text-slate-900">{{ stats()?.indicadores?.promedioEstadia ?? '—' }} <span *ngIf="stats()?.indicadores?.promedioEstadia != null" class="text-sm text-slate-400 font-bold">Días</span></h2>
            <p class="mt-4 text-[10px] text-slate-500 font-bold">{{ stats()?.indicadores?.totalEgresosMes ? 'DURACIÓN TRANSCURRIDA DE EGRESOS DEL MES' : 'SIN EGRESOS PARA CALCULAR' }}</p>
            <p *ngIf="stats()?.indicadores?.estadiasInvalidas" class="text-xs text-amber-700 mt-2">{{ stats()?.indicadores?.estadiasInvalidas }} egreso(s) con fechas inconsistentes excluidos del promedio.</p>
          </div>
        </div>

        <!-- Giro de Cama -->
        <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div class="relative">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Giro de Cama</p>
            <h2 class="text-4xl font-black text-slate-900">{{ stats()?.indicadores?.giroCama ?? '—' }} <span class="text-sm text-slate-400 font-bold">ROT.</span></h2>
            <p class="mt-4 text-[10px] text-slate-500 font-bold">EFICIENCIA DE USO MENSUAL</p>
          </div>
        </div>

        <!-- Egresos Totales -->
        <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div class="relative">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Egresos del Mes</p>
            <h2 class="text-4xl font-black text-slate-900">{{ stats()?.indicadores?.totalEgresosMes }}</h2>
            <p class="mt-4 text-[10px] text-slate-500 font-bold tracking-tight">TODOS LOS TIPOS DE EGRESO REGISTRADOS</p>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Ocupación Chart -->
        <div class="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 class="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
            <span class="w-2 h-6 bg-violet-500 rounded-full"></span>
            Disponibilidad de Camas
          </h3>
          <div class="aspect-square relative flex items-center justify-center">
            <canvas #ocupacionCanvas></canvas>
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span class="text-3xl font-black text-slate-900">{{ stats()?.indicadores?.ocupacionPorcentual }}%</span>
              <span class="text-[10px] font-black text-slate-400 uppercase">Ocupado</span>
            </div>
          </div>
        </div>

        <!-- Tabla de Servicios -->
        <div class="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 class="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
            <span class="w-2 h-6 bg-emerald-500 rounded-full"></span>
            Análisis por Servicio
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th class="pb-4">Servicio</th>
                  <th class="pb-4">Camas</th>
                  <th class="pb-4">Ocupadas</th>
                  <th class="pb-4 text-center">Ocupación %</th>
                  <th class="pb-4 text-right">Egresos</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr *ngFor="let s of stats()?.analisisServicios" class="group hover:bg-slate-50/50 transition-all">
                  <td class="py-4 font-bold text-slate-700 text-sm">{{ s.servicio }}</td>
                  <td class="py-4 text-sm font-medium text-slate-500">{{ s.camas }}</td>
                  <td class="py-4 text-sm font-medium text-slate-500">{{ s.ocupadas }}</td>
                  <td class="py-4">
                    <div class="flex items-center justify-center">
                      <span [class]="s.ocupacion > 80 ? 'bg-rose-50 text-rose-600' : s.ocupacion > 50 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'" 
                            class="px-2 py-1 rounded-lg text-[10px] font-black">
                        {{ s.ocupacion }}%
                      </span>
                    </div>
                  </td>
                  <td class="py-4 text-right text-sm font-bold text-slate-700">{{ s.egresos }} Egr.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: #f8fafc; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .animate-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EstadisticasHospitalariasComponent implements OnInit, AfterViewInit {
  private svc = inject(HospitalizacionService);
  private zone = inject(NgZone);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  
  stats = signal<any>(null);
  
  private _ocupacionCanvas!: ElementRef;
  @ViewChild('ocupacionCanvas') set ocupacionCanvas(content: ElementRef) {
    if (content) {
      this._ocupacionCanvas = content;
      const currentStats = this.stats();
      if (currentStats) {
        this.initChart(currentStats);
      }
    }
  }
  
  viewInitialized = false;
  chart: any;

  ngOnInit() {
    this.cargarEstadisticas();
  }

  regresar() {
    this.router.navigate(['/hospitalizacion']);
  }

  ngAfterViewInit() {
    this.viewInitialized = true;
  }

  cargarEstadisticas() {
    this.svc.obtenerEstadisticas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.stats.set(data);
          // La inicialización se disparará a través del setter de ocupacionCanvas o aquí
          if (this._ocupacionCanvas) {
            this.initChart(data);
          }
        },
        error: (err) => {
          console.error('Error al cargar estadísticas:', err);
        }
      });
  }

  initChart(data: any) {
    if (!data || !this._ocupacionCanvas?.nativeElement) return;
    
    this.zone.runOutsideAngular(() => {
      // Un pequeño retraso asegura que el elemento esté pintado en el DOM
      setTimeout(() => {
        try {
          if (this.chart) {
            this.chart.destroy();
            this.chart = null;
          }
          
          const canvas = this._ocupacionCanvas.nativeElement;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const estados = data.tendenciaOcupacion ?? [];

          this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: estados.map((e: any) => e.name),
              datasets: [{
                data: estados.map((e: any) => e.value),
                backgroundColor: ['#8b5cf6', '#e2e8f0', '#f59e0b', '#ef4444', '#3b82f6'],
                borderWidth: 0
              }]
            },
            options: {
              cutout: '85%',
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: { display: true, position: 'bottom' },
                tooltip: { enabled: true }
              }
            }
          });
        } catch (error) {
          console.error('Error initializing chart:', error);
        }
      }, 0);
    });
  }
}
