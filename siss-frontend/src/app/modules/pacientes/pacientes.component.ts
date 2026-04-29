import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { PacientesService } from '../../core/services/pacientes.service';
import { GeoService } from '../../core/services/geo.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { debounceTime, distinctUntilChanged, BehaviorSubject, switchMap } from 'rxjs';
import { DateUtils } from '../../core/utils/date-utils';
import { DateValidators } from '../../core/validators/date.validator';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-6xl mx-auto">

        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Pacientes</h1>
            <p class="text-sm text-gray-500">Gestión de expedientes y registros clínicos</p>
          </div>
          <button (click)="abrirModal()" 
                  class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            NUEVO PACIENTE
          </button>
        </div>

        <!-- Buscador -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center gap-4">
          <div class="flex-1 relative">
            <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              [placeholder]="'Buscar por nombre, DNI o número de expediente...'"
              (input)="onSearch($event)"
              type="text"
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none" />
          </div>
        </div>

        <!-- Tabla de Resultados -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="text-left px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Expediente</th>
                <th class="text-left px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Paciente / DNI</th>
                <th class="text-left px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Ubicación</th>
                <th class="text-left px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Establecimiento</th>
                <th class="text-center px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr *ngFor="let p of pacientes" class="hover:bg-blue-50/30 transition-colors">
                <td class="px-6 py-4">
                  <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded font-mono text-[11px] font-bold uppercase">{{ p.numeroExpediente }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="font-bold text-gray-900">{{ p.apellidos }}, {{ p.nombres }}</div>
                  <div class="text-[11px] text-gray-500 font-medium">{{ p.dni }} | {{ p.sexo?.nombre }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-gray-700">{{ p.municipio?.nombre }}</div>
                  <div class="text-[10px] text-gray-400 uppercase font-bold">{{ p.departamento?.nombre }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-[11px] font-bold text-blue-700 uppercase tracking-tight">{{ p.establecimiento?.nombre }}</div>
                  <div class="text-[9px] text-gray-400 uppercase font-black">Centro de Inscripción</div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button *ngIf="puedeAtender()" (click)="irAtender(p.id)"
                       class="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Atender">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </button>
                    <button *ngIf="puedeVerHistoria()" (click)="irHistoria(p.id)"
                       class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Ver Historia">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                    </button>
                    <!-- Editar: solo si el paciente es de este centro -->
                    <button *ngIf="puedeEditar(p)" (click)="editar(p)" 
                            class="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Modificar">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <!-- Indicador visual si es de otro centro -->
                    <span *ngIf="!esDeMiCentro(p)" 
                          class="px-2 py-0.5 text-[10px] font-bold bg-orange-50 text-orange-500 rounded-full border border-orange-200"
                          title="Paciente registrado en otro establecimiento">
                      Otro centro
                    </span>
                    <button *ngIf="puedeEliminar(p)" (click)="eliminar(p)" 
                            class="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Eliminar/Archivar">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="pacientes.length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-gray-400 font-medium">
                  {{ searchQuery ? 'No se encontraron resultados' : 'Realice una búsqueda para comenzar' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>

    <!-- ═══ MODAL NUEVO PACIENTE ═══════════════════════════════════════════════ -->
    <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div class="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col scale-in">
        
        <!-- Header -->
        <div class="px-8 py-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-800">{{ pacienteEnEdicion() ? 'MODIFICAR PACIENTE' : 'REGISTRAR NUEVO PACIENTE' }}</h2>
            <p class="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">SISTEMA INTEGRADO DE SALUD Y SEGURIDAD</p>
          </div>
          <button (click)="cerrarModal()" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-all">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Form Body -->
        <div class="flex-1 overflow-y-auto p-8">
          <form [formGroup]="form" id="patientForm" (ngSubmit)="guardar()" class="space-y-8">
            
            <!-- Sección 1: Identidad -->
            <div>
              <h3 class="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div class="w-1 h-4 bg-blue-600 rounded-full"></div> 1. Información de Identidad
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                <!-- DNI con Validación RNP -->
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">DNI (13 Dígitos) *</label>
                  <div class="flex gap-2">
                    <input type="text" formControlName="dni" maxlength="13"
                           class="flex-1 px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none" placeholder="0000000000000"/>
                    <button type="button" (click)="validarRNP()" [disabled]="validandoRNP() || form.get('dni')?.invalid"
                            class="px-4 py-2.5 bg-gray-800 text-white text-[10px] font-bold rounded-xl hover:bg-black transition-all disabled:opacity-30">
                      {{ validandoRNP() ? '...' : 'VALIDAR' }}
                    </button>
                  </div>
                </div>
                <!-- Nombres y Apellidos -->
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Nombres *</label>
                  <input type="text" formControlName="nombres" class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none uppercase"/>
                </div>
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Apellidos *</label>
                  <input type="text" formControlName="apellidos" class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none uppercase"/>
                </div>
                <!-- Nacimiento y Sexo -->
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha de Nacimiento *</label>
                  <input type="date" formControlName="fechaNacimiento" 
                         [class.ring-2]="form.get('fechaNacimiento')?.invalid && form.get('fechaNacimiento')?.touched"
                         [class.ring-red-500]="form.get('fechaNacimiento')?.invalid && form.get('fechaNacimiento')?.touched"
                         class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none"/>
                  <div *ngIf="form.get('fechaNacimiento')?.invalid && form.get('fechaNacimiento')?.touched" class="mt-1">
                    <p *ngIf="form.get('fechaNacimiento')?.errors?.['dateInvalid']" class="text-[10px] text-red-500 font-bold uppercase">La fecha ingresada no existe</p>
                    <p *ngIf="form.get('fechaNacimiento')?.errors?.['dateFuture']" class="text-[10px] text-red-500 font-bold uppercase">La fecha no puede ser futura</p>
                  </div>
                </div>
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Sexo *</label>
                  <select formControlName="sexoId" class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-medium">
                    <option [ngValue]="null" disabled>Seleccionar...</option>
                    <option *ngFor="let s of catalogos().sexos" [ngValue]="s.id">{{ s.nombre }}</option>
                  </select>
                </div>
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Sangre</label>
                  <select formControlName="tipoSangreId" class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-medium">
                    <option [ngValue]="null">Desconocido</option>
                    <option *ngFor="let ts of catalogos().tiposSangre" [ngValue]="ts.id">{{ ts.nombre }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Sección 2: Contacto y Ubicación -->
            <div>
              <h3 class="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div class="w-1 h-4 bg-blue-600 rounded-full"></div> 2. Contacto y Ubicación
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Teléfono</label>
                  <input type="text" formControlName="telefono" class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none"/>
                </div>
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Depto. Residencia *</label>
                  <select formControlName="departamentoId" class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-medium">
                    <option [ngValue]="null" disabled>Seleccionar depto...</option>
                    <option *ngFor="let d of departamentos()" [ngValue]="d.id">{{ d.nombre }}</option>
                  </select>
                </div>
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Municipio *</label>
                  <select formControlName="municipioId" class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-medium" 
                          [disabled]="!form.get('departamentoId')?.value">
                    <option [ngValue]="null" disabled>Seleccionar muni...</option>
                    <option *ngFor="let m of municipios()" [ngValue]="m.id">{{ m.nombre }}</option>
                  </select>
                </div>
                <div class="md:col-span-12">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Dirección Completa</label>
                  <input type="text" formControlName="direccion" class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none"/>
                </div>
              </div>
            </div>

            <!-- Sección 3: Datos Sociales -->
            <div>
              <h3 class="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div class="w-1 h-4 bg-blue-600 rounded-full"></div> 3. Otros Datos
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Estado Civil</label>
                  <select formControlName="estadoCivilId" class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-medium">
                    <option [ngValue]="null">Seleccionar...</option>
                    <option *ngFor="let ec of catalogos().estadosCiviles" [ngValue]="ec.id">{{ ec.nombre }}</option>
                  </select>
                </div>
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Ocupación</label>
                  <select formControlName="ocupacionId" class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-medium">
                    <option [ngValue]="null">Seleccionar...</option>
                    <option *ngFor="let o of catalogos().ocupaciones" [ngValue]="o.id">{{ o.nombre }}</option>
                  </select>
                </div>
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Escolaridad</label>
                  <select formControlName="escolaridadId" class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-medium">
                    <option [ngValue]="null">Seleccionar...</option>
                    <option *ngFor="let esc of catalogos().escolaridades" [ngValue]="esc.id">{{ esc.nombre }}</option>
                  </select>
                </div>
              </div>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button (click)="cerrarModal()" class="px-6 py-2.5 text-gray-500 font-bold hover:text-gray-700 transition-colors">CANCELAR</button>
          <button type="submit" form="patientForm" [disabled]="form.invalid || enviando()"
                  class="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">
            {{ enviando() ? 'GUARDANDO...' : (pacienteEnEdicion() ? 'GUARDAR CAMBIOS' : 'REGISTRAR PACIENTE') }}
          </button>
        </div>

      </div>
    </div>
  `,
  styleUrls: []
})
export class PacientesComponent {
  private service = inject(PacientesService);
  private auth    = inject(AuthService);
  private router  = inject(Router);
  private fb = inject(FormBuilder);

  pacientes: any[] = [];
  searchSubject = new BehaviorSubject<string>('');
  
  get searchQuery() { return this.searchSubject.value; }
  showModal = signal(false);
  pacienteEnEdicion = signal<any>(null);
  enviando = signal(false);
  validandoRNP = signal(false);

  departamentos = signal<any[]>([]);
  municipios = signal<any[]>([]);
  catalogos = signal<any>({
    sexos: [],
    tiposSangre: [],
    escolaridades: [],
    estadosCiviles: [],
    ocupaciones: []
  });

  form = this.fb.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^\d{13}$/)]],
    fechaNacimiento: ['', [Validators.required, DateValidators.dateReal(), DateValidators.notFuture()]],
    sexoId: [null as number | null, Validators.required],
    tipoSangreId: [null as number | null],
    telefono: [''],
    departamentoId: [null as number | null, Validators.required],
    municipioId: [null as number | null, Validators.required],
    direccion: [''],
    estadoCivilId: [null as number | null],
    ocupacionId: [null as number | null],
    escolaridadId: [null as number | null]
  });

  private notification = inject(NotificationService);

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q: string) => this.service.buscar(q)),
      )
      .subscribe((res: any) => {
        this.pacientes = res?.data?.data ?? [];
      });

    this.cat.obtenerTodos().subscribe(data => this.catalogos.set(data));
    this.geo.listarDepartamentos().subscribe((res: any) => this.departamentos.set(res));

    // Escuchar cambios en departamento para cargar municipios
    this.form.get('departamentoId')?.valueChanges.subscribe(deptoId => {
      this.form.get('municipioId')?.setValue(null);
      this.municipios.set([]);
      if (deptoId) {
        this.geo.listarMunicipios(deptoId).subscribe((res: any) => this.municipios.set(res));
      }
    });
  }

  private geo = inject(GeoService);
  private cat = inject(CatalogosService);

  onSearch(event: any) {
    this.searchSubject.next(event.target.value);
  }

  abrirModal() {
    this.pacienteEnEdicion.set(null);
    this.form.reset({
      sexoId: null,
      estadoCivilId: null,
      escolaridadId: null,
      tipoSangreId: null
    });
    this.showModal.set(true);
  }

  cerrarModal() {
    this.showModal.set(false);
    this.pacienteEnEdicion.set(null);
  }

  editar(paciente: any) {
    this.pacienteEnEdicion.set(paciente);
    
    // Si hay depto, cargar municipios primero
    if (paciente.departamentoId) {
      this.geo.listarMunicipios(paciente.departamentoId).subscribe((res: any) => {
        this.municipios.set(res);
        // Formatear fecha para el input date (YYYY-MM-DD)
        const fecha = DateUtils.getFechaISO(paciente.fechaNacimiento);
        
        this.form.patchValue({
          ...paciente,
          fechaNacimiento: fecha
        });
        this.showModal.set(true);
      });
    } else {
      this.form.patchValue(paciente);
      this.showModal.set(true);
    }
  }

  validarRNP() {
    const dni = this.form.get('dni')?.value?.trim();
    if (!dni || dni.length !== 13) {
      this.notification.warn('El DNI debe tener 13 dígitos exactos');
      return;
    }

    this.validandoRNP.set(true);
    this.service.validarDniRnp(dni).subscribe({
      next: (res) => {
        console.log('Datos RNP recibidos:', res);
        const data = res.data;
        this.validandoRNP.set(false);

        // Mapear el sexo de texto a ID del catálogo
        const sexoStr = data.sexo?.toLowerCase() === 'femenino' ? 'Femenino' : 'Masculino';
        const sexoCat = this.catalogos().sexos.find((s: any) => s.nombre === sexoStr);

        this.form.patchValue({
          nombres: data.nombres,
          apellidos: data.apellidos,
          fechaNacimiento: data.fechaNacimiento,
          sexoId: sexoCat ? sexoCat.id : null
        });
        this.notification.success('Datos obtenidos del RNP correctamente');
      },
      error: (err) => {
        console.error('Error RNP:', err);
        this.validandoRNP.set(false);
        // Si no se encuentra, limpiamos los campos para evitar confusión con datos anteriores
        this.form.patchValue({
          nombres: '',
          apellidos: '',
          fechaNacimiento: '',
          sexoId: null
        });
        const mensaje = err.error?.message || err.message || 'No se pudo conectar con el servicio RNP';
        this.notification.error(mensaje);
      }
    });
  }

  puedeEliminar(p: any): boolean {
    const rol = this.auth.obtenerUsuario()?.rol;
    const esRolPermitido = rol === 'ADMIN' || rol === 'RECEPCIONISTA' || rol === 'ADMIN_ESTABLECIMIENTO';
    return esRolPermitido && this.esDeMiCentro(p);
  }

  esDeMiCentro(p: any): boolean {
    const establecimientoId = this.auth.obtenerUsuario()?.establecimientoId;
    // p.establecimiento es un objeto {nombre} en la lista; usamos establecimientoId si viene del perfil
    // La API de buscar no devuelve p.establecimientoId directamente, así que comparamos por nombre si es necesario
    // pero el campo establecimientoId sí está disponible en el objeto paciente devuelto
    return p.establecimientoId === establecimientoId;
  }

  puedeEditar(p: any): boolean {
    const rol = this.auth.obtenerUsuario()?.rol;
    const esRolPermitido = rol === 'ADMIN' || rol === 'RECEPCIONISTA' || rol === 'MEDICO' || rol === 'ADMIN_ESTABLECIMIENTO';
    return esRolPermitido && this.esDeMiCentro(p);
  }

  irAtender(pacienteId: number) {
    this.router.navigate(['/historia-clinica/nueva'], { state: { pacienteId } });
  }

  irHistoria(pacienteId: number) {
    this.router.navigate(['/historia-clinica'], { state: { pacienteId } });
  }

  puedeAtender(): boolean {
    const rol = this.auth.obtenerUsuario()?.rol;
    return rol === 'MEDICO' || rol === 'ADMIN';
  }

  puedeVerHistoria(): boolean {
    const rol = this.auth.obtenerUsuario()?.rol;
    return rol === 'MEDICO' || rol === 'ENFERMERA' || rol === 'ADMIN';
  }

  eliminar(p: any) {
    if (confirm(`¿Está seguro de archivar el expediente de ${p.nombres} ${p.apellidos}?`)) {
      this.service.eliminar(p.id).subscribe(() => {
        this.pacientes = this.pacientes.filter(x => x.id !== p.id);
      });
    }
  }

  guardar() {
    if (this.form.valid) {
      this.enviando.set(true);
      const rawData = this.form.value;
      const data = {
        ...rawData,
        // Forzamos mediodía para evitar desplazamientos de zona horaria que cambien el día
        fechaNacimiento: rawData.fechaNacimiento ? new Date(rawData.fechaNacimiento + 'T12:00:00').toISOString() : null
      };
      
      const request = this.pacienteEnEdicion() 
        ? this.service.actualizar(this.pacienteEnEdicion().id, data)
        : this.service.crear(data);

      request.subscribe({
        next: () => {
          this.notification.success(this.pacienteEnEdicion() ? 'Paciente actualizado con éxito' : 'Paciente registrado con éxito');
          this.cerrarModal();
          this.enviando.set(false);
          this.searchSubject.next(this.searchQuery); // Recargar
        },
        error: (err) => {
          this.enviando.set(false);
          this.notification.error(err.error?.message || 'Error al guardar el paciente');
        }
      });
    }
  }
}
