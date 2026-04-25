import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LaboratorioService, ExamenLaboratorio } from '../../core/services/laboratorio.service';
import { EstablecimientosService } from '../../core/services/establecimientos.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-mantenimiento-laboratorio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50/50 p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">Gestión de Laboratorio</h1>
            <p class="text-gray-500 mt-1">Administre el catálogo maestro y la disponibilidad de exámenes por centro.</p>
          </div>

          <!-- Tabs -->
          <div class="inline-flex p-1 bg-gray-100 rounded-xl">
            <button (click)="tab.set('catalogo')"
                    [class.bg-white]="tab() === 'catalogo'"
                    [class.shadow-sm]="tab() === 'catalogo'"
                    [class.text-indigo-600]="tab() === 'catalogo'"
                    class="px-4 py-2 text-sm font-bold rounded-lg transition-all text-gray-500">
              Catálogo Maestro
            </button>
            <button (click)="tab.set('asignacion')"
                    [class.bg-white]="tab() === 'asignacion'"
                    [class.shadow-sm]="tab() === 'asignacion'"
                    [class.text-indigo-600]="tab() === 'asignacion'"
                    class="px-4 py-2 text-sm font-bold rounded-lg transition-all text-gray-500">
              Asignación por Centro
            </button>
          </div>
        </div>

        <!-- ════════════════════════════════════
             TAB 1: CATÁLOGO MAESTRO
        ════════════════════════════════════ -->
        <div *ngIf="tab() === 'catalogo'" class="space-y-6 animate-in fade-in duration-500">
          <!-- Filters -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-4 items-center">
            <div class="flex-1 min-w-[300px]">
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </span>
                <input type="text" [(ngModel)]="busqueda" (input)="cargarCatalogo()"
                       placeholder="Buscar por nombre o código..."
                       class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-xl text-sm transition-all outline-none"/>
              </div>
            </div>
            <select [(ngModel)]="categoria" (change)="cargarCatalogo()"
                    class="px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-xl text-sm outline-none">
              <option value="">Todas las categorías</option>
              <option *ngFor="let cat of categorias()" [value]="cat">{{ cat }}</option>
            </select>
          </div>

          <!-- Exams Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngFor="let ex of examenes()"
                 class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 group">
              <div class="flex justify-between items-start mb-3">
                <span class="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {{ ex.categoria }}
                </span>
                <span class="text-[10px] font-mono font-bold text-gray-400">{{ ex.codigo }}</span>
              </div>
              <h3 class="text-lg font-bold text-gray-800 mb-2 truncate group-hover:text-indigo-600 transition-colors">{{ ex.nombre }}</h3>
              <div class="space-y-2">
                <div class="flex gap-2">
                  <svg class="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="text-xs text-gray-500 leading-relaxed italic line-clamp-3">
                    {{ ex.indicaciones || 'Sin indicaciones especiales.' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="examenes().length === 0" class="py-20 text-center">
            <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">No se encontraron exámenes</h3>
            <p class="text-gray-500">Intente ajustar los filtros de búsqueda.</p>
          </div>
        </div>

        <!-- ════════════════════════════════════
             TAB 2: ASIGNACIÓN POR CENTRO
        ════════════════════════════════════ -->
        <div *ngIf="tab() === 'asignacion'" class="animate-in slide-in-from-right-4 duration-500">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- Selector de Centro -->
            <div class="lg:col-span-4 space-y-6 text-gray-500">
              <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <label class="block text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Seleccionar Centro</label>
                <div class="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  <button *ngFor="let est of establecimientos()"
                          (click)="seleccionarCentro(est)"
                          [class.ring-2]="centroSeleccionado()?.id === est.id"
                          [class.ring-indigo-500]="centroSeleccionado()?.id === est.id"
                          [class.bg-indigo-50]="centroSeleccionado()?.id === est.id"
                          class="w-full text-left p-4 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-indigo-100">
                    <p class="text-sm font-bold text-gray-800" [class.text-indigo-700]="centroSeleccionado()?.id === est.id">{{ est.nombre }}</p>
                    <p class="text-[10px] text-gray-400 mt-1 uppercase">{{ est.codigo }} — {{ est.tipo }}</p>
                  </button>
                </div>
              </div>
            </div>

            <!-- Panel de Asignación -->
            <div class="lg:col-span-8">
              <div *ngIf="!centroSeleccionado()" class="h-full flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-gray-200">
                <svg class="w-16 h-16 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <p class="text-gray-400 font-medium italic">Seleccione un centro asistencial para ver su oferta de exámenes.</p>
              </div>

              <div *ngIf="centroSeleccionado()" class="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
                <div class="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    <h3 class="text-xl font-bold text-gray-800">{{ centroSeleccionado()?.nombre }}</h3>
                    <p class="text-sm text-gray-500">Marque los exámenes disponibles en este centro.</p>
                  </div>
                  <button (click)="guardarAsignacion()"
                          [disabled]="guardando()"
                          class="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-50">
                    {{ guardando() ? 'GUARDANDO...' : 'GUARDAR CAMBIOS' }}
                  </button>
                </div>

                <!-- Lista de Checkboxes Agrupada -->
                <div class="flex-1 overflow-y-auto p-6 max-h-[600px] custom-scrollbar">
                  <div *ngFor="let cat of categorias()" class="mb-8 last:mb-0">
                    <div class="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                      <h4 class="text-xs font-black text-indigo-400 uppercase tracking-widest">{{ cat }}</h4>
                      <button (click)="marcarTodaCategoria(cat, true)" class="text-[10px] font-bold text-gray-400 hover:text-indigo-500">Marcar todos</button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label *ngFor="let ex of filtrarPorCat(cat)"
                             class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-50 cursor-pointer transition-all group">
                        <input type="checkbox"
                               [checked]="estaAsignado(ex.id)"
                               (change)="toggleExamen(ex.id)"
                               class="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                        <div class="min-w-0">
                          <p class="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{{ ex.nombre }}</p>
                          <p class="text-[10px] text-gray-400 font-mono">{{ ex.codigo }}</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
  `]
})
export class MantenimientoLaboratorioComponent implements OnInit {
  private labSvc = inject(LaboratorioService);
  private estSvc = inject(EstablecimientosService);
  private notify: NotificationService = inject(NotificationService);

  tab = signal<'catalogo' | 'asignacion'>('catalogo');
  
  examenes   = signal<ExamenLaboratorio[]>([]);
  categorias = signal<string[]>([]);
  busqueda   = '';
  categoria  = '';

  establecimientos   = signal<any[]>([]);
  centroSeleccionado = signal<any | null>(null);
  examenesAsignados  = signal<Set<number>>(new Set());
  guardando          = signal(false);

  ngOnInit() {
    this.cargarCatalogo();
    this.cargarEstablecimientos();
    this.labSvc.listarCategorias().subscribe({
      next: (cats: string[]) => this.categorias.set(cats),
      error: (err: any) => console.error('Error al cargar categorías', err)
    });
  }

  cargarCatalogo() {
    this.labSvc.listarCatalogo(this.busqueda, this.categoria).subscribe((res: any) => {
      const data = res.data ?? res;
      this.examenes.set(Array.isArray(data) ? data : (data.data ?? []));
    });
  }

  cargarEstablecimientos() {
    this.estSvc.listar().subscribe({
      next: (res: any) => this.establecimientos.set(res.data ?? res),
      error: (err: any) => console.error('Error al cargar establecimientos', err)
    });
  }

  seleccionarCentro(est: any) {
    this.centroSeleccionado.set(est);
    this.examenesAsignados.set(new Set());
    this.labSvc.listarPorEstablecimiento(est.id).subscribe({
      next: (res: any) => {
        const data = res.data ?? res;
        const items = Array.isArray(data) ? data : (data.data ?? []);
        const newSet = new Set<number>();
        items.forEach((ex: any) => {
          const id = ex.id ?? ex;
          if (id) newSet.add(Number(id));
        });
        this.examenesAsignados.set(newSet);
      },
      error: (err: any) => console.error('Error al cargar exámenes del centro', err)
    });
  }

  filtrarPorCat(cat: string) {
    return this.examenes().filter(ex => ex.categoria === cat);
  }

  estaAsignado(id: any) {
    return this.examenesAsignados().has(Number(id));
  }

  toggleExamen(id: any) {
    const numId = Number(id);
    this.examenesAsignados.update(set => {
      const newSet = new Set(set);
      if (newSet.has(numId)) newSet.delete(numId);
      else newSet.add(numId);
      return newSet;
    });
  }

  marcarTodaCategoria(cat: string, valor: boolean) {
    const ids = this.filtrarPorCat(cat).map(ex => Number(ex.id));
    this.examenesAsignados.update(set => {
      const newSet = new Set(set);
      ids.forEach(id => {
        if (valor) newSet.add(id);
        else newSet.delete(id);
      });
      return newSet;
    });
  }

  guardarAsignacion() {
    const est = this.centroSeleccionado();
    if (!est) return;

    this.guardando.set(true);
    const ids = Array.from(this.examenesAsignados());
    this.labSvc.asignar(est.id, ids).subscribe({
      next: () => {
        this.notify.success(`Asignación para ${est.nombre} guardada con éxito.`);
        this.guardando.set(false);
      },
      error: (err: any) => {
        this.notify.error('Error al guardar la asignación.');
        this.guardando.set(false);
      }
    });
  }
}
