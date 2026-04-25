import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ReportesService } from '../../core/services/reportes.service';
import { NotificationService } from '../../core/services/notification.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-gestion-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 p-4 md:p-8">
      <div class="max-w-5xl mx-auto">
        
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <div class="flex items-center gap-2 text-slate-400 mb-2">
              <a routerLink="/reportes" class="hover:text-slate-600 transition-colors">Centro de Reportes</a>
              <span>/</span>
              <span class="text-slate-600 font-medium">Gestión de Catálogo</span>
            </div>
            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Administrar Reportes</h1>
            <p class="text-slate-500 mt-1">Configure los reportes disponibles en el sistema.</p>
          </div>
          
          <button (click)="abrirModal()" 
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Nuevo Reporte
          </button>
        </div>

        <!-- Tabla de Reportes -->
        <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                <th class="px-6 py-4">Reporte</th>
                <th class="px-6 py-4">Categoría</th>
                <th class="px-6 py-4">Tipo</th>
                <th class="px-6 py-4">Estado</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let rep of reportes()" class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="font-bold text-slate-700">{{ rep.nombre }}</div>
                  <div class="text-xs text-slate-400">{{ rep.descripcion }}</div>
                  <div class="text-[10px] font-mono text-indigo-400 mt-1">Slug: {{ rep.slug }}</div>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" [ngClass]="getCatClass(rep.categoria)">
                    {{ rep.categoria }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                    {{ rep.tipo }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <button (click)="toggleEstado(rep)" 
                    [class]="rep.activo ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 bg-slate-50'"
                    class="px-3 py-1 rounded-full text-[10px] font-bold transition-all">
                    {{ rep.activo ? 'ACTIVO' : 'INACTIVO' }}
                  </button>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <button (click)="abrirModal(rep)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button (click)="eliminar(rep.id)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL FORMULARIO -->
      <div *ngIf="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="cerrarModal()"></div>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in fade-in zoom-in duration-200">
          <div class="p-6 bg-slate-900 text-white">
            <h3 class="text-xl font-bold">{{ editandoId ? 'Editar' : 'Nuevo' }} Reporte</h3>
            <p class="text-slate-400 text-sm">Configure los detalles del reporte.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="guardar()" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Reporte</label>
                <input type="text" formControlName="nombre" class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium">
              </div>
              
              <div class="col-span-2">
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                <input type="text" formControlName="descripcion" class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                <select formControlName="categoria" class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium">
                  <option value="MEDICA">Médica</option>
                  <option value="ADMINISTRATIVA">Administración</option>
                  <option value="FARMACIA">Farmacia</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                <select formControlName="tipo" class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium">
                  <option value="EXCEL">Excel</option>
                  <option value="PDF">PDF</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Slug (ID Técnico)</label>
                <input type="text" formControlName="slug" class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Permiso</label>
                <input type="text" formControlName="permiso" placeholder="reportes:nombre" class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Orden</label>
                <input type="number" formControlName="orden" class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium">
              </div>

              <div class="flex items-center gap-3 pt-6">
                <input type="checkbox" formControlName="activo" id="chk-activo" class="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500">
                <label for="chk-activo" class="text-sm font-bold text-slate-700">Reporte Activo</label>
              </div>
            </div>

            <div class="flex gap-3 pt-6">
              <button type="button" (click)="cerrarModal()" class="flex-1 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
              <button type="submit" [disabled]="form.invalid || cargando()" class="flex-1 px-4 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50">
                {{ editandoId ? 'Actualizar' : 'Crear Reporte' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class GestionReportesComponent implements OnInit {
  private reportesSvc = inject(ReportesService);
  private notifSvc = inject(NotificationService);
  private fb = inject(FormBuilder);

  reportes = signal<any[]>([]);
  cargando = signal(false);
  mostrarModal = false;
  editandoId: number | null = null;

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    categoria: ['MEDICA', Validators.required],
    slug: ['', Validators.required],
    tipo: ['EXCEL', Validators.required],
    permiso: ['', Validators.required],
    orden: [0],
    activo: [true]
  });

  ngOnInit() {
    this.cargarReportes();
  }

  cargarReportes() {
    this.reportesSvc.obtenerReportesDisponibles().subscribe(data => {
      this.reportes.set(data);
    });
  }

  abrirModal(rep?: any) {
    this.editandoId = rep ? rep.id : null;
    if (rep) {
      this.form.patchValue(rep);
    } else {
      this.form.reset({ categoria: 'MEDICA', tipo: 'EXCEL', activo: true, orden: 0 });
    }
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.editandoId = null;
  }

  toggleEstado(rep: any) {
    this.reportesSvc.actualizarReporte(rep.id, { activo: !rep.activo }).subscribe(() => {
      this.cargarReportes();
      this.notifSvc.success(`Reporte ${!rep.activo ? 'activado' : 'desactivado'}`);
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.cargando.set(true);

    const obs = this.editandoId 
      ? this.reportesSvc.actualizarReporte(this.editandoId, this.form.value)
      : this.reportesSvc.crearReporte(this.form.value);

    obs.subscribe({
      next: () => {
        this.notifSvc.success(`Reporte ${this.editandoId ? 'actualizado' : 'creado'} con éxito`);
        this.cargarReportes();
        this.cerrarModal();
        this.cargando.set(false);
      },
      error: () => {
        this.notifSvc.error('Error al guardar el reporte');
        this.cargando.set(false);
      }
    });
  }

  eliminar(id: number) {
    if (confirm('¿Está seguro de eliminar este reporte?')) {
      this.reportesSvc.eliminarReporte(id).subscribe(() => {
        this.cargarReportes();
        this.notifSvc.success('Reporte eliminado');
      });
    }
  }

  getCatClass(cat: string): string {
    const classes: Record<string, string> = {
      'MEDICA': 'bg-blue-50 text-blue-600',
      'ADMINISTRATIVA': 'bg-purple-50 text-purple-600',
      'FARMACIA': 'bg-emerald-50 text-emerald-600'
    };
    return classes[cat] || 'bg-slate-50 text-slate-600';
  }
}
