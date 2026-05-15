import { Component, OnInit, inject, signal, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EpidemiologiaService } from '../../../../core/services/epidemiologia.service';
import { NotificationService } from '../../../../core/services/notification.service';
import * as L from 'leaflet';
import 'leaflet.heat';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-epidemiologia-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 p-6 lg:p-10 space-y-8 relative">
      
      <!-- Overlay de Carga -->
      <div *ngIf="cargando()" class="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
        <div class="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-slate-900 font-black uppercase tracking-widest text-xs">Cargando Inteligencia Epidemiológica...</p>
      </div>

      <!-- Modal de Gestión -->
      <div *ngIf="alertaSeleccionada()" class="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="cerrarGestion()"></div>
        <div class="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
          <div class="p-10 space-y-8">
            <div class="flex justify-between items-start">
              <div class="space-y-1">
                <span class="px-4 py-1.5 bg-red-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-red-100">Acción Requerida</span>
                <h3 class="text-3xl font-black text-slate-900 tracking-tight uppercase pt-2">Gestionar Notificación</h3>
                <p class="text-slate-500 font-medium">Paciente: {{ alertaSeleccionada().paciente.nombres }} {{ alertaSeleccionada().paciente.apellidos }}</p>
              </div>
              <button (click)="cerrarGestion()" class="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors">
                <svg class="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Código CIE-10</p>
                <p class="text-xl font-black text-slate-900">{{ alertaSeleccionada().diagnosticoCIE10 }}</p>
              </div>
              <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiempo de Alerta</p>
                <p class="text-xl font-black text-red-600">{{ calcularHoras(alertaSeleccionada().creadoEn) }}h</p>
              </div>
            </div>

            <div class="space-y-4">
              <p class="text-xs font-black text-slate-900 uppercase tracking-widest text-center">Seleccione el resultado de la gestión</p>
              <div class="grid grid-cols-1 gap-3">
                <button (click)="confirmarGestion('NOTIFICADO')" class="group p-6 bg-indigo-600 hover:bg-indigo-700 rounded-[2rem] text-left transition-all shadow-xl shadow-indigo-100 flex items-center justify-between">
                  <div>
                    <p class="text-white font-black uppercase text-sm tracking-widest">Oficializar Notificación</p>
                    <p class="text-indigo-100 text-xs mt-1">Marcar como enviado a la Secretaría de Salud</p>
                  </div>
                  <div class="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  </div>
                </button>

                <button (click)="confirmarGestion('DESCARTADO')" class="group p-6 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-[2rem] text-left transition-all flex items-center justify-between">
                  <div>
                    <p class="text-slate-900 font-black uppercase text-sm tracking-widest">Descartar Alerta</p>
                    <p class="text-slate-500 text-xs mt-1">Falsa alarma o error en el diagnóstico</p>
                  </div>
                  <div class="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-4xl font-black text-slate-900 tracking-tight uppercase">Control Epidemiológico</h1>
          <p class="text-slate-500 font-medium mt-1">Panel Analítico para Vigilancia de Salud Pública — Honduras</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="cargarDatos()" class="px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            Sincronizar Datos
          </button>
          <div class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">
            En Vivo
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div class="relative z-10">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Notificaciones</p>
            <p class="text-4xl font-black text-slate-900 tracking-tighter">{{ stats().total }}</p>
            <p class="text-[10px] font-bold text-green-500 mt-2 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
              +12% vs mes anterior
            </p>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 text-indigo-600">
            <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
        </div>

        <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alertas Inmediatas</p>
          <p class="text-4xl font-black" [class.text-red-600]="stats().alertas > 0" [class.text-slate-900]="stats().alertas === 0">
            {{ stats().alertas }}
          </p>
          <div *ngIf="stats().alertas > 0" class="mt-2 px-3 py-1 bg-red-50 text-red-600 text-[9px] font-black rounded-full inline-block uppercase tracking-tighter border border-red-100">
            Acción Requerida < 24h
          </div>
        </div>

        <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Semanas en Brote</p>
          <p class="text-4xl font-black text-amber-600 tracking-tighter">{{ stats().brotes }}</p>
          <p class="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Vigilancia Activa</p>
        </div>

        <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cobertura Geo</p>
          <p class="text-4xl font-black text-indigo-600 tracking-tighter">{{ stats().cobertura }}%</p>
          <p class="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Establecimientos Reportando</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Mapa de Calor -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-[3rem] shadow-xl border border-white overflow-hidden p-2">
            <div class="p-6 flex items-center justify-between">
              <h3 class="text-lg font-black uppercase tracking-tight text-slate-800">Mapa de Calor: Concentración de Casos</h3>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Tiempo Real</span>
              </div>
            </div>
            <div id="heatmap" class="h-[500px] w-full rounded-[2.5rem]"></div>
          </div>
        </div>

        <!-- Alertas de Tiempo -->
        <div class="space-y-6">
          <div class="bg-white rounded-[3rem] shadow-xl border border-white flex flex-col h-full max-h-[600px]">
            <div class="p-8 border-b border-slate-50">
              <h3 class="text-lg font-black uppercase tracking-tight text-red-600">Alertas Críticas (>24h)</h3>
              <p class="text-slate-400 text-xs font-medium">Notificaciones inmediatas pendientes de envío</p>
            </div>
            <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <div *ngFor="let alerta of alertas()" class="p-6 bg-red-50 rounded-[2rem] border border-red-100 group hover:scale-[1.02] transition-all">
                <div class="flex justify-between items-start mb-3">
                  <span class="px-3 py-1 bg-red-600 text-white text-[9px] font-black rounded-full uppercase tracking-widest">Inmediata</span>
                  <span class="text-[10px] font-black text-red-400 uppercase">{{ calcularHoras(alerta.creadoEn) }}h Transcurridas</span>
                </div>
                <h4 class="font-black text-slate-900 uppercase text-sm leading-tight">{{ alerta.paciente.nombres }} {{ alerta.paciente.apellidos }}</h4>
                <p class="text-red-700 text-xs font-bold mt-1">{{ alerta.diagnosticoCIE10 }}</p>
                <div class="mt-4 pt-4 border-t border-red-200/50 flex items-center justify-between">
                  <p class="text-[10px] font-bold text-slate-500">{{ alerta.historia.medico.nombres }}</p>
                  <button (click)="abrirGestion(alerta)" class="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">Gestionar</button>
                </div>
              </div>

              <div *ngIf="alertas().length === 0" class="flex flex-col items-center justify-center py-20 text-slate-300">
                <svg class="w-16 h-16 opacity-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p class="text-xs font-black uppercase tracking-widest">Sin alertas pendientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Canal Endémico y Resumen -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Canal Endémico -->
        <div class="lg:col-span-3 bg-white rounded-[3rem] shadow-xl border border-white p-10">
          <div class="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
            <div>
              <h3 class="text-2xl font-black uppercase tracking-tight text-slate-900">Canal Endémico Anual</h3>
              <p class="text-slate-400 text-sm font-medium">Comparativa de casos actuales vs. umbrales históricos</p>
            </div>
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-md bg-indigo-600"></div>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Año Actual</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-md bg-green-500/20 border border-green-200"></div>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Éxito</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-md bg-amber-500/20 border border-amber-200"></div>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alerta</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-md bg-red-500/20 border border-red-200"></div>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alarma</span>
              </div>
            </div>
          </div>
          <div class="h-[400px] w-full">
            <canvas #canalChart></canvas>
          </div>
        </div>

        <!-- Top Diagnósticos -->
        <div class="lg:col-span-1 bg-white rounded-[3rem] shadow-xl border border-white p-8">
          <h3 class="text-xl font-black uppercase tracking-tight text-slate-900 mb-8 pt-2">Top Diagnósticos</h3>
          <div class="space-y-6">
            <div *ngFor="let d of resumenDiagnosticos(); let i = index" class="flex items-center gap-4 group">
              <div class="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-xs text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                #{{ i + 1 }}
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-end mb-1">
                  <div>
                    <p class="text-xs font-black text-slate-900 uppercase leading-tight">{{ d.nombre }}</p>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ d.codigo }}</p>
                  </div>
                  <p class="text-xs font-black text-indigo-600 whitespace-nowrap">{{ d.total }} <span class="text-[9px] text-slate-400 uppercase tracking-tighter ml-0.5">casos</span></p>
                </div>
                <div class="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div class="h-full bg-indigo-500 rounded-full transition-all duration-1000" [style.width.%]="calcularPorcentajeDiagnostico(d.total)"></div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="resumenDiagnosticos().length === 0" class="flex flex-col items-center justify-center py-20 text-slate-300">
            <svg class="w-12 h-12 opacity-10 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            <p class="text-[10px] font-black uppercase tracking-widest text-center">Analizando prevalencias...</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
    
    :host ::ng-deep .custom-leaflet-popup .leaflet-popup-content-wrapper {
      border-radius: 1.5rem;
      padding: 0;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    }
    :host ::ng-deep .custom-leaflet-popup .leaflet-popup-content {
      margin: 0;
    }
    :host ::ng-deep .custom-leaflet-popup .leaflet-popup-tip {
      background: white;
    }
  `]
})
export class EpidemiologiaDashboardComponent implements OnInit, AfterViewInit {
  private epiSvc = inject(EpidemiologiaService);
  private notify = inject(NotificationService);
  private ngZone = inject(NgZone);

  @ViewChild('canalChart') canalChartRef!: ElementRef<HTMLCanvasElement>;

  cargando = signal(true);
  stats = signal({ total: 0, alertas: 0, brotes: 0, cobertura: 85 });
  alertas = signal<any[]>([]);
  alertaSeleccionada = signal<any>(null);
  resumenDiagnosticos = signal<any[]>([]);
  
  private map?: L.Map;
  private heatLayer?: any;
  private chart?: Chart;

  private rawMapData: any[] = [];
  private rawChartData: any = null;

  ngOnInit() {
    this.cargarDatos();
  }

  abrirGestion(alerta: any) {
    this.alertaSeleccionada.set(alerta);
  }

  cerrarGestion() {
    this.alertaSeleccionada.set(null);
  }

  confirmarGestion(estado: string) {
    const alerta = this.alertaSeleccionada();
    if (!alerta) return;

    this.epiSvc.gestionar(alerta.id, estado).subscribe({
      next: () => {
        this.notify.success(`Alerta ${estado === 'NOTIFICADO' ? 'oficializada' : 'descartada'} con éxito`);
        this.cerrarGestion();
        this.cargarDatos(); // Recargamos para que desaparezca de la lista
      },
      error: () => this.notify.error('Error al procesar la gestión')
    });
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        try {
          this.initMap();
          this.initChart();
          
          // Si los datos llegaron antes de la inicialización, actualizamos ahora
          if (this.rawMapData.length > 0) this.updateHeatMap(this.rawMapData);
          if (this.rawChartData) this.updateChart(this.rawChartData);
          
        } catch (e) {
          console.error('Error inicializando componentes visuales:', e);
        }
      }, 1000); // Aumentamos un poco el tiempo para seguridad
    });
  }

  cargarDatos() {
    this.cargando.set(true);
    
    this.epiSvc.obtenerMapaCalor().subscribe({
      next: (data: any[]) => {
        this.rawMapData = data;
        this.ngZone.runOutsideAngular(() => this.updateHeatMap(data));
        this.stats.update(s => ({ ...s, total: data.length }));
      },
      error: (err) => this.notify.error('Error al cargar mapa de calor')
    });

    this.epiSvc.obtenerAlertas().subscribe({
      next: (data: any[]) => {
        this.alertas.set(data);
        this.stats.update(s => ({ ...s, alertas: data.length }));
      },
      error: (err) => this.notify.error('Error al cargar alertas')
    });

    this.epiSvc.obtenerCanalEndemico().subscribe({
      next: (data: any) => {
        this.rawChartData = data;
        this.ngZone.runOutsideAngular(() => this.updateChart(data));
        const brotes = (data.actual || []).filter((c: any) => {
          const h = data.historico.find((hist: any) => hist.semana === c.semana);
          return h && c.total > h.alerta;
        }).length;
        this.stats.update(s => ({ ...s, brotes }));
        this.cargando.set(false);
      },
      error: (err) => {
        this.notify.error('Error al cargar canal endémico');
        this.cargando.set(false);
      }
    });

    this.epiSvc.obtenerResumenDiagnosticos().subscribe({
      next: (data: any[]) => this.resumenDiagnosticos.set(data),
      error: (err) => this.notify.error('Error al cargar resumen de diagnósticos')
    });
  }

  calcularPorcentajeDiagnostico(total: number) {
    if (this.resumenDiagnosticos().length === 0) return 0;
    const max = Math.max(...this.resumenDiagnosticos().map(d => d.total), 1);
    return (total / max) * 100;
  }

  private initMap() {
    this.map = L.map('heatmap').setView([14.1, -87.2], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);
  }

  private updateHeatMap(data: any[]) {
    if (!this.map) return;
    
    // Limpiar capas previas
    if (this.heatLayer) this.map.removeLayer(this.heatLayer);
    if ((this as any).markerLayer) this.map.removeLayer((this as any).markerLayer);

    const heatPoints = data.map(p => [p.lat, p.lng, 0.5]);
    
    // 1. Capa de Calor
    if ((L as any).heatLayer) {
      this.heatLayer = (L as any).heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
      }).addTo(this.map);
    }

    // 2. Capa de Marcadores Interactivos
    const markers = data.map(p => {
      const fecha = new Date(p.fecha).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' });
      const colorEstado = p.estado === 'NOTIFICADO' ? '#4f46e5' : '#ef4444';
      
      const popupHtml = `
        <div class="p-4 min-w-[240px] font-sans">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-2 h-2 rounded-full" style="background-color: ${colorEstado}"></span>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">${p.estado}</span>
          </div>
          <h4 class="text-sm font-black text-slate-900 uppercase mb-1">${p.paciente}</h4>
          <p class="text-[10px] font-bold text-slate-500 mb-3 italic">EXP: ${p.expediente}</p>
          
          <div class="space-y-2 pt-3 border-t border-slate-100">
            <div>
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Diagnóstico CIE-10</p>
              <p class="text-xs font-bold text-indigo-600">${p.dx}</p>
            </div>
            <div>
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Establecimiento</p>
              <p class="text-xs font-bold text-slate-700">${p.establecimiento}</p>
            </div>
            <div>
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Fecha de Registro</p>
              <p class="text-xs font-bold text-slate-700">${fecha}</p>
            </div>
          </div>
        </div>
      `;

      return L.circleMarker([p.lat, p.lng], {
        radius: 6,
        fillColor: colorEstado,
        color: '#fff',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.4
      }).bindPopup(popupHtml, {
        className: 'custom-leaflet-popup',
        maxWidth: 300
      });
    });

    (this as any).markerLayer = L.layerGroup(markers).addTo(this.map);
  }

  private initChart() {
    const ctx = this.canalChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array.from({ length: 52 }, (_, i) => `${i + 1}`),
        datasets: [
          {
            label: 'Zona de Alarma (Rojo)',
            data: [],
            borderColor: 'transparent',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: 'origin',
            pointRadius: 0,
            tension: 0.4
          },
          {
            label: 'Zona de Alerta (Amarillo)',
            data: [],
            borderColor: 'transparent',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            fill: '-1',
            pointRadius: 0,
            tension: 0.4
          },
          {
            label: 'Zona de Seguridad (Verde)',
            data: [],
            borderColor: 'transparent',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            fill: '-1',
            pointRadius: 0,
            tension: 0.4
          },
          {
            label: 'Año Actual',
            data: [],
            borderColor: '#4f46e5',
            backgroundColor: '#4f46e5',
            borderWidth: 4,
            pointRadius: 6,
            pointBackgroundColor: '#fff',
            pointBorderWidth: 3,
            spanGaps: true,
            tension: 0.3,
            order: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { size: 14, weight: 'bold' },
            padding: 12,
            cornerRadius: 12,
            callbacks: {
              label: (context) => ` Casos: ${context.parsed.y}`
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            grid: { color: '#f1f5f9' },
            title: { display: true, text: 'Número de Casos', font: { weight: 'bold' } }
          },
          x: { 
            grid: { display: false },
            title: { display: true, text: 'Semana Epidemiológica', font: { weight: 'bold' } }
          }
        }
      }
    });
  }

  private updateChart(data: any) {
    if (!this.chart) return;

    const actualData = new Array(52).fill(null);
    (data.actual || []).forEach((c: any) => {
      actualData[c.semana - 1] = c.total;
    });

    // Zona de Seguridad (Verde) -> Hasta el promedio
    this.chart.data.datasets[2].data = data.historico.map((h: any) => h.promedio);
    // Zona de Alerta (Amarillo) -> Del promedio a la alerta
    this.chart.data.datasets[1].data = data.historico.map((h: any) => h.alerta);
    // Zona de Alarma (Rojo) -> Todo lo que exceda (simulado como un tope alto)
    this.chart.data.datasets[0].data = data.historico.map((h: any) => h.alerta * 2);
    
    this.chart.data.datasets[3].data = actualData;
    this.chart.update();
  }

  calcularHoras(fecha: string) {
    const diff = Date.now() - new Date(fecha).getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  }
}
