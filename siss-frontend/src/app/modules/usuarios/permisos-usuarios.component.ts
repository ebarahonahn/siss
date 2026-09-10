import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, UsuarioResumen } from '../../core/services/usuarios.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-permisos-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 p-4 md:p-8">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-black text-slate-900 mb-2">Permisos por Usuario</h1>
        <p class="text-slate-500 mb-8">Gestione el acceso a cada reporte individual del sistema.</p>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
          <!-- Lista de Usuarios -->
          <div class="md:col-span-4 space-y-4">
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
              <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" [(ngModel)]="busqueda" (ngModelChange)="buscar()" placeholder="Buscar usuario..." class="w-full bg-transparent border-none focus:ring-0 text-sm font-medium">
            </div>
            
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 h-[650px] overflow-y-auto">
              <div *ngFor="let u of usuarios()" (click)="seleccionar(u)" [class.bg-blue-50]="seleccionado()?.id === u.id" class="p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                  {{ u.nombres.charAt(0) }}{{ u.apellidos.charAt(0) }}
                </div>
                <div class="min-w-0">
                  <p class="font-bold text-slate-800 text-sm truncate">{{ u.nombres }} {{ u.apellidos }}</p>
                  <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{{ u.rol.nombre }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel de Control Granular -->
          <div class="md:col-span-8">
            <div *ngIf="!seleccionado()" class="bg-white rounded-3xl p-16 border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center opacity-50">
              <p class="font-black text-slate-400 uppercase tracking-widest text-sm">Seleccione un usuario para configurar accesos</p>
            </div>

            <div *ngIf="seleccionado()" class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <!-- Header -->
              <div class="p-6 bg-slate-900 text-white">
                <h2 class="text-2xl font-black">{{ seleccionado()?.nombres }} {{ seleccionado()?.apellidos }}</h2>
                <p class="text-blue-400 text-sm font-bold">{{ seleccionado()?.rol?.nombre }}</p>
              </div>

              <!-- Reportes Detallados por Categoría -->
              <div class="p-8 space-y-10">
                
                <!-- Categoría: Área Médica -->
                <section>
                  <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Área Médica</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label class="p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all" [class.border-blue-600]="tienePermiso('reportes:at-1')" [class.bg-blue-50]="tienePermiso('reportes:at-1')" [class.border-slate-50]="!tienePermiso('reportes:at-1')">
                      <input type="checkbox" [checked]="tienePermiso('reportes:at-1')" (change)="togglePermiso('reportes:at-1')" class="rounded border-slate-300 text-blue-600">
                      <span class="text-sm font-bold text-slate-700">AT-1 · Registro Diario de Atenciones Médicas (Excel)</span>
                    </label>
                    <div (click)="togglePermiso('reportes:productividad')" class="p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all" [class.border-blue-600]="tienePermiso('reportes:productividad')" [class.bg-blue-50]="tienePermiso('reportes:productividad')" [class.border-slate-50]="!tienePermiso('reportes:productividad')">
                      <input type="checkbox" [checked]="tienePermiso('reportes:productividad')" class="rounded border-slate-300 text-blue-600">
                      <span class="text-sm font-bold text-slate-700">Productividad Médica (XLS)</span>
                    </div>
                    <div (click)="togglePermiso('reportes:morbilidad')" class="p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all" [class.border-blue-600]="tienePermiso('reportes:morbilidad')" [class.bg-blue-50]="tienePermiso('reportes:morbilidad')" [class.border-slate-50]="!tienePermiso('reportes:morbilidad')">
                      <input type="checkbox" [checked]="tienePermiso('reportes:morbilidad')" class="rounded border-slate-300 text-blue-600">
                      <span class="text-sm font-bold text-slate-700">Perfil Morbilidad (PDF)</span>
                    </div>
                  </div>
                </section>

                <!-- Categoría: Administración -->
                <section>
                  <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Administración</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div (click)="togglePermiso('reportes:citas')" class="p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all" [class.border-purple-600]="tienePermiso('reportes:citas')" [class.bg-purple-50]="tienePermiso('reportes:citas')" [class.border-slate-50]="!tienePermiso('reportes:citas')">
                      <input type="checkbox" [checked]="tienePermiso('reportes:citas')" class="rounded border-slate-300 text-purple-600">
                      <span class="text-sm font-bold text-slate-700">Estado de Agenda (XLS)</span>
                    </div>
                    <div (click)="togglePermiso('reportes:demografia')" class="p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all" [class.border-purple-600]="tienePermiso('reportes:demografia')" [class.bg-purple-50]="tienePermiso('reportes:demografia')" [class.border-slate-50]="!tienePermiso('reportes:demografia')">
                      <input type="checkbox" [checked]="tienePermiso('reportes:demografia')" class="rounded border-slate-300 text-purple-600">
                      <span class="text-sm font-bold text-slate-700">Demografía Pacientes (XLS)</span>
                    </div>
                  </div>
                </section>

                <!-- Categoría: Insumos -->
                <section>
                  <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Insumos y Farmacia</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div (click)="togglePermiso('reportes:inventario')" class="p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all" [class.border-emerald-600]="tienePermiso('reportes:inventario')" [class.bg-emerald-50]="tienePermiso('reportes:inventario')" [class.border-slate-50]="!tienePermiso('reportes:inventario')">
                      <input type="checkbox" [checked]="tienePermiso('reportes:inventario')" class="rounded border-slate-300 text-emerald-600">
                      <span class="text-sm font-bold text-slate-700">Stock Crítico (XLS)</span>
                    </div>
                    <div (click)="togglePermiso('reportes:kardex')" class="p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all" [class.border-emerald-600]="tienePermiso('reportes:kardex')" [class.bg-emerald-50]="tienePermiso('reportes:kardex')" [class.border-slate-50]="!tienePermiso('reportes:kardex')">
                      <input type="checkbox" [checked]="tienePermiso('reportes:kardex')" class="rounded border-slate-300 text-emerald-600">
                      <span class="text-sm font-bold text-slate-700">Movimientos Kardex (XLS)</span>
                    </div>
                  </div>
                </section>

                <div class="pt-8 border-t border-slate-100 flex items-center justify-between">
                  <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reinicie sesión para activar</p>
                  <button (click)="guardar()" [disabled]="guardando()" class="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50">
                    {{ guardando() ? 'Guardando...' : 'Aplicar Cambios' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PermisosUsuariosComponent implements OnInit {
  private svc = inject(UsuariosService);
  usuarios = signal<UsuarioResumen[]>([]);
  seleccionado = signal<UsuarioResumen | null>(null);
  busqueda = '';
  permisosEdit: string[] = [];
  guardando = signal(false);

  ngOnInit() { this.buscar(); }

  buscar() {
    this.svc.listar(1, 20, this.busqueda).subscribe(res => this.usuarios.set(res.items));
  }

  seleccionar(u: UsuarioResumen) {
    this.seleccionado.set(u);
    const p = u.asignaciones?.[0]?.permisos;
    this.permisosEdit = Array.isArray(p) ? [...p] : [];
  }

  tienePermiso(slug: string): boolean {
    return this.permisosEdit.includes(slug);
  }

  togglePermiso(slug: string) {
    if (this.permisosEdit.includes(slug)) {
      this.permisosEdit = this.permisosEdit.filter(p => p !== slug);
    } else {
      this.permisosEdit.push(slug);
    }
  }

  guardar() {
    const u = this.seleccionado();
    const asigId = u?.asignaciones?.[0]?.id;
    if (!asigId) return;

    this.guardando.set(true);
    this.svc.actualizarPermisosAsignacion(asigId, this.permisosEdit)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe(() => {
        alert('Permisos actualizados.');
        this.buscar();
      });
  }
}
