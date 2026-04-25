import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CitasService } from '../../core/services/citas.service';
import { PacientesService } from '../../core/services/pacientes.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ParametrosService } from '../../core/services/parametros.service';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { DateUtils } from '../../core/utils/date-utils';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <!-- Encabezado con estadísticas rápidas -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Citas</h1>
          <p class="text-gray-500 mt-1">Control de agenda y programación de pacientes</p>
        </div>
        <button (click)="abrirModal()" 
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva Cita
        </button>
      </div>

      <!-- Filtros y Listado -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div class="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
          <h3 class="font-bold text-gray-700">Agenda para {{ hoy | date:'fullDate' }}</h3>
          <input type="date" [(ngModel)]="fechaFiltro" (change)="cargarCitas()" 
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                <th class="px-6 py-4 font-semibold">Hora</th>
                <th class="px-6 py-4 font-semibold">Paciente</th>
                <th class="px-6 py-4 font-semibold">Médico</th>
                <th class="px-6 py-4 font-semibold">Especialidad</th>
                <th class="px-6 py-4 font-semibold">Estado</th>
                <th class="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr *ngFor="let cita of citas" class="hover:bg-gray-50/50 transition-colors">
                <td class="px-6 py-4 border-l-4" [ngClass]="getEstadoClass(cita.estado)">
                  <div class="font-bold text-gray-900">{{ cita.fechaHora | date:'h:mm a':'UTC' }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="font-semibold text-gray-900">{{ cita.paciente.nombres }} {{ cita.paciente.apellidos }}</div>
                  <div class="text-xs text-gray-400">DNI: {{ cita.paciente.dni }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-800">Dr. {{ cita.medico.apellidos }}</div>
                  <div class="text-xs text-gray-400 capitalize">{{ cita.tipo.replace('_', ' ') }}</div>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700">
                    {{ cita.especialidad?.nombre || 'General' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2.5 py-1 rounded-full text-xs font-bold" [ngClass]="getStatusBadgeClass(cita.estado)">
                    {{ cita.estado }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button *ngIf="cita.estado === 'PROGRAMADA'" (click)="cancelarCita(cita.id)" 
                    class="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Cancelar Cita">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="!citas || citas.length === 0">
                <td colspan="6" class="py-12 text-center text-gray-400">
                  No hay citas programadas para esta fecha
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL NUEVA CITA -->
      <div *ngIf="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" (click)="cerrarModal()"></div>
        
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-in fade-in zoom-in duration-200">
          <div class="p-6 bg-indigo-600 sticky top-0 z-10">
            <h3 class="text-xl font-bold text-white">Programar Cita</h3>
            <p class="text-indigo-100 text-sm">Ingrese los datos para la nueva consulta</p>
          </div>

          <form [formGroup]="citaForm" (ngSubmit)="guardar()" 
                class="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
            
            <!-- Buscador de Paciente -->
            <div class="relative">
              <label class="block text-sm font-semibold text-gray-700 mb-1">Buscar Paciente (Cualquier Centro)</label>
              <div class="relative">
                <input type="text" [formControl]="searchControl" placeholder="Nombre, Apellido o DNI..."
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-10">
                <svg class="w-5 h-5 absolute right-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>

              <!-- Resultados de búsqueda -->
              <div *ngIf="pacientes && pacientes.length > 0 && !pacienteSeleccionado" 
                class="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                 <div *ngFor="let p of pacientes" (click)="seleccionarPaciente(p)"
                   class="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors">
                   <div class="font-bold text-gray-800 text-sm">{{ p.nombres }} {{ p.apellidos }}</div>
                   <div class="text-xs text-gray-500 mt-0.5">DNI: {{ p.dni }} | Exp: {{ p.numeroExpediente }}</div>
                 </div>
              </div>

              <!-- Ficha Compacta de Paciente -->
              <div *ngIf="pacienteSeleccionado" 
                class="mt-3 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 animate-in fade-in slide-in-from-top-1">
                <div class="flex justify-between items-start mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                      {{ pacienteSeleccionado.nombres[0] }}{{ pacienteSeleccionado.apellidos[0] }}
                    </div>
                    <div>
                      <h4 class="text-sm font-bold text-gray-900">{{ pacienteSeleccionado.nombres }} {{ pacienteSeleccionado.apellidos }}</h4>
                      <p class="text-[10px] text-gray-500 font-mono">{{ pacienteSeleccionado.dni }}</p>
                    </div>
                  </div>
                  <button (click)="pacienteSeleccionado = null; searchControl.setValue('')" type="button" class="text-indigo-300 hover:text-red-500 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                <div class="flex gap-4 text-[11px] border-t border-indigo-100/50 pt-2">
                  <span class="text-indigo-600 font-medium"><b>Edad:</b> {{ calcularEdad(pacienteSeleccionado.fechaNacimiento) }} años</span>
                  <span class="text-gray-500"><b>Centro:</b> {{ pacienteSeleccionado.establecimiento?.nombre || 'Desconocido' }}</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Especialidad -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Especialidad</label>
                <select formControlName="especialidadId"
                  class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  (change)="filtrarMedicosPorEspecialidad()">
                  <option value="">Todas las especialidades</option>
                  <option *ngFor="let e of especialidades" [value]="e.id">{{ e.nombre }}</option>
                </select>
              </div>

              <!-- Médico -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Médico Responsable</label>
                <select formControlName="medicoId" 
                  class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <option value="">Seleccione un médico...</option>
                  <option *ngFor="let m of medicosFiltrados" [value]="m.id">
                    {{ m.nombres }} {{ m.apellidos }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Fecha y Hora</label>
                <input type="datetime-local" formControlName="fechaHora"
                  class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:bg-gray-50 disabled:text-gray-500">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
                <select formControlName="tipo" 
                  class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <option value="CONSULTA_GENERAL">Consulta General</option>
                  <option value="ESPECIALIDAD">Especialidad</option>
                  <option value="CONTROL">Control</option>
                  <option value="URGENCIA">Urgencia</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Motivo / Notas</label>
              <textarea formControlName="motivo" rows="2"
                class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"></textarea>
            </div>

            <div class="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-gray-50 mt-4 pb-2">
              <button type="button" (click)="cerrarModal()"
                class="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm">
                Cancelar
              </button>
              <button type="submit" [disabled]="citaForm.invalid || !pacienteSeleccionado || cargando"
                class="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {{ cargando ? 'Guardando...' : 'Confirmar Cita' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal confirmar cancelar cita -->
    <div *ngIf="confirmarCancelarId"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">¿Cancelar esta cita?</h3>
            <p class="text-sm text-gray-500 mt-1">Esta acción no se puede deshacer.</p>
          </div>
        </div>
        <div class="flex gap-3 justify-end">
          <button (click)="confirmarCancelarId = null"
                  class="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Volver
          </button>
          <button (click)="confirmarCancelar()"
                  class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
            Sí, cancelar cita
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #c7d2fe;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #818cf8;
    }
  `]
})
export class CitasComponent implements OnInit {
  private fb              = inject(FormBuilder);
  private citasService    = inject(CitasService);
  private pacientesService = inject(PacientesService);
  private authService      = inject(AuthService);
  private notification    = inject(NotificationService);
  private paramSvc        = inject(ParametrosService);

  hoy = new Date();
  fechaFiltro = DateUtils.getHoyString();
  citas: any[] = [];
  medicos: any[] = [];
  medicosFiltrados: any[] = [];
  especialidades: { id: number; nombre: string }[] = [];
  pacientes: any[] = [];
  pacienteSeleccionado: any = null;
  mostrarModal        = false;
  confirmarCancelarId: number | null = null;
  cargando = false;
  minutosEntreConsultas = 20;
  esMedico = false;

  searchControl = this.fb.control('');
  citaForm = this.fb.group({
    pacienteId: [0, Validators.required],
    medicoId: ['', Validators.required],
    especialidadId: [''],
    fechaHora: ['', Validators.required],
    tipo: ['CONSULTA_GENERAL', Validators.required],
    motivo: ['']
  });

  ngOnInit() {
    this.cargarCitas();
    this.cargarMedicos();
    this.setupSearch();

    const user = this.authService.obtenerUsuario();
    this.esMedico = user?.rol === 'MEDICO';

    this.paramSvc.obtenerPorClave('MINUTOS_ENTRE_CONSULTAS').subscribe(p => {
      this.minutosEntreConsultas = parseInt(p.valor);
    });

    // Escuchar cambios para sugerir hora
    this.citaForm.get('medicoId')?.valueChanges.subscribe(() => this.sugerirHora());
  }

  setupSearch() {
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(val => {
        if (!val || val.length < 1) {
          this.pacientes = [];
          return of(null);
        }
        return this.pacientesService.buscar(val).pipe(
          catchError(() => of(null))
        );
      })
    ).subscribe(res => {
      if (!res) { this.pacientes = []; return; }
      // La API devuelve { data: { data: [...], total: N } } — doble anidamiento
      const payload = res?.data;
      this.pacientes = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    });
  }

  cargarCitas() {
    this.citasService.listar(this.fechaFiltro).subscribe(docs => {
      const data = docs || [];
      // Ordenar: Pendientes/Otras primero, ATENDIDA al final
      this.citas = data.sort((a: any, b: any) => {
        if (a.estado === 'ATENDIDA' && b.estado !== 'ATENDIDA') return 1;
        if (a.estado !== 'ATENDIDA' && b.estado === 'ATENDIDA') return -1;
        return new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime();
      });
    });
  }

  cargarMedicos() {
    this.citasService.listarMedicosDelCentro().subscribe(docs => {
      this.medicos = docs || [];
      this.medicosFiltrados = [...this.medicos];

      // Extraer especialidades únicas de todos los médicos del centro
      const espMap = new Map<number, { id: number; nombre: string }>();
      this.medicos.forEach(m => {
        (m.especialidades || []).forEach((e: { id: number; nombre: string }) => espMap.set(e.id, e));
      });
      this.especialidades = Array.from(espMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
  }

  filtrarMedicosPorEspecialidad() {
    const espId = Number(this.citaForm.value.especialidadId);
    this.citaForm.patchValue({ medicoId: '' });

    if (!espId) {
      this.medicosFiltrados = [...this.medicos];
    } else {
      this.medicosFiltrados = this.medicos.filter(m =>
        (m.especialidades || []).some((e: any) => e.id === espId)
      );
    }
  }

  abrirModal() {
    this.mostrarModal = true;
    this.pacienteSeleccionado = null;
    this.searchControl.setValue('');
    this.pacientes = [];
    this.medicosFiltrados = [...this.medicos];
    this.citaForm.reset({ tipo: 'CONSULTA_GENERAL', especialidadId: '' });

    if (!this.esMedico) {
      this.citaForm.get('fechaHora')?.disable();
    } else {
      this.citaForm.get('fechaHora')?.enable();
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  seleccionarPaciente(p: any) {
    this.pacienteSeleccionado = p;
    this.citaForm.patchValue({ pacienteId: p.id });
    this.pacientes = [];
    this.searchControl.setValue(`${p.nombres} ${p.apellidos}`);
    this.sugerirHora();
  }

  sugerirHora() {
    const medicoId = this.citaForm.get('medicoId')?.value;
    if (!medicoId) return;

    const fecha = this.fechaFiltro || DateUtils.getHoyString();

    this.citasService.obtenerHorarioDisponible(Number(medicoId), fecha).subscribe({
      next: (res: any) => {
        let sugerencia: Date;
        
        if (res?.siguienteHoraISO) {
          sugerencia = new Date(res.siguienteHoraISO);
        } else {
          sugerencia = new Date();
          sugerencia.setMinutes(sugerencia.getMinutes() + 15); // 15 min de margen por defecto
        }

        // Redondear minutos al siguiente múltiplo de 5 para que sea más profesional
        const m = sugerencia.getMinutes();
        const roundedM = Math.ceil(m / 5) * 5;
        sugerencia.setMinutes(roundedM);
        sugerencia.setSeconds(0);
        sugerencia.setMilliseconds(0);

        // Formatear a HH:mm local
        const hh = String(sugerencia.getUTCHours()).padStart(2, '0');
        const mm = String(sugerencia.getUTCMinutes()).padStart(2, '0');
        
        this.citaForm.get('fechaHora')?.setValue(`${fecha}T${hh}:${mm}`);
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'El médico no tiene agenda disponible para este día');
        this.citaForm.get('fechaHora')?.setValue('');
      }
    });
  }

  guardar() {
    if (this.citaForm.invalid || !this.pacienteSeleccionado) return;

    this.cargando = true;
    const v = this.citaForm.getRawValue();
    const payload = {
      ...v,
      medicoId: Number(v.medicoId),
      pacienteId: Number(v.pacienteId),
      fechaHora: v.fechaHora ? DateUtils.getDateTimeISO(v.fechaHora) : null,
      especialidadId: v.especialidadId ? Number(v.especialidadId) : undefined,
    };
    this.citasService.crear(payload).subscribe({
      next: () => {
        this.cargando = false;
        this.cerrarModal();
        this.cargarCitas();
        this.notification.success('Cita programada exitosamente');
      },
      error: (err) => {
        this.cargando = false;
        this.notification.error(err.error?.message || 'Error al programar la cita');
      },
    });
  }

  cancelarCita(id: number) {
    this.confirmarCancelarId = id;
  }

  confirmarCancelar() {
    if (!this.confirmarCancelarId) return;
    this.citasService.cancelar(this.confirmarCancelarId).subscribe({
      next: () => { this.confirmarCancelarId = null; this.cargarCitas(); this.notification.success('Cita cancelada'); },
      error: ()  => { this.confirmarCancelarId = null; this.notification.error('Error al cancelar la cita'); },
    });
  }

  // Estilos de UI
  getEstadoClass(estado: string) {
    switch (estado) {
      case 'ATENDIDA': return 'border-emerald-500';
      case 'CANCELADA': return 'border-red-400';
      case 'PROGRAMADA': return 'border-indigo-400';
      default: return 'border-gray-200';
    }
  }

  getStatusBadgeClass(estado: string) {
    switch (estado) {
      case 'ATENDIDA': return 'bg-emerald-100 text-emerald-700';
      case 'CANCELADA': return 'bg-red-100 text-red-700';
      case 'PROGRAMADA': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  calcularEdad(fecha: string): number {
    if (!fecha) return 0;
    const born = new Date(fecha);
    const now = new Date();
    let edge = now.getFullYear() - born.getFullYear();
    const month = now.getMonth() - born.getMonth();
    if (month < 0 || (month === 0 && now.getDate() < born.getDate())) {
      edge--;
    }
    return edge;
  }

  esDeMiCentroId(id: number): boolean {
    const user = this.authService.obtenerUsuario();
    return user?.establecimientoId === id;
  }
}
