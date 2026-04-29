
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VacunacionService } from '../vacunacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { EstablecimientosService } from '../../../core/services/establecimientos.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DateValidators } from '../../../core/validators/date.validator';

@Component({
  selector: 'app-gestion-lotes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate__animated animate__fadeIn">
      <div class="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col scale-in h-[90vh]">
        
        <!-- Header -->
        <div class="px-8 py-6 bg-gray-900 flex items-center justify-between text-white">
          <div>
            <h2 class="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
              <i class="bi bi-box-seam"></i>
              GESTIÓN DE LOTES PAI
            </h2>
          </div>
          <button (click)="cerrar.emit()" class="p-2 hover:bg-gray-800 rounded-xl transition-all">
            <i class="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-8 bg-gray-50/30">
          
          <!-- Filtro de Establecimiento para Admins -->
          <div class="bg-blue-600 rounded-3xl p-6 mb-8 text-white shadow-lg shadow-blue-200 flex flex-col md:flex-row md:items-center gap-6" *ngIf="esAdmin">
            <div class="flex-1">
              <h4 class="font-bold text-lg">Modo Administrador</h4>
              <p class="text-blue-100 text-xs uppercase font-bold tracking-widest mt-1">Seleccione el establecimiento para gestionar sus lotes</p>
            </div>
            <div class="flex-[2]">
              <select class="w-full px-5 py-3 bg-blue-700 border-transparent text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-white outline-none transition-all" 
                      [(ngModel)]="establecimientoId" (change)="onEstablecimientoChange()">
                <option *ngFor="let est of establecimientos" [value]="est.id">{{ est.nombre }}</option>
              </select>
            </div>
          </div>

          <!-- Form Card -->
          <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
            <h4 class="text-sm font-bold text-blue-600 uppercase tracking-widest mb-6">Registrar Entrada de Vacunas</h4>
            <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Vacuna *</label>
                  <select class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold" 
                          formControlName="vacunaId">
                    <option [value]="null">Seleccione...</option>
                    <option *ngFor="let v of catalogo" [value]="v.id">{{ v.nombre }}</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Código de Lote *</label>
                  <input type="text" class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold" 
                         formControlName="codigoLote" placeholder="VAX-2024-XXX">
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fabricante *</label>
                  <input type="text" class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold" 
                         formControlName="fabricante" placeholder="Ej: Pfizer, GSK">
                </div>
                <div class="space-y-1">
                  <input type="date" class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold" 
                         [class.ring-2]="form.get('fechaVencimiento')?.invalid && form.get('fechaVencimiento')?.touched"
                         [class.ring-red-500]="form.get('fechaVencimiento')?.invalid && form.get('fechaVencimiento')?.touched"
                         formControlName="fechaVencimiento">
                  <p *ngIf="form.get('fechaVencimiento')?.errors?.['dateInvalid'] && form.get('fechaVencimiento')?.touched" 
                     class="text-[10px] text-red-500 font-bold uppercase mt-1">La fecha no existe</p>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Cantidad Inicial *</label>
                  <input type="number" class="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-semibold" 
                         formControlName="cantidadInicial">
                </div>
                <div class="flex items-end">
                  <button type="submit" [disabled]="form.invalid || loading"
                          class="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                    <span *ngIf="loading" class="animate-spin h-3 w-3 border-2 border-white border-b-transparent rounded-full"></span>
                    Registrar Lote
                  </button>
                </div>
              </div>
            </form>
          </div>

          <!-- Inventory List -->
          <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
              <h4 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Existencias en el Establecimiento</h4>
              <span class="text-[10px] font-bold text-blue-600 px-3 py-1 bg-blue-50 rounded-full" *ngIf="esAdmin">
                Viendo: {{ nombreEstablecimientoSeleccionado }}
              </span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="text-[9px] font-black text-gray-400 uppercase tracking-tighter border-b border-gray-50">
                    <th class="px-6 py-3">Vacuna</th>
                    <th class="px-6 py-3">Lote</th>
                    <th class="px-6 py-3">Vencimiento</th>
                    <th class="px-6 py-3">Stock / Inicial</th>
                    <th class="px-6 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr *ngFor="let l of lotes" class="hover:bg-gray-50/50 transition-colors">
                    <td class="px-6 py-4 text-sm font-bold text-gray-900">{{ l.vacuna.nombre }}</td>
                    <td class="px-6 py-4">
                      <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-mono font-bold uppercase tracking-tighter border border-gray-200">
                        {{ l.codigoLote }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-xs font-semibold text-gray-500">{{ l.fechaVencimiento | date:'dd MMM yyyy' }}</td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-black" [ngClass]="l.cantidadActual < 10 ? 'text-red-500' : 'text-gray-900'">{{ l.cantidadActual }}</span>
                        <span class="text-[10px] text-gray-400 font-bold">/ {{ l.cantidadInicial }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm"
                            [ngClass]="l.cantidadActual > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                        {{ l.cantidadActual > 0 ? 'Disponible' : 'Agotado' }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="lotes.length === 0">
                    <td colspan="5" class="px-6 py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No hay existencias registradas</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scale-in { animation: scaleIn 0.3s ease-out; }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class GestionLotesModalComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private vacService = inject(VacunacionService);
  private auth = inject(AuthService);
  private estService = inject(EstablecimientosService);
  private notify = inject(NotificationService);

  form: FormGroup;
  catalogo: any[] = [];
  lotes: any[] = [];
  establecimientos: any[] = [];
  loading = false;
  establecimientoId: number = 0;
  esAdmin: boolean = false;

  constructor() {
    const user = this.auth.obtenerUsuario();
    this.esAdmin = user?.rol === 'ADMIN';
    this.establecimientoId = user?.establecimientoId || 0;
    
    this.form = this.fb.group({
      vacunaId: [null, Validators.required],
      codigoLote: ['', Validators.required],
      fabricante: ['', Validators.required],
      fechaVencimiento: ['', [Validators.required, DateValidators.dateReal()]],
      cantidadInicial: [null, [Validators.required, Validators.min(1)]],
      establecimientoId: [this.establecimientoId, Validators.required]
    });
  }

  ngOnInit() {
    this.cargarCatalogo();
    if (this.esAdmin) {
      this.cargarEstablecimientos();
    } else {
      this.cargarLotes();
    }
  }

  get nombreEstablecimientoSeleccionado() {
    return this.establecimientos.find(e => e.id == this.establecimientoId)?.nombre || 'Establecimiento Actual';
  }

  cargarEstablecimientos() {
    this.estService.listarSimplificado().subscribe((res: any) => {
      this.establecimientos = res.data || res;
      if (this.establecimientos.length > 0 && !this.establecimientoId) {
        this.establecimientoId = this.establecimientos[0].id;
        this.onEstablecimientoChange();
      } else {
        this.cargarLotes();
      }
    });
  }

  onEstablecimientoChange() {
    this.form.patchValue({ establecimientoId: this.establecimientoId });
    this.cargarLotes();
  }

  cargarCatalogo() {
    this.vacService.obtenerCatalogo().subscribe((res: any) => {
      this.catalogo = res.data || res;
    });
  }

  cargarLotes() {
    if (!this.establecimientoId) return;
    this.vacService.obtenerLotes(this.establecimientoId).subscribe((res: any) => {
      this.lotes = res.data || res;
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.loading = true;
    this.vacService.crearLote(this.form.value).subscribe({
      next: () => {
        this.notify.success('Lote registrado con éxito');
        this.cargarLotes();
        this.form.reset({
          establecimientoId: this.establecimientoId,
          vacunaId: null
        });
        this.loading = false;
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Error al registrar el lote');
        this.loading = false;
      }
    });
  }
}
