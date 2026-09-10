import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ReportesService } from '../../core/services/reportes.service';
import { UsuariosService, UsuarioResumen } from '../../core/services/usuarios.service';
import { NotificationService } from '../../core/services/notification.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-gestion-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 p-4 md:p-8">
      <div class="max-w-6xl mx-auto">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div class="flex items-center gap-2 text-slate-400 mb-2">
              <a routerLink="/reportes" class="hover:text-slate-600 transition-colors">Centro de Reportes</a>
              <span>/</span>
              <span class="text-slate-600 font-medium">Gestión & Asignación</span>
            </div>
            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Administración de Reportes</h1>
            <p class="text-slate-500 mt-1">Gestione el catálogo de reportes y asigne permisos individuales a usuarios.</p>
          </div>
          
          <div class="flex items-center gap-3">
            <button *ngIf="tabActiva === 'CATALOGO'" (click)="abrirModal()" 
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Nuevo Reporte
            </button>
          </div>
        </div>

        <!-- Pestañas (Tabs) -->
        <div class="flex border-b border-slate-200 mb-6 gap-2">
          <button (click)="cambiarTab('CATALOGO')" 
                  [class]="tabActiva === 'CATALOGO' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-800'"
                  class="pb-3 px-4 text-sm transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            Catálogo General
          </button>
          <button (click)="cambiarTab('ASIGNACION')" 
                  [class]="tabActiva === 'ASIGNACION' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-800'"
                  class="pb-3 px-4 text-sm transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            Asignación por Usuario
          </button>
        </div>

        <!-- PESTAÑA 1: CATÁLOGO DE REPORTES -->
        <div *ngIf="tabActiva === 'CATALOGO'" class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
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
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" [ngClass]="getCatClass(rep.categoria)">
                    {{ rep.categoria }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
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

        <!-- PESTAÑA 2: ASIGNACIÓN POR USUARIO -->
        <div *ngIf="tabActiva === 'ASIGNACION'" class="space-y-6">
          
          <!-- Selector de Usuario -->
          <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
            <div class="w-full md:w-1/2">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Seleccionar Usuario</label>
              <select [(ngModel)]="usuarioSeleccionadoId" (ngModelChange)="onUsuarioSeleccionadoChange()"
                      class="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-800">
                <option [ngValue]="null">-- Seleccione un usuario --</option>
                <option *ngFor="let u of usuarios()" [ngValue]="u.id">
                  {{ u.nombres }} {{ u.apellidos }} ({{ u.rol?.nombre || 'Sin Rol' }}) - {{ u.correo }}
                </option>
              </select>
            </div>

            <div *ngIf="usuarioSeleccionadoId" class="flex items-center gap-3 w-full md:w-auto justify-end">
              <button (click)="guardarAsignacionUsuario()" [disabled]="cargandoAsignacion()" 
                      class="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Guardar Asignaciones
              </button>
            </div>
          </div>

          <!-- Mensaje cuando no hay usuario seleccionado -->
          <div *ngIf="!usuarioSeleccionadoId" class="bg-white p-12 rounded-3xl border border-slate-100 text-center">
            <div class="w-16 h-16 mx-auto bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-4">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-slate-800">Seleccione un Usuario</h3>
            <p class="text-slate-400 text-sm mt-1 max-w-sm mx-auto">Elija a qué usuario desea otorgar o restringir el acceso a reportes específicos.</p>
          </div>

          <!-- Matriz de Reportes por Categoría -->
          <div *ngIf="usuarioSeleccionadoId" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div *ngFor="let cat of categoriasReportes" class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-indigo-500"></span>
                  {{ getCatTitle(cat) }}
                </h3>
                <div class="flex gap-2">
                  <button (click)="marcarCategoria(cat, true)" class="text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg">Marcar Todos</button>
                  <button (click)="marcarCategoria(cat, false)" class="text-[10px] font-bold text-slate-400 hover:bg-slate-50 px-2 py-1 rounded-lg">Desmarcar</button>
                </div>
              </div>

              <div class="space-y-3">
                <div *ngFor="let rep of getReportesPorCategoria(cat)" class="flex items-start justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-slate-50">
                  <div class="pr-3">
                    <p class="text-xs font-bold text-slate-800">{{ rep.nombre }}</p>
                    <p class="text-[10px] text-slate-400">{{ rep.descripcion }}</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" [checked]="estaReporteAsignado(rep.id)" (change)="toggleReporteAsignado(rep.id)" class="sr-only peer">
                    <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- MODAL FORMULARIO CATÁLOGO -->
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
                  <option value="VACUNACION">Vacunación</option>
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
  private usuariosSvc = inject(UsuariosService);
  private notifSvc = inject(NotificationService);
  private fb = inject(FormBuilder);

  tabActiva: 'CATALOGO' | 'ASIGNACION' = 'CATALOGO';
  reportes = signal<any[]>([]);
  usuarios = signal<UsuarioResumen[]>([]);
  cargando = signal(false);
  cargandoAsignacion = signal(false);
  
  mostrarModal = false;
  editandoId: number | null = null;

  usuarioSeleccionadoId: number | null = null;
  reportesAsignadosSet = new Set<number>();

  categoriasReportes: string[] = ['MEDICA', 'ADMINISTRATIVA', 'FARMACIA', 'VACUNACION'];

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
    this.cargarUsuarios();
  }

  cambiarTab(tab: 'CATALOGO' | 'ASIGNACION') {
    this.tabActiva = tab;
  }

  cargarReportes() {
    this.reportesSvc.obtenerReportesDisponibles().subscribe(data => {
      this.reportes.set(data);
    });
  }

  cargarUsuarios() {
    this.usuariosSvc.listar(1, 200).subscribe(res => {
      this.usuarios.set(res.items || []);
    });
  }

  onUsuarioSeleccionadoChange() {
    if (!this.usuarioSeleccionadoId) {
      this.reportesAsignadosSet.clear();
      return;
    }

    this.reportesSvc.obtenerReportesUsuario(this.usuarioSeleccionadoId).subscribe(ids => {
      this.reportesAsignadosSet = new Set(ids);
    });
  }

  estaReporteAsignado(reporteId: number): boolean {
    return this.reportesAsignadosSet.has(reporteId);
  }

  toggleReporteAsignado(reporteId: number) {
    if (this.reportesAsignadosSet.has(reporteId)) {
      this.reportesAsignadosSet.delete(reporteId);
    } else {
      this.reportesAsignadosSet.add(reporteId);
    }
  }

  marcarCategoria(categoria: string, marcar: boolean) {
    const reportesCat = this.getReportesPorCategoria(categoria);
    reportesCat.forEach(r => {
      if (marcar) {
        this.reportesAsignadosSet.add(r.id);
      } else {
        this.reportesAsignadosSet.delete(r.id);
      }
    });
  }

  guardarAsignacionUsuario() {
    if (!this.usuarioSeleccionadoId) return;
    this.cargandoAsignacion.set(true);

    const reporteIds = Array.from(this.reportesAsignadosSet);
    this.reportesSvc.asignarReportesUsuario(this.usuarioSeleccionadoId, reporteIds).subscribe({
      next: () => {
        this.notifSvc.success('Asignación de reportes guardada con éxito');
        this.cargandoAsignacion.set(false);
      },
      error: () => {
        this.notifSvc.error('Error al guardar las asignaciones');
        this.cargandoAsignacion.set(false);
      }
    });
  }

  getReportesPorCategoria(cat: string): any[] {
    return this.reportes().filter(r => r.categoria === cat);
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
      'FARMACIA': 'bg-emerald-50 text-emerald-600',
      'VACUNACION': 'bg-cyan-50 text-cyan-600'
    };
    return classes[cat] || 'bg-slate-50 text-slate-600';
  }
}

