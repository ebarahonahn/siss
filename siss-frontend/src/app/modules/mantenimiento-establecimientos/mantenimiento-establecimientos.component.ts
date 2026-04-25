import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormsModule } from '@angular/forms';
import { EstablecimientosService, Establecimiento, Servicio } from '../../core/services/establecimientos.service';
import { GeoService } from '../../core/services/geo.service';
import { ServiciosService as CatServiciosService } from '../../core/services/servicios.service';
import { NotificationService } from '../../core/services/notification.service';

const TIPOS = [
  'HOSPITAL_NACIONAL',
  'HOSPITAL_REGIONAL',
  'CENTRO_SALUD',
  'CLINICA_PERIFERICA',
  'CESAMO',
  'CESAR'
];

@Component({
  selector: 'app-mantenimiento-establecimientos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Cabecera -->
      <div class="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Mantenimiento de Establecimientos</h2>
          <p class="text-sm text-gray-500">Gestión de centros de salud y sus servicios</p>
        </div>
        <button (click)="abrirModal()"
                class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md transition-all active:scale-95">
          + Nuevo Establecimiento
        </button>
      </div>

      <!-- Buscador -->
      <div class="bg-white p-4 rounded-xl border border-gray-200">
        <input type="text" placeholder="Buscar..."
               [(ngModel)]="filtro" (ngModelChange)="filtrar()"
               [ngModelOptions]="{standalone: true}"
               class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>

      <!-- Lista -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngIf="cargando()" class="col-span-full py-10 text-center text-gray-500">
          Cargando...
        </div>

        <div *ngFor="let est of establecimientosFiltrados()"
             class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          
          <div class="flex justify-between items-start mb-3">
            <span class="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded uppercase">
              {{ est.tipo.replace('_', ' ') }}
            </span>
            <div class="flex gap-2">
              <button (click)="abrirModal(est)" class="text-gray-400 hover:text-blue-600">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button (click)="eliminar(est)" class="text-gray-400 hover:text-red-600">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>

          <h3 class="font-bold text-gray-900">{{ est.nombre }}</h3>
          <p class="text-xs text-gray-400 font-mono mb-3">{{ est.codigo }}</p>
          
          <div class="text-sm text-gray-600 space-y-1 mb-4">
            <p class="flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
              {{ est.municipio?.nombre }}, {{ est.departamento?.nombre }}
            </p>
          </div>

          <div class="mt-auto pt-3 border-t border-gray-50">
            <p class="text-[10px] font-bold text-gray-400 uppercase mb-2">Servicios ({{ est.servicios?.length || 0 }})</p>
            <div class="flex flex-wrap gap-1">
              <span *ngFor="let s of est.servicios?.slice(0, 3)" class="text-[10px] bg-gray-100 px-2 py-0.5 rounded">
                {{ s.catServicio?.nombre }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="modalAbierto()" 
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
         (click)="cerrarModal()">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
           (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 class="text-xl font-bold text-gray-900">{{ editando() ? 'Editar Establecimiento' : 'Nuevo Establecimiento' }}</h3>
            <p class="text-xs text-gray-500 mt-1">Completa la información técnica y los servicios disponibles</p>
          </div>
          <button (click)="cerrarModal()" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-8">
          <form [formGroup]="form" class="space-y-8">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <!-- Datos Generales -->
              <div class="space-y-6">
                <h4 class="text-sm font-bold text-blue-600 uppercase tracking-widest border-l-4 border-blue-500 pl-3">Información General</h4>
                
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-gray-500 ml-1">Código</label>
                    <input formControlName="codigo" type="text" placeholder="HOSP-001"
                           class="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-mono uppercase"/>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-gray-500 ml-1">Tipo</label>
                    <select formControlName="tipo" class="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                      <option value="">Seleccione…</option>
                      <option *ngFor="let t of tipos" [value]="t">{{ t.replace('_', ' ') }}</option>
                    </select>
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="text-xs font-semibold text-gray-500 ml-1">Nombre del Establecimiento</label>
                  <input formControlName="nombre" type="text" placeholder="Ej: Hospital Escuela"
                         class="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"/>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-gray-500 ml-1">Departamento</label>
                    <select formControlName="departamentoId" (change)="onDeptoChange()" 
                            class="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                      <option [value]="null">Seleccione…</option>
                      <option *ngFor="let d of departamentos()" [value]="d.id">{{ d.nombre }}</option>
                    </select>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-gray-500 ml-1">Municipio</label>
                    <select formControlName="municipioId" 
                            class="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                      <option [value]="null">Seleccione…</option>
                      <option *ngFor="let m of municipios()" [value]="m.id">{{ m.nombre }}</option>
                    </select>
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="text-xs font-semibold text-gray-500 ml-1">Teléfono de Contacto</label>
                  <input formControlName="telefono" type="text" placeholder="Ej: +504 2222-2222"
                         class="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"/>
                </div>
              </div>

              <!-- Sección de Servicios mejorada con Checkboxes -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h4 class="text-sm font-bold text-blue-600 uppercase tracking-widest border-l-4 border-blue-500 pl-3">Servicios Disponibles</h4>
                  <span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold">
                    {{ serviciosSeleccionados().length }} seleccionados
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
                  <div *ngFor="let cs of catServicios()" 
                       (click)="toggleService(cs.id)"
                       [class.border-blue-200]="isServiceSelected(cs.id)"
                       [class.bg-blue-50]="isServiceSelected(cs.id)"
                       class="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group">
                    
                    <div [class.bg-blue-500]="isServiceSelected(cs.id)"
                         [class.border-gray-200]="!isServiceSelected(cs.id)"
                         class="w-5 h-5 border-2 rounded flex items-center justify-center transition-colors">
                      <svg *ngIf="isServiceSelected(cs.id)" class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>

                    <div class="flex-1">
                      <p class="text-xs font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{{ cs.nombre }}</p>
                      <p class="text-[9px] text-gray-400 line-clamp-1">{{ cs.descripcion }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="px-8 py-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button (click)="cerrarModal()" class="px-6 py-2.5 text-gray-600 text-sm font-semibold hover:bg-gray-100 rounded-xl transition-colors">
            Cancelar
          </button>
          <button (click)="guardar()" [disabled]="form.invalid || enviando()"
                  class="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50 disabled:shadow-none">
            {{ enviando() ? 'Procesando…' : (editando() ? 'Guardar Cambios' : 'Crear Establecimiento') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class MantenimientoEstablecimientosComponent implements OnInit {
  private svc = inject(EstablecimientosService);
  private geo = inject(GeoService);
  private catServ = inject(CatServiciosService);
  private fb  = inject(FormBuilder);
  private notification = inject(NotificationService);

  establecimientos = signal<Establecimiento[]>([]);
  establecimientosFiltrados = signal<Establecimiento[]>([]);
  departamentos = signal<any[]>([]);
  municipios = signal<any[]>([]);
  catServicios = signal<any[]>([]);
  cargando = signal(true);
  modalAbierto = signal(false);
  editando = signal<Establecimiento | null>(null);
  enviando = signal(false);
  filtro = '';
  tipos = TIPOS;

  form = this.fb.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    tipo: ['', Validators.required],
    departamentoId: [null as number | null, Validators.required],
    municipioId: [null as number | null, Validators.required],
    telefono: [''],
  });

  // Mantenemos los IDs de servicios seleccionados
  serviciosSeleccionados = signal<number[]>([]);

  ngOnInit() {
    this.cargar();
    this.cargarCat();
  }


  cargar() {
    this.cargando.set(true);
    this.svc.listar().subscribe({
      next: (res) => {
        this.establecimientos.set(Array.isArray(res) ? res : []);
        this.filtrar();
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  cargarCat() {
    this.geo.listarDepartamentos().subscribe({
      next: (res) => this.departamentos.set(res || []),
      error: (err) => {
        console.error('Error cargando departamentos:', err);
        this.notification.error('No se pudo cargar el catálogo de departamentos');
      }
    });
    this.catServ.obtenerCatalogo().subscribe({
      next: (res) => this.catServicios.set(res || []),
      error: (err) => console.error('Error cargando catálogo de servicios:', err)
    });
  }

  onDeptoChange() {
    const deptoId = this.form.get('departamentoId')?.value;
    this.municipios.set([]);
    this.form.get('municipioId')?.disable();
    this.form.patchValue({ municipioId: null });
    if (deptoId && !isNaN(Number(deptoId))) {
      this.geo.listarMunicipios(Number(deptoId)).subscribe(res => {
        const list = res || [];
        this.municipios.set(list);
        if (list.length > 0) this.form.get('municipioId')?.enable();
      });
    }
  }


  toggleService(catId: number) {
    const actuales = this.serviciosSeleccionados();
    if (actuales.includes(catId)) {
      this.serviciosSeleccionados.set(actuales.filter(id => id !== catId));
    } else {
      this.serviciosSeleccionados.set([...actuales, catId]);
    }
  }

  isServiceSelected(catId: number): boolean {
    return this.serviciosSeleccionados().includes(catId);
  }

  filtrar() {
    const q = this.filtro.toLowerCase();
    this.establecimientosFiltrados.set(
      this.establecimientos().filter(e => 
        e.nombre.toLowerCase().includes(q) || e.codigo.toLowerCase().includes(q)
      )
    );
  }

  abrirModal(est?: Establecimiento) {
    this.editando.set(est ?? null);
    if (est) {
      this.form.patchValue({
        codigo: est.codigo,
        nombre: est.nombre,
        tipo: est.tipo,
        departamentoId: est.departamentoId,
        municipioId: est.municipioId,
        telefono: est.telefono,
      });
      // Cargar municipios del depto
      if (est.departamentoId) {
        this.geo.listarMunicipios(est.departamentoId).subscribe(res => {
          const list = res || [];
          this.municipios.set(list);
          if (list.length > 0) this.form.get('municipioId')?.enable();
          this.form.patchValue({ municipioId: est.municipioId });
        });
      }
      // Cargar servicios seleccionados
      this.serviciosSeleccionados.set(est.servicios?.map(s => s.catServicioId) || []);
    } else {
      this.form.reset();
      this.form.get('municipioId')?.disable();
      this.municipios.set([]);
      this.serviciosSeleccionados.set([]);
    }
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
    this.editando.set(null);
    this.form.reset();
    this.serviciosSeleccionados.set([]);
  }

  guardar() {
    if (this.form.invalid) return;
    this.enviando.set(true);
    
    // Mapeamos los servicios seleccionados al formato que espera el backend
    const data = {
      ...this.form.value,
      servicios: this.serviciosSeleccionados().map(catId => ({
        catServicioId: catId
      }))
    };

    const req = this.editando()
      ? this.svc.actualizar(this.editando()!.id, data as any)
      : this.svc.crear(data as any);

    req.subscribe({
      next: () => {
        this.notification.success(this.editando() ? 'Establecimiento actualizado' : 'Establecimiento creado');
        this.cerrarModal();
        this.enviando.set(false);
        this.cargar();
      },
      error: (err) => {
        this.enviando.set(false);
        this.notification.error(err.error?.message ?? 'Error al guardar');
      },
    });
  }

  eliminar(est: Establecimiento) {
    if (confirm(`¿Está seguro de eliminar el establecimiento ${est.nombre}?`)) {
      this.svc.eliminar(est.id).subscribe({
        next: () => {
          this.notification.info('Establecimiento eliminado');
          this.cargar();
        },
        error: () => this.notification.error('Error al eliminar'),
      });
    }
  }
}
