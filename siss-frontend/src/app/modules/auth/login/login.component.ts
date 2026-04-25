import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        <!-- Logo y título -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0
                       00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">SISS</h1>
          <p class="text-sm text-gray-500 mt-1">Sistema Integral de Salud - Honduras</p>
        </div>

        <!-- Mensaje Informativo (Ej: Inactividad) -->
        <div *ngIf="mensajeInfo" class="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl animate-fade-in">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-xs font-bold text-amber-800 leading-relaxed">{{ mensajeInfo }}</p>
          </div>
        </div>

        <!-- Mensaje de Error Global -->
        <div *ngIf="error" class="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl animate-fade-in">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-xs font-bold text-red-700 leading-relaxed">{{ error }}</p>
          </div>
        </div>

        <!-- Pantalla de Selección de Contexto -->
        <div *ngIf="asignaciones.length > 0" class="animate-fade-in">
          <h2 class="text-lg font-semibold text-gray-800 mb-2">Seleccione su Centro de Trabajo</h2>
          <p class="text-sm text-gray-500 mb-6">Hemos detectado múltiples asignaciones activas para su usuario.</p>
          
          <div class="space-y-3 mb-6">
            <button *ngFor="let asig of asignaciones"
                    (click)="seleccionarAsignacion(asig.id)"
                    class="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
              <div class="font-medium text-gray-900 group-hover:text-blue-700">{{ asig.establecimiento }}</div>
              <div class="flex justify-between items-center mt-1">
                <div class="flex flex-col">
                  <span class="text-[10px] text-gray-500 group-hover:text-blue-600">Servicio: <span class="font-medium">{{ asig.servicio }}</span></span>
                  <span class="text-[10px] text-purple-600 font-medium group-hover:text-purple-700">Especialidad: {{ asig.especialidad }}</span>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-gray-100 rounded text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                  {{ asig.rol }}
                </span>
              </div>
            </button>
          </div>

          <button (click)="cancelarSeleccion()" class="text-sm text-blue-600 font-medium hover:underline">
            ← Volver al login
          </button>
        </div>

        <!-- Formulario de Login -->
        <form *ngIf="asignaciones.length === 0" (ngSubmit)="iniciarSesion()" #form="ngForm">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Correo o N° de empleado
            </label>
            <input
              [(ngModel)]="identificador"
              name="identificador"
              type="text"
              required
              placeholder="correo@sesal.hn o EMP001"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div class="relative">
              <input
                [(ngModel)]="contrasena"
                name="contrasena"
                [type]="mostrarContrasena ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" />
              <button
                type="button"
                (click)="mostrarContrasena = !mostrarContrasena"
                class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none">
                <svg *ngIf="!mostrarContrasena" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <svg *ngIf="mostrarContrasena" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            [disabled]="cargando"
            class="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg
                   hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors text-sm">
            {{ cargando ? 'Iniciando sesión...' : 'Iniciar sesión' }}
          </button>
        </form>

        <!-- Indicador offline -->
        <p *ngIf="!enLinea" class="text-xs text-center text-yellow-600 mt-4">
          ⚠ Sin conexión — algunas funciones no estarán disponibles
        </p>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  private route = inject(ActivatedRoute);
  identificador = '';
  contrasena = '';
  mostrarContrasena = false;
  cargando = false;
  error = '';
  mensajeInfo = '';
  enLinea = navigator.onLine;

  asignaciones: any[] = [];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['reason'] === 'inactivity') {
        const mins = params['minutes'] || 30;
        this.mensajeInfo = `Su sesión ha finalizado automáticamente debido a ${mins} minutos de inactividad por motivos de seguridad. Por favor, ingrese de nuevo.`;
      }
    });
  }

  iniciarSesion() {
    if (!this.identificador || !this.contrasena) return;

    this.cargando = true;
    this.error = '';

    this.auth.login(this.identificador, this.contrasena).subscribe({
      next: (res) => {
        if (res.requiereSeleccion) {
          this.asignaciones = res.asignaciones || [];
          this.cargando = false;
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.error = err.error?.message ?? 'Error al iniciar sesión';
        this.cargando = false;
      },
    });
  }

  seleccionarAsignacion(id: number) {
    this.cargando = true;
    this.error = '';

    this.auth.login(this.identificador, this.contrasena, id).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error = err.error?.message || 'Error al seleccionar la asignación';
        this.cargando = false;
      },
    });
  }

  cancelarSeleccion() {
    this.asignaciones = [];
    this.error = '';
  }
}
