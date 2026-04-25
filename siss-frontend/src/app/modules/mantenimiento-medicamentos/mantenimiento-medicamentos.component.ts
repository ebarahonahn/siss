import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { MedicamentosService, Medicamento } from '../../core/services/medicamentos.service';
import { NotificationService } from '../../core/services/notification.service';

const VIAS = ['ORAL','INYECTABLE','TOPICA','INHALATORIA','SUBLINGUAL','RECTAL','OFTALMICA','OTICA'];

@Component({
  selector: 'app-mantenimiento-medicamentos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-5">

      <!-- Cabecera -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Catálogo de Medicamentos</h2>
          <p class="text-sm text-gray-500 mt-0.5">Gestión del catálogo de medicamentos del sistema</p>
        </div>
        <button (click)="abrirModal()"
                class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Medicamento
        </button>
      </div>

      <!-- Barra de búsqueda + filtros -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div class="relative flex-1 min-w-[240px]">
          <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="Buscar por nombre, código, grupo…"
                 (input)="busqueda$.next($any($event.target).value)"
                 class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"/>
        </div>
        <div class="text-xs text-gray-400 flex-shrink-0">
          <strong class="text-gray-700">{{ total() }}</strong> medicamentos
        </div>
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <!-- Cargando -->
        <div *ngIf="cargando()" class="p-12 text-center text-gray-400 text-sm">Cargando…</div>

        <!-- Tabla -->
        <div *ngIf="!cargando()" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Código</th>
                <th class="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre Genérico</th>
                <th class="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Presentación</th>
                <th class="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Vía</th>
                <th class="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Grupo</th>
                <th class="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr *ngFor="let m of medicamentos()"
                  class="hover:bg-gray-50 transition-colors"
                  [class.opacity-50]="!m.activo">
                <td class="px-4 py-3">
                  <span class="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{{ m.codigo }}</span>
                </td>
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900">{{ m.nombreGenerico }}</p>
                  <p *ngIf="m.nombreComercial" class="text-xs text-gray-400">{{ m.nombreComercial }}</p>
                </td>
                <td class="px-4 py-3 hidden md:table-cell">
                  <p class="text-gray-600">{{ m.presentacion }}</p>
                  <p class="text-xs text-gray-400">{{ m.concentracion }}</p>
                </td>
                <td class="px-4 py-3 hidden lg:table-cell">
                  <span class="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">{{ m.via }}</span>
                </td>
                <td class="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">{{ m.grupoTerapeutico }}</td>
                <td class="px-4 py-3">
                  <div class="flex flex-col gap-1">
                    <span [ngClass]="m.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                          class="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit">
                      {{ m.activo ? 'ACTIVO' : 'INACTIVO' }}
                    </span>
                    <span *ngIf="m.esControlado"
                          class="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full w-fit">CONTROLADO</span>
                    <span *ngIf="!m.requiereReceta"
                          class="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full w-fit">SIN RECETA</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2 justify-end">
                    <button (click)="abrirModal(m)" title="Editar"
                            class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button (click)="toggle(m)" [title]="m.activo ? 'Desactivar' : 'Activar'"
                            class="p-1.5 rounded-lg transition-colors"
                            [ngClass]="m.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="medicamentos().length === 0">
                <td colspan="7" class="px-4 py-10 text-center text-gray-400 text-sm">
                  No se encontraron medicamentos.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div *ngIf="totalPaginas() > 1"
             class="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
          <p class="text-xs text-gray-400">
            Página <strong>{{ pagina() }}</strong> de <strong>{{ totalPaginas() }}</strong>
          </p>
          <div class="flex gap-2">
            <button (click)="irPagina(pagina() - 1)" [disabled]="pagina() === 1"
                    class="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
              ← Anterior
            </button>
            <button (click)="irPagina(pagina() + 1)" [disabled]="pagina() === totalPaginas()"
                    class="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
              Siguiente →
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- ── Modal crear/editar ── -->
    <div *ngIf="modalAbierto()"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
         (click)="cerrarModal()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
           (click)="$event.stopPropagation()">

        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h3 class="font-bold text-gray-900">{{ editando() ? 'Editar Medicamento' : 'Nuevo Medicamento' }}</h3>
          <button (click)="cerrarModal()" type="button"
                  class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="overflow-y-auto flex-1 px-6 py-5">
          <form [formGroup]="form" class="space-y-4">

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Código <span class="text-red-500">*</span></label>
                <input formControlName="codigo" type="text" placeholder="MED-XXX"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400 font-mono uppercase"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre Genérico <span class="text-red-500">*</span></label>
                <input formControlName="nombreGenerico" type="text" placeholder="Ej: Amoxicilina"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400"/>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre Comercial</label>
              <input formControlName="nombreComercial" type="text" placeholder="Ej: Amoxil"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400"/>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Presentación <span class="text-red-500">*</span></label>
                <input formControlName="presentacion" type="text" placeholder="Ej: Tableta 500mg"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Concentración <span class="text-red-500">*</span></label>
                <input formControlName="concentracion" type="text" placeholder="Ej: 500mg"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400"/>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Vía de Administración <span class="text-red-500">*</span></label>
                <select formControlName="via"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400">
                  <option value="">Seleccionar…</option>
                  <option *ngFor="let v of vias" [value]="v">{{ v }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Grupo Terapéutico <span class="text-red-500">*</span></label>
                <input formControlName="grupoTerapeutico" type="text" placeholder="Ej: Antibiótico - Penicilina"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400"/>
              </div>
            </div>

            <div class="flex gap-6 pt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input formControlName="requiereReceta" type="checkbox"
                       class="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-400"/>
                <span class="text-sm text-gray-700">Requiere receta médica</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input formControlName="esControlado" type="checkbox"
                       class="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-400"/>
                <span class="text-sm text-gray-700">Medicamento controlado</span>
              </label>
            </div>

          </form>
        </div>

        <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button (click)="cerrarModal()" type="button"
                  class="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button (click)="guardar()" [disabled]="form.invalid || enviando()"
                  class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
            {{ enviando() ? 'Guardando…' : (editando() ? 'Actualizar' : 'Crear Medicamento') }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class MantenimientoMedicamentosComponent implements OnInit {
  private svc          = inject(MedicamentosService);
  private notification = inject(NotificationService);
  private fb           = inject(FormBuilder);

  medicamentos  = signal<Medicamento[]>([]);
  cargando      = signal(true);
  total         = signal(0);
  pagina        = signal(1);
  totalPaginas  = signal(1);
  modalAbierto  = signal(false);
  editando      = signal<Medicamento | null>(null);
  enviando      = signal(false);
  vias          = VIAS;

  busqueda$ = new Subject<string>();
  private terminoBusqueda = '';

  form = this.fb.group({
    codigo:           ['', Validators.required],
    nombreGenerico:   ['', Validators.required],
    nombreComercial:  [''],
    presentacion:     ['', Validators.required],
    concentracion:    ['', Validators.required],
    via:              ['', Validators.required],
    grupoTerapeutico: ['', Validators.required],
    requiereReceta:   [true],
    esControlado:     [false],
  });

  ngOnInit() {
    this.cargar();
    this.busqueda$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
    ).subscribe(q => {
      this.terminoBusqueda = q;
      this.pagina.set(1);
      this.cargar();
    });
  }

  cargar() {
    this.cargando.set(true);
    this.svc.listar(this.pagina(), 20, this.terminoBusqueda || undefined).subscribe({
      next: (res: any) => {
        const data = res.data ?? res;
        this.medicamentos.set(Array.isArray(data) ? data : (data.data ?? []));
        this.total.set(res.total ?? data.total ?? 0);
        this.totalPaginas.set(res.totalPaginas ?? data.totalPaginas ?? 1);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  irPagina(p: number) {
    if (p < 1 || p > this.totalPaginas()) return;
    this.pagina.set(p);
    this.cargar();
  }

  abrirModal(med?: Medicamento) {
    this.editando.set(med ?? null);
    if (med) {
      this.form.patchValue(med as any);
    } else {
      this.form.reset({ requiereReceta: true, esControlado: false });
    }
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
    this.editando.set(null);
    this.form.reset({ requiereReceta: true, esControlado: false });
  }

  guardar() {
    if (this.form.invalid) return;
    this.enviando.set(true);
    const data = this.form.value;
    const req = this.editando()
      ? this.svc.actualizar(this.editando()!.id, data as any)
      : this.svc.crear(data as any);

    req.subscribe({
      next: () => {
        this.notification.success(this.editando() ? 'Medicamento actualizado' : 'Medicamento creado');
        this.cerrarModal();
        this.enviando.set(false);
        this.cargar();
      },
      error: (err: any) => {
        this.enviando.set(false);
        this.notification.error(err.error?.message ?? 'Error al guardar');
      },
    });
  }

  toggle(med: Medicamento) {
    this.svc.toggleActivo(med.id).subscribe({
      next: () => {
        this.notification.info(`Medicamento ${med.activo ? 'desactivado' : 'activado'}`);
        this.cargar();
      },
      error: () => this.notification.error('Error al cambiar el estado'),
    });
  }
}
