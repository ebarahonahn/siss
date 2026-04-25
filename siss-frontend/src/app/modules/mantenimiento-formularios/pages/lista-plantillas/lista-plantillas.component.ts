import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FormulariosService } from '../../../../core/services/formularios.service';
import { UsuariosService } from '../../../../core/services/usuarios.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-lista-plantillas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-5xl mx-auto">

        <!-- Cabecera -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-black text-gray-900 tracking-tight">Formularios Clínicos</h1>
            <p class="text-sm text-gray-500 mt-1">Gestión de plantillas dinámicas por especialidad</p>
          </div>
          <div class="flex items-center gap-3">
            <a routerLink="/dashboard" class="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl transition-all">
              ← VOLVER
            </a>
            <button (click)="abrirModalCrear()" 
                    class="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/>
              </svg>
              NUEVO FORMULARIO
            </button>
          </div>
        </div>

        <!-- Lista de plantillas -->
        <div class="grid grid-cols-1 gap-4">
          <div *ngFor="let p of plantillas"
               class="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6
                      flex items-center justify-between hover:shadow-md hover:border-blue-200 transition-all group">
            <div class="flex items-center gap-5">
              <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-3">
                  <h3 class="font-bold text-lg text-gray-900">{{ p.nombre }}</h3>
                  <span class="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg border border-gray-200">
                    VERSION {{ p.version }}
                  </span>
                  <span *ngIf="p.activa"
                        class="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-lg border border-green-200 uppercase tracking-wider">
                    Activa
                  </span>
                </div>
                <p class="text-sm text-gray-500 mt-1">
                   En <span class="font-bold text-gray-700 uppercase tracking-tighter">{{ p.especialidad?.nombre }}</span> · 
                   {{ p._count?.secciones || 0 }} secciones configuradas
                </p>
              </div>
            </div>

            <div class="flex gap-3">
              <button (click)="abrirModalEditar(p)"
                      title="Editar información básica"
                      class="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              <a [routerLink]="['/mantenimiento/formularios', p.id, 'constructor']"
                 title="Editar estructura (Secciones y Campos)"
                 class="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                </svg>
              </a>
              <button *ngIf="!p.activa"
                      (click)="activar(p.id)"
                      title="Activar plantilla"
                      class="p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all border border-transparent hover:border-green-100">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </button>
              <button (click)="duplicar(p.id)"
                      title="Duplicar como nueva versión"
                      class="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all border border-transparent hover:border-indigo-100">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V7a2 2 0 01-2 2h-2M10 11V9a2 2 0 012-2h4"/>
                </svg>
              </button>
              <button *ngIf="!p.activa"
                      (click)="eliminar(p)"
                      title="Eliminar plantilla"
                      class="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>

          <div *ngIf="plantillas.length === 0"
               class="bg-white rounded-[3rem] p-16 text-center shadow-sm border border-dashed border-gray-200">
            <div class="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-200">
               <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
               </svg>
            </div>
            <p class="text-xl font-bold text-gray-400">No hay plantillas creadas aún</p>
            <p class="text-sm text-gray-300 mt-1">Cree la primera plantilla pulsando el botón superior</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Modal Creación ── -->
    <div *ngIf="mostrarModal()" 
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
         (click)="cerrarModal()">
      <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 space-y-6 animate-in zoom-in-95 duration-200"
           (click)="$event.stopPropagation()">
        
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="editando() ? 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' : 'M12 4v16m8-8H4'"/>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-black text-gray-900 leading-tight">
                {{ editando() ? 'Editar Plantilla' : 'Configurar Nueva Plantilla' }}
            </h3>
            <p class="text-sm text-gray-500">Defina la especialidad y el nombre básico.</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Especialidad Médica</label>
            <select [(ngModel)]="nuevaPlantilla.especialidadId" 
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold text-gray-700">
              <option [ngValue]="null">Seleccione una especialidad...</option>
              <option *ngFor="let esp of especialidades()" [value]="esp.id">
                {{ esp.nombre | uppercase }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nombre del Formulario</label>
            <input type="text" [(ngModel)]="nuevaPlantilla.nombre"
                   placeholder="Ej: Evaluación Inicial de Pediatría"
                   class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold text-gray-700"/>
          </div>

          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Descripción (Opcional)</label>
            <textarea [(ngModel)]="nuevaPlantilla.descripcion"
                      rows="3"
                      placeholder="Breve detalle sobre el uso de este formulario..."
                      class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold text-gray-700 resize-none"></textarea>
          </div>
        </div>

        <div class="flex gap-4 pt-2">
          <button (click)="cerrarModal()"
                  class="flex-1 py-3.5 text-sm font-black text-gray-500 hover:bg-gray-100 rounded-2xl transition-all">
            CANCELAR
          </button>
          <button (click)="guardar()"
                  [disabled]="!esValido() || guardando()"
                  class="flex-1 py-3.5 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-wait">
            <span *ngIf="!guardando()">{{ editando() ? 'GUARDAR CAMBIOS' : 'CREAR Y CONTINUAR' }}</span>
            <span *ngIf="guardando()" class="flex items-center justify-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              PROCESANDO...
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal Confirmar Eliminación ── -->
    <div *ngIf="plantillaAEliminar()"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
         (click)="plantillaAEliminar.set(null)">
      <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-200"
           (click)="$event.stopPropagation()">

        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 flex-shrink-0">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-black text-gray-900 leading-tight">Eliminar Plantilla</h3>
            <p class="text-sm text-gray-500 mt-1">Esta acción no se puede deshacer.</p>
          </div>
        </div>

        <div class="bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
          <p class="text-sm font-bold text-gray-700">
            ¿Está seguro que desea eliminar
            <span class="text-red-600">"{{ plantillaAEliminar()?.nombre }}"</span>?
          </p>
          <p class="text-xs text-gray-400 mt-1">
            Especialidad: <span class="font-bold">{{ plantillaAEliminar()?.especialidad?.nombre }}</span>
            · Versión {{ plantillaAEliminar()?.version }}
          </p>
        </div>

        <div class="flex gap-4 pt-2">
          <button (click)="plantillaAEliminar.set(null)"
                  class="flex-1 py-3.5 text-sm font-black text-gray-500 hover:bg-gray-100 rounded-2xl transition-all">
            CANCELAR
          </button>
          <button (click)="confirmarEliminar()"
                  class="flex-1 py-3.5 text-sm font-black text-white bg-red-600 hover:bg-red-700 rounded-2xl transition-all shadow-lg shadow-red-100">
            SÍ, ELIMINAR
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ListaPlantillasComponent implements OnInit {
  private service = inject(FormulariosService);
  private usuariosSvc = inject(UsuariosService);
  private router = inject(Router);
  private ns = inject(NotificationService);

  plantillas: any[] = [];
  
  // Estado del modal
  mostrarModal = signal(false);
  guardando = signal(false);
  editando = signal(false);
  plantillaIdEditando = signal<number | null>(null);
  especialidades = signal<any[]>([]);
  plantillaAEliminar = signal<any>(null);
  
  nuevaPlantilla = {
    nombre: '',
    descripcion: '',
    especialidadId: null as number | null
  };

  ngOnInit() {
    this.cargar();
    this.cargarEspecialidades();
  }

  cargar() {
    this.service.listarPlantillas().subscribe((res: any) => {
      this.plantillas = res?.data ?? [];
    });
  }

  cargarEspecialidades() {
    this.usuariosSvc.listarEspecialidades().subscribe({
      next: (data: any) => this.especialidades.set(data),
      error: () => this.ns.error('No se pudieron cargar las especialidades')
    });
  }

  activar(id: number) {
    this.service.activarPlantilla(id).subscribe({
      next: () => {
        this.ns.success('Plantilla activada correctamente');
        this.cargar();
      },
      error: () => this.ns.error('Error al activar la plantilla')
    });
  }

  duplicar(id: number) {
    this.service.duplicarPlantilla(id).subscribe({
      next: () => {
        this.ns.success('Nueva versión creada con éxito');
        this.cargar();
      },
      error: () => this.ns.error('Error al duplicar la plantilla')
    });
  }

  eliminar(plantilla: any) {
    if (plantilla.activa) {
      this.ns.error('No se puede eliminar una plantilla activa. Desactívela primero.');
      return;
    }
    this.plantillaAEliminar.set(plantilla);
  }

  confirmarEliminar() {
    const p = this.plantillaAEliminar();
    if (!p) return;
    this.service.eliminarPlantilla(p.id).subscribe({
      next: () => {
        this.ns.success('Plantilla eliminada');
        this.plantillaAEliminar.set(null);
        this.cargar();
      },
      error: () => {
        this.ns.error('Error al eliminar la plantilla');
        this.plantillaAEliminar.set(null);
      }
    });
  }

  abrirModalCrear() {
    this.editando.set(false);
    this.plantillaIdEditando.set(null);
    this.nuevaPlantilla = { nombre: '', descripcion: '', especialidadId: null };
    this.mostrarModal.set(true);
  }

  abrirModalEditar(p: any) {
    this.editando.set(true);
    this.plantillaIdEditando.set(p.id);
    this.nuevaPlantilla = {
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      especialidadId: p.especialidadId
    };
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    if (this.guardando()) return;
    this.mostrarModal.set(false);
  }

  esValido() {
    return this.nuevaPlantilla.nombre.trim().length >= 3 && this.nuevaPlantilla.especialidadId;
  }

  guardar() {
    if (!this.esValido()) return;
    this.guardando.set(true);
    
    const datos = {
      ...this.nuevaPlantilla,
      especialidadId: Number(this.nuevaPlantilla.especialidadId)
    };

    if (this.editando()) {
      this.service.actualizarPlantilla(this.plantillaIdEditando()!, datos).subscribe({
        next: () => {
          this.ns.success('Plantilla actualizada con éxito');
          this.mostrarModal.set(false);
          this.guardando.set(false);
          this.cargar();
        },
        error: () => {
          this.ns.error('Error al actualizar la plantilla');
          this.guardando.set(false);
        }
      });
    } else {
      this.service.crearPlantilla(datos).subscribe({
        next: (res: any) => {
          this.ns.success('Plantilla creada con éxito');
          this.mostrarModal.set(false);
          const id = res.data?.id || res.id;
          this.router.navigate(['/mantenimiento/formularios', id, 'constructor']);
        },
        error: () => {
          this.ns.error('Error al crear la plantilla');
          this.guardando.set(false);
        }
      });
    }
  }
}
