import { Component, Input, OnInit, Output, EventEmitter, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { HospitalizacionService, Sala, Habitacion, Cama } from '../../core/services/hospitalizacion.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-infraestructura-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
         (click)="cerrar.emit()">
      <div class="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
           (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-8 py-6 bg-white border-b border-slate-100 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-blue-600">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </span>
              <h3 class="text-xl font-bold text-slate-900">Infraestructura Hospitalaria</h3>
            </div>
            <p class="text-xs text-slate-500 font-medium">
              {{ establecimientoNombre }} / {{ servicioNombre }}
            </p>
          </div>
          <button (click)="cerrar.emit()" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Breadcrumbs / Navegación -->
        <div class="px-8 py-3 bg-slate-100/50 border-b border-slate-200 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <button (click)="nivel.set('salas')" [class.text-blue-600]="nivel() === 'salas'" class="hover:underline transition-all">Salas</button>
          
          <ng-container *ngIf="salaSeleccionada()">
            <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            <button (click)="nivel.set('habitaciones')" [class.text-blue-600]="nivel() === 'habitaciones'" class="hover:underline transition-all">{{ salaSeleccionada()?.nombre }}</button>
          </ng-container>

          <ng-container *ngIf="habitacionSeleccionada()">
            <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            <span class="text-slate-500">Pieza {{ habitacionSeleccionada()?.numero }}</span>
          </ng-container>
        </div>

        <!-- Contenido -->
        <div class="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          
          <!-- Vista de SALAS -->
          <div *ngIf="nivel() === 'salas'" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-bold text-slate-700">Listado de Salas</h4>
              <button (click)="abrirFormSala()" class="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-all">+ Nueva Sala</button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div *ngFor="let s of salas()" 
                   class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                   (click)="seleccionarSala(s)">
                <div class="flex justify-between items-start mb-3">
                  <div class="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                  </div>
                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" (click)="$event.stopPropagation()">
                    <button (click)="abrirFormSala(s)" class="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button (click)="eliminarSala(s)" class="p-1 text-slate-400 hover:text-red-600 transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
                <h5 class="font-bold text-slate-900">{{ s.nombre }}</h5>
                <p class="text-[10px] text-slate-400 font-mono mb-2">{{ s.codigo || 'SIN CÓDIGO' }}</p>
                <div class="flex items-center gap-2 mt-4">
                  <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                    {{ s._count?.habitaciones || 0 }} Piezas
                  </span>
                </div>
              </div>
            </div>

            <div *ngIf="salas().length === 0" class="py-20 text-center">
              <div class="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
              </div>
              <p class="text-slate-400 font-medium">No hay salas registradas para este servicio</p>
            </div>
          </div>

          <!-- Vista de HABITACIONES (PIEZAS) -->
          <div *ngIf="nivel() === 'habitaciones'" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button (click)="nivel.set('salas')" class="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <h4 class="text-sm font-bold text-slate-700">Piezas en {{ salaSeleccionada()?.nombre }}</h4>
              </div>
              <button (click)="abrirFormHabitacion()" class="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-all">+ Nueva Pieza</button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div *ngFor="let h of habitaciones()" 
                   class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                   (click)="seleccionarHabitacion(h)">
                <div class="flex justify-between items-start mb-3">
                  <span class="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                    {{ h.tipoHabitacion?.nombre }}
                  </span>
                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" (click)="$event.stopPropagation()">
                    <button (click)="abrirFormHabitacion(h)" class="p-1 text-slate-400 hover:text-blue-600">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button (click)="eliminarHabitacion(h)" class="p-1 text-slate-400 hover:text-red-600">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
                <h5 class="text-2xl font-black text-slate-900 mb-1">#{{ h.numero }}</h5>
                <div class="flex items-center gap-2 mt-4">
                  <span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                    {{ h._count?.camas || 0 }} Camas
                  </span>
                </div>
              </div>
            </div>

            <div *ngIf="habitaciones().length === 0" class="py-20 text-center">
               <p class="text-slate-400 font-medium">No hay piezas registradas en esta sala</p>
            </div>
          </div>

          <!-- Vista de CAMAS -->
          <div *ngIf="nivel() === 'camas'" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button (click)="nivel.set('habitaciones')" class="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <h4 class="text-sm font-bold text-slate-700">Camas en Pieza {{ habitacionSeleccionada()?.numero }}</h4>
              </div>
              <button (click)="abrirFormCama()" class="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-all">+ Nueva Cama</button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div *ngFor="let c of camas()" 
                   class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group overflow-hidden">
                
                <!-- Status bar -->
                <div class="absolute top-0 left-0 right-0 h-1" [ngClass]="{
                  'bg-emerald-500': c.estado === 'DISPONIBLE',
                  'bg-red-500': c.estado === 'OCUPADA',
                  'bg-amber-500': c.estado === 'RESERVADA',
                  'bg-slate-400': c.estado === 'MANTENIMIENTO',
                  'bg-blue-400': c.estado === 'LIMPIEZA'
                }"></div>

                <div class="flex justify-between items-start mb-2 pt-2">
                  <div class="text-[9px] font-bold px-1.5 py-0.5 rounded" [ngClass]="{
                    'bg-emerald-50 text-emerald-600': c.estado === 'DISPONIBLE',
                    'bg-red-50 text-red-600': c.estado === 'OCUPADA',
                    'bg-amber-50 text-amber-600': c.estado === 'RESERVADA',
                    'bg-slate-100 text-slate-500': c.estado === 'MANTENIMIENTO',
                    'bg-blue-50 text-blue-600': c.estado === 'LIMPIEZA'
                  }">
                    {{ c.estado }}
                  </div>
                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button (click)="abrirFormCama(c)" class="text-slate-400 hover:text-blue-600"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                    <button (click)="eliminarCama(c)" class="text-slate-400 hover:text-red-600"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                  </div>
                </div>

                <div class="flex flex-col items-center py-2">
                  <svg class="w-10 h-10 mb-2" [ngClass]="{'text-slate-200': c.estado === 'DISPONIBLE', 'text-slate-400': c.estado !== 'DISPONIBLE'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="font-black text-slate-800 tracking-tight">{{ c.codigo }}</span>
                  <span class="text-[8px] text-slate-400 font-bold uppercase mt-1">{{ c.tipoCama?.nombre }}</span>
                </div>
              </div>
            </div>

            <div *ngIf="camas().length === 0" class="py-20 text-center">
               <p class="text-slate-400 font-medium">No hay camas registradas en esta pieza</p>
            </div>
          </div>

        </div>

        <!-- Footers / Modales de Edición (Sub-capas) -->
        <div *ngIf="formAbierto()" class="absolute inset-0 z-[70] bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4" (click)="cerrarForm()">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" (click)="$event.stopPropagation()">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h4 class="font-bold text-slate-800">{{ editando() ? 'Editar' : 'Nueva' }} {{ tipoForm() }}</h4>
              <button (click)="cerrarForm()" class="text-slate-400 hover:text-slate-600"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            
            <form [formGroup]="form" class="p-6 space-y-4">
              <!-- Sala Form -->
              <ng-container *ngIf="tipoForm() === 'Sala'">
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre</label>
                  <input formControlName="nombre" type="text" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Código</label>
                  <input formControlName="codigo" type="text" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
              </ng-container>

              <!-- Habitacion Form -->
              <ng-container *ngIf="tipoForm() === 'Pieza'">
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Número</label>
                  <input formControlName="numero" type="text" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo</label>
                  <select formControlName="tipoHabitacionId" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option [value]="null">Seleccione...</option>
                    <option *ngFor="let t of tiposHabitacion()" [value]="t.id">{{ t.nombre }}</option>
                  </select>
                </div>
              </ng-container>

              <!-- Cama Form -->
              <ng-container *ngIf="tipoForm() === 'Cama'">
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Código de Cama</label>
                  <input formControlName="codigo" type="text" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de Cama</label>
                  <select formControlName="tipoCamaId" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option [value]="null">Seleccione...</option>
                    <option *ngFor="let t of tiposCama()" [value]="t.id">{{ t.nombre }}</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Estado</label>
                  <select formControlName="estado" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="DISPONIBLE">DISPONIBLE</option>
                    <option value="OCUPADA">OCUPADA</option>
                    <option value="RESERVADA">RESERVADA</option>
                    <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                    <option value="LIMPIEZA">LIMPIEZA</option>
                  </select>
                </div>
              </ng-container>

              <div class="flex justify-end gap-2 mt-6">
                <button type="button" (click)="cerrarForm()" class="px-4 py-2 text-slate-500 text-sm font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="button" (click)="guardar()" [disabled]="form.invalid || enviando()" class="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50">
                  {{ enviando() ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slide-in-from-bottom-2 { from { transform: translateY(0.5rem); } to { transform: translateY(0); } }
    .animate-in { animation: fade-in 0.3s ease-out, slide-in-from-bottom-2 0.3s ease-out; }
  `]
})
export class InfraestructuraModalComponent implements OnInit {
  @Input() establecimientoId!: number;
  @Input() establecimientoNombre!: string;
  @Input() servicioId!: number;
  @Input() servicioNombre!: string;
  @Output() cerrar = new EventEmitter<void>();

  private svc = inject(HospitalizacionService);
  private fb = inject(FormBuilder);
  private notification = inject(NotificationService);

  nivel = signal<'salas' | 'habitaciones' | 'camas'>('salas');
  salas = signal<Sala[]>([]);
  habitaciones = signal<Habitacion[]>([]);
  camas = signal<Cama[]>([]);
  
  salaSeleccionada = signal<Sala | null>(null);
  habitacionSeleccionada = signal<Habitacion | null>(null);

  tiposHabitacion = signal<any[]>([]);
  tiposCama = signal<any[]>([]);

  formAbierto = signal(false);
  tipoForm = signal<'Sala' | 'Pieza' | 'Cama'>('Sala');
  editando = signal<any>(null);
  enviando = signal(false);

  form = this.fb.group({
    // Sala
    nombre: [''],
    codigo: [''],
    // Habitacion
    numero: [''],
    tipoHabitacionId: [null as number | null],
    // Cama
    tipoCamaId: [null as number | null],
    estado: ['DISPONIBLE']
  });

  ngOnInit() {
    this.cargarSalas();
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.svc.listarTiposHabitacion().subscribe(res => this.tiposHabitacion.set(res));
    this.svc.listarTiposCama().subscribe(res => this.tiposCama.set(res));
  }

  cargarSalas() {
    this.svc.listarSalas(this.servicioId).subscribe(res => this.salas.set(res));
  }

  seleccionarSala(s: Sala) {
    this.salaSeleccionada.set(s);
    this.svc.listarHabitaciones(s.id).subscribe(res => {
      this.habitaciones.set(res);
      this.nivel.set('habitaciones');
    });
  }

  seleccionarHabitacion(h: Habitacion) {
    this.habitacionSeleccionada.set(h);
    this.svc.listarCamas(h.id).subscribe(res => {
      this.camas.set(res);
      this.nivel.set('camas');
    });
  }

  abrirFormSala(s?: Sala) {
    this.tipoForm.set('Sala');
    this.editando.set(s || null);
    this.form.reset();
    if (s) {
      this.form.patchValue({ nombre: s.nombre, codigo: s.codigo });
    }
    this.formAbierto.set(true);
  }

  abrirFormHabitacion(h?: Habitacion) {
    this.tipoForm.set('Pieza');
    this.editando.set(h || null);
    this.form.reset();
    if (h) {
      this.form.patchValue({ numero: h.numero, tipoHabitacionId: h.tipoHabitacionId });
    }
    this.formAbierto.set(true);
  }

  abrirFormCama(c?: Cama) {
    this.tipoForm.set('Cama');
    this.editando.set(c || null);
    this.form.reset();
    if (c) {
      this.form.patchValue({ codigo: c.codigo, tipoCamaId: c.tipoCamaId, estado: c.estado });
    }
    this.formAbierto.set(true);
  }

  cerrarForm() {
    this.formAbierto.set(false);
    this.editando.set(null);
  }

  guardar() {
    this.enviando.set(true);
    const val = this.form.value;
    let obs: Observable<any>;
    const isEdit = !!this.editando();
    const tForm = this.tipoForm(); // Guardamos el tipo actual antes de que cambie

    if (tForm === 'Sala') {
      const data: any = { nombre: val.nombre, codigo: val.codigo };
      if (!isEdit) data.servicioId = this.servicioId;
      obs = isEdit ? this.svc.actualizarSala(this.editando().id, data) : this.svc.crearSala(data);
    } else if (tForm === 'Pieza') {
      const data: any = { numero: val.numero, tipoHabitacionId: Number(val.tipoHabitacionId) };
      if (!isEdit) data.salaId = this.salaSeleccionada()!.id;
      obs = isEdit ? this.svc.actualizarHabitacion(this.editando().id, data) : this.svc.crearHabitacion(data);
    } else {
      const data: any = { codigo: val.codigo, tipoCamaId: Number(val.tipoCamaId), estado: val.estado };
      if (!isEdit) data.habitacionId = this.habitacionSeleccionada()!.id;
      obs = isEdit ? this.svc.actualizarCama(this.editando().id, data) : this.svc.crearCama(data);
    }

    obs.subscribe({
      next: () => {
        this.notification.success('Registro guardado');
        this.enviando.set(false);
        this.cerrarForm();
        if (tForm === 'Sala') this.cargarSalas();
        if (tForm === 'Pieza') this.seleccionarSala(this.salaSeleccionada()!);
        if (tForm === 'Cama') this.seleccionarHabitacion(this.habitacionSeleccionada()!);
      },
      error: (err) => {
        this.enviando.set(false);
        this.notification.error(err.error?.message || 'Error al guardar');
      }
    });
  }

  eliminarSala(s: Sala) {
    if (confirm(`¿Eliminar sala ${s.nombre}?`)) {
      this.svc.eliminarSala(s.id).subscribe(() => {
        this.notification.info('Sala eliminada');
        this.cargarSalas();
      });
    }
  }

  eliminarHabitacion(h: Habitacion) {
    if (confirm(`¿Eliminar pieza ${h.numero}?`)) {
      this.svc.eliminarHabitacion(h.id).subscribe(() => {
        this.notification.info('Pieza eliminada');
        this.seleccionarSala(this.salaSeleccionada()!);
      });
    }
  }

  eliminarCama(c: Cama) {
    if (confirm(`¿Eliminar cama ${c.codigo}?`)) {
      this.svc.eliminarCama(c.id).subscribe(() => {
        this.notification.info('Cama eliminada');
        this.seleccionarHabitacion(this.habitacionSeleccionada()!);
      });
    }
  }
}
