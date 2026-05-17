
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VacunacionService } from '../vacunacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-registro-vacuna-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate__animated animate__fadeIn">
      <div class="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col scale-in">
        
        <!-- Header -->
        <div class="px-8 py-6 bg-blue-600 flex items-center justify-between text-white">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-bold uppercase tracking-tight leading-none">
                {{ mode === 'add' ? 'Prescribir Inmunización (Receta)' : 'Registrar Aplicación PAI' }}
              </h2>
              <p class="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">
                {{ mode === 'add' ? 'Nueva indicación de vacuna para enfermería' : 'Ingreso de inmunización oficial' }}
              </p>
            </div>
          </div>
          <button (click)="cerrar.emit()" class="p-2 hover:bg-blue-700 rounded-xl transition-all">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Body -->
        <form [formGroup]="form" (ngSubmit)="guardar()" class="p-8 space-y-6">
          
          <!-- Paciente Info (Read Only) -->
          <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Paciente Seleccionado</p>
              <h6 class="font-bold text-gray-900">{{ paciente?.nombres }} {{ paciente?.apellidos }}</h6>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">DNI</p>
              <h6 class="font-bold text-blue-600">{{ paciente?.dni }}</h6>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Vacuna *</label>
              <select class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold" 
                      formControlName="vacunaId" (change)="onVacunaChange()">
                <option [value]="null">Seleccione vacuna...</option>
                <option *ngFor="let v of catalogo" [value]="v.id">{{ v.nombre }}</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Dosis / Esquema *</label>
              <select class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold" 
                      formControlName="esquemaId">
                <option [value]="null">Seleccione dosis...</option>
                <option *ngFor="let e of esquemasFiltrados" [value]="e.id">{{ e.descripcion }}</option>
              </select>
            </div>

            <ng-container *ngIf="mode !== 'add'">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Lote Disponible *</label>
                <select class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold" 
                        formControlName="loteId">
                  <option [value]="null">Seleccione lote...</option>
                  <option *ngFor="let l of lotes" [value]="l.id">{{ l.codigoLote }} (Stock: {{ l.cantidadActual }})</option>
                </select>
                <p *ngIf="lotes.length === 0 && form.get('vacunaId')?.value" class="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">Sin stock en este establecimiento</p>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fecha de Aplicación *</label>
                <input type="datetime-local" class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold" 
                       formControlName="fechaAplicacion">
              </div>
            </ng-container>
          </div>

          <div class="space-y-1">
            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Observaciones / Indicaciones Especiales</label>
            <textarea class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold" 
                      formControlName="observaciones" rows="2" placeholder="Indicaciones para el Centro de Vacunación (ej: aplicar tras vigilar temperatura)..."></textarea>
          </div>

          <!-- Footer -->
          <div class="flex gap-4 pt-4">
            <button type="button" (click)="cerrar.emit()" 
                    class="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all uppercase text-xs tracking-widest">
              Cancelar
            </button>
            <button type="submit" [disabled]="form.invalid || loading || (mode !== 'add' && lotes.length === 0)"
                    class="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              {{ loading ? 'Guardando...' : (mode === 'add' ? 'Agregar a Receta' : 'Confirmar Aplicación') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .scale-in { animation: scaleIn 0.3s ease-out; }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class RegistroVacunaModalComponent implements OnInit {
  @Input() paciente: any;
  @Input() preselectedVacunaId?: number;
  @Input() preselectedEsquemaId?: number;
  @Input() mode: 'direct' | 'add' = 'direct';
  @Output() cerrar = new EventEmitter<void>();
  @Output() recargar = new EventEmitter<void>();
  @Output() onAdd = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private vacService = inject(VacunacionService);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);

  form: FormGroup;
  catalogo: any[] = [];
  esquemasFiltrados: any[] = [];
  lotes: any[] = [];
  loading = false;
  establecimientoId: number = 0;

  constructor() {
    const user = this.auth.obtenerUsuario();
    this.establecimientoId = user?.establecimientoId || 0;
    
    // Calculamos la hora local para el input datetime-local
    const ahora = new Date();
    const offset = ahora.getTimezoneOffset() * 60000;
    const horaLocal = (new Date(ahora.getTime() - offset)).toISOString().substring(0, 16);
    
    this.form = this.fb.group({
      pacienteId: [null, Validators.required],
      vacunaId: [null, Validators.required],
      esquemaId: [null, Validators.required],
      loteId: [null, Validators.required],
      fechaAplicacion: [horaLocal, Validators.required],
      establecimientoId: [this.establecimientoId, Validators.required],
      observaciones: ['']
    });
  }

  ngOnInit() {
    if (this.paciente) {
      this.form.patchValue({ pacienteId: this.paciente.id });
    }
    if (this.mode === 'add') {
      this.form.get('loteId')?.clearValidators();
      this.form.get('loteId')?.updateValueAndValidity();
      this.form.get('fechaAplicacion')?.clearValidators();
      this.form.get('fechaAplicacion')?.updateValueAndValidity();
    }
    this.cargarCatalogo();
  }

  cargarCatalogo() {
    this.vacService.obtenerCatalogo().subscribe((res: any) => {
      this.catalogo = res.data || res;
      if (this.preselectedVacunaId) {
        this.form.patchValue({ vacunaId: this.preselectedVacunaId });
        this.onVacunaChange();
        if (this.preselectedEsquemaId) {
          this.form.patchValue({ esquemaId: this.preselectedEsquemaId });
        }
      }
    });
  }

  onVacunaChange() {
    const vacunaId = this.form.get('vacunaId')?.value;
    if (!vacunaId) {
      this.esquemasFiltrados = [];
      this.lotes = [];
      return;
    }

    const vacuna = this.catalogo.find(v => v.id == vacunaId);
    this.esquemasFiltrados = vacuna?.esquemas || [];
    
    // Cargar lotes para esta vacuna
    this.vacService.obtenerLotes(this.form.get('establecimientoId')?.value, vacunaId).subscribe((res: any) => {
      this.lotes = res.data || res;
      if (this.lotes.length > 0) {
        this.form.patchValue({ loteId: this.lotes[0].id });
      } else {
        this.form.patchValue({ loteId: null });
      }
    });
  }

  guardar() {
    if (this.form.invalid) return;
    
    const rawData = this.form.value;
    const payload: any = {
      vacunaId: Number(rawData.vacunaId),
      esquemaId: rawData.esquemaId ? Number(rawData.esquemaId) : null,
      pacienteId: Number(rawData.pacienteId),
      establecimientoId: Number(rawData.establecimientoId),
      observaciones: rawData.observaciones
    };

    if (this.mode === 'add') {
      const vacuna = this.catalogo.find(v => v.id == payload.vacunaId);
      const esquema = this.esquemasFiltrados.find(e => e.id == payload.esquemaId);
      
      this.onAdd.emit({
        ...payload,
        vacunaNombre: vacuna?.nombre || 'Vacuna',
        esquemaDescripcion: esquema?.descripcion || 'Dosis Única'
      });
      this.cerrar.emit();
      return;
    }

    payload.loteId = Number(rawData.loteId);
    payload.fechaAplicacion = new Date(rawData.fechaAplicacion).toISOString();

    this.loading = true;
    this.vacService.registrarAplicacion(payload).subscribe({
      next: () => {
        this.recargar.emit();
        this.cerrar.emit();
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Error al registrar la vacuna');
        this.loading = false;
      }
    });
  }
}
