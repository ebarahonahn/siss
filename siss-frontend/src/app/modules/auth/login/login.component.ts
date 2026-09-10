import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginImagesService, LoginImage, ConfigGeneral } from '../../../core/services/login-images.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex min-h-screen bg-white">
      <!-- Sección Izquierda: Carrusel (Oculto en móviles pequeños) -->
      <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-blue-900">
        <!-- Imágenes del Carrusel -->
        <div *ngIf="imagenes.length === 0" class="absolute inset-0 flex items-center justify-center bg-blue-900 z-0">
           <div class="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-900 opacity-50"></div>
           <div class="z-10 text-center px-12">
              <h2 class="text-4xl font-bold text-white mb-4">{{ configGeneral?.siglasSistema || 'SISS' }} Honduras</h2>
              <p class="text-blue-100 text-lg">{{ configGeneral?.nombreSistema || 'Sistema Integral de Salud para el Bienestar Nacional.' }}</p>
           </div>
        </div>

        <div *ngFor="let img of imagenes; let i = index" 
             class="absolute inset-0 transition-opacity duration-1000 ease-in-out"
             [class.opacity-100]="currentIndex === i"
             [class.opacity-0]="currentIndex !== i">
          
          <!-- Overlay Gradiente para legibilidad -->
          <div class="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-transparent to-blue-950/40 z-10"></div>
          
          <!-- Imagen de fondo -->
          <img [src]="imgService.getImageUrl(img.id)" 
               [alt]="img.nombre"
               class="absolute inset-0 w-full h-full object-cover">
          
          <!-- Contenido sobre la imagen -->
          <div class="absolute bottom-20 left-12 right-12 z-20 text-white animate-fade-up">
            <div class="mb-6">
              <span class="px-4 py-1.5 bg-blue-600/30 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase border border-blue-400/30 shadow-lg">
                {{ configGeneral?.nombreSistema || 'Sistema Integral de Salud' }}
              </span>
            </div>
            <h2 class="text-5xl font-bold mb-4 leading-tight">
              {{ img.titulo || ('Bienvenido al ' + (configGeneral?.siglasSistema || 'SISS')) }}
            </h2>
            <p class="text-xl text-blue-100/90 leading-relaxed max-w-lg">
              {{ img.descripcion || 'Gestión hospitalaria moderna, eficiente y segura para el bienestar nacional.' }}
            </p>
          </div>
        </div>

        <!-- Indicadores de Carrusel -->
        <div *ngIf="imagenes.length > 1" class="absolute bottom-8 left-12 z-20 flex gap-2">
          <button *ngFor="let img of imagenes; let i = index"
                  (click)="setSlide(i)"
                  class="h-1.5 transition-all duration-300 rounded-full"
                  [ngClass]="{
                    'w-8 bg-white': currentIndex === i,
                    'w-2 bg-white/30': currentIndex !== i
                  }">
          </button>
        </div>

        <!-- Marca de Agua / Logo secundario -->
        <div class="absolute top-12 left-12 z-20 flex items-center gap-3">
          <div class="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span class="text-2xl font-bold text-white tracking-tight">SISS<span class="text-blue-400">®</span></span>
        </div>
      </div>

      <!-- Sección Derecha: Formulario -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-blue-700 relative overflow-hidden">
        <!-- Decoración de fondo (Sutiles círculos/gradientes) -->
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-blue-600 rounded-full opacity-20 blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-800 rounded-full opacity-30 blur-3xl"></div>

        <div class="w-full max-w-md relative z-10">
          <div class="bg-white rounded-[2.5rem] shadow-2xl p-6 sm:p-8 lg:p-10 animate-fade-in">
            <!-- Logo e Identidad -->
            <div class="text-center mb-4 sm:mb-6">
              <div class="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-xl shadow-blue-600/10 overflow-hidden border border-gray-50">
                 <!-- Mostrar Logo si existe, si no mostrar icono por defecto -->
                 <img *ngIf="configGeneral?.logoMimetype" [src]="imgService.getLogoUrl()" class="w-full h-full object-contain p-2">
                 <div *ngIf="!configGeneral?.logoMimetype" class="w-full h-full bg-blue-600 flex items-center justify-center">
                    <svg class="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                 </div>
              </div>
              <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight mb-1">{{ configGeneral?.siglasSistema || 'SISS' }}</h1>
              <p class="text-gray-500 font-medium text-sm leading-tight">{{ configGeneral?.nombreSistema || 'Sistema Integral de Salud - Honduras' }}</p>
            </div>

            <!-- Mensajes Informativos / Errores -->
            <div *ngIf="mensajeInfo" class="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
              <svg class="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p class="text-xs text-amber-800 leading-relaxed">{{ mensajeInfo }}</p>
            </div>

            <div *ngIf="error" class="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3">
              <svg class="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p class="text-xs font-bold text-red-700 leading-relaxed">{{ error }}</p>
            </div>

            <!-- Pantalla de Selección de Contexto -->
            <div *ngIf="asignaciones.length > 0" class="animate-fade-in">
              <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Seleccione su Centro de Trabajo
              </h3>
              
              <div class="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <button *ngFor="let asig of asignaciones"
                        (click)="seleccionarAsignacion(asig.id)"
                        class="w-full text-left p-5 border border-gray-100 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-all group relative overflow-hidden bg-gray-50/50">
                  <div class="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{{ asig.establecimiento }}</div>
                  <div class="flex flex-col mt-2 gap-1">
                    <div class="flex items-center gap-2 text-xs text-gray-500">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" stroke-width="2"/></svg>
                      <span>Servicio: <span class="font-medium text-gray-700">{{ asig.servicio }}</span></span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-gray-500">
                      <svg class="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2"/></svg>
                      <span class="text-purple-600 font-medium">Especialidad: {{ asig.especialidad }}</span>
                    </div>
                  </div>
                  <div class="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 bg-white border border-gray-100 rounded-lg text-gray-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 shadow-sm transition-all">
                    {{ asig.rol }}
                  </div>
                </button>
              </div>

              <button (click)="cancelarSeleccion()" class="flex items-center gap-2 text-sm text-blue-600 font-bold hover:text-blue-800 transition-colors group">
                <span class="group-hover:-translate-x-1 transition-transform">←</span> Volver al login
              </button>
            </div>

            <!-- Pantalla de Cambio Obligatorio de Contraseña -->
            <div *ngIf="mostrandoCambioObligatorio" class="animate-fade-in">
              <h3 class="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2 text-amber-600">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-11a4 4 0 11-8 0 4 4 0 018 0zM7 10h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                </svg>
                Actualizar Contraseña
              </h3>
              <p class="text-xs text-gray-500 mb-6 font-medium">Por seguridad, debe cambiar su clave temporal antes de continuar.</p>
              
              <div class="space-y-4 mb-6">
                <div>
                  <label class="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Nueva Contraseña</label>
                  <input [(ngModel)]="nuevaContrasena" type="password" placeholder="Nueva contraseña"
                         class="w-full px-5 py-3 sm:py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-0 focus:border-blue-500 transition-all font-medium" />
                </div>
                <div>
                  <label class="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Confirmar Nueva Contraseña</label>
                  <input [(ngModel)]="confirmarContrasena" type="password" placeholder="Repetir contraseña"
                         class="w-full px-5 py-3 sm:py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-0 focus:border-blue-500 transition-all font-medium" />
                </div>

                <button (click)="confirmarCambioContrasena()" [disabled]="cargando || !nuevaContrasena || nuevaContrasena !== confirmarContrasena"
                        class="w-full py-3 sm:py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]">
                  <div class="flex items-center justify-center gap-2">
                    <svg *ngIf="cargando" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Actualizar y Entrar
                  </div>
                </button>
              </div>

              <button (click)="mostrandoCambioObligatorio = false; error = ''; mensajeInfo = ''" class="flex items-center gap-2 text-sm text-gray-500 font-bold hover:text-gray-700 transition-colors group">
                <span class="group-hover:-translate-x-1 transition-transform">←</span> Cancelar
              </button>
            </div>

            <!-- Pantalla de Recuperación de Contraseña -->
            <div *ngIf="mostrandoRecuperacion && asignaciones.length === 0" class="animate-fade-in">
              <h3 class="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                Recuperar Contraseña
              </h3>
              <p class="text-xs text-gray-500 mb-6">Ingrese su correo o número de empleado y le enviaremos una clave temporal.</p>
              
              <div class="space-y-4 mb-6">
                <div>
                  <label class="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                    Correo o N° de empleado
                  </label>
                  <input
                    [(ngModel)]="identificador"
                    type="text"
                    placeholder="correo@siss.hn o EMP001"
                    class="w-full px-5 py-3 sm:py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm
                           focus:outline-none focus:ring-0 focus:border-blue-500 transition-all font-medium" />
                </div>

                <button
                  (click)="enviarRecuperacion()"
                  [disabled]="cargando || !identificador"
                  class="w-full py-3 sm:py-4 bg-blue-600 text-white font-bold rounded-2xl
                         hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 
                         disabled:cursor-not-allowed transition-all transform active:scale-[0.98]">
                  <div class="flex items-center justify-center gap-2">
                    <svg *ngIf="cargando" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ cargando ? 'Enviando...' : 'Enviar clave temporal' }}
                  </div>
                </button>
              </div>

              <button (click)="mostrandoRecuperacion = false; error = ''; mensajeInfo = ''" class="flex items-center gap-2 text-sm text-blue-600 font-bold hover:text-blue-800 transition-colors group">
                <span class="group-hover:-translate-x-1 transition-transform">←</span> Volver al login
              </button>
            </div>

            <!-- Formulario de Login -->
            <form *ngIf="!mostrandoRecuperacion && !mostrandoCambioObligatorio && asignaciones.length === 0" (ngSubmit)="iniciarSesion()" #form="ngForm" class="space-y-3 sm:space-y-4" autocomplete="off">
              <div>
                <label class="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                  Correo o N° de empleado
                </label>
                <div class="relative group">
                  <input
                    [(ngModel)]="identificador"
                    name="identificador"
                    type="text"
                    required
                    autocomplete="username"
                    placeholder="correo@siss.hn o EMP001"
                    class="w-full px-5 py-3 sm:py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm
                           focus:outline-none focus:ring-0 focus:border-blue-500 transition-all font-medium" />
                </div>
              </div>

              <div>
                <div class="flex justify-between items-center mb-2">
                  <label class="text-xs sm:text-sm font-bold text-gray-700">
                    Contraseña
                  </label>
                </div>
                <div class="relative group">
                  <input
                    [(ngModel)]="contrasena"
                    name="contrasena"
                    [type]="mostrarContrasena ? 'text' : 'password'"
                    required
                    autocomplete="current-password"
                    placeholder="••••••••"
                    class="w-full px-5 py-3 sm:py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm
                           focus:outline-none focus:ring-0 focus:border-blue-500 transition-all font-medium" />
                  <button
                    type="button"
                    (click)="mostrarContrasena = !mostrarContrasena"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 focus:outline-none p-1 rounded-lg hover:bg-white transition-all">
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

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <input type="checkbox" id="remember" class="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer">
                  <label for="remember" class="text-xs sm:text-sm font-semibold text-gray-600 cursor-pointer select-none">Recordarme</label>
                </div>
                <button type="button" (click)="mostrandoRecuperacion = true; error = ''; mensajeInfo = ''" class="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                  ¿Olvidó su contraseña?
                </button>
              </div>

              <button
                type="submit"
                [disabled]="cargando"
                class="w-full py-3 sm:py-4 bg-blue-600 text-white font-bold rounded-2xl
                       hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 
                       disabled:cursor-not-allowed transition-all transform active:scale-[0.98]">
                <div class="flex items-center justify-center gap-2">
                  <svg *ngIf="cargando" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ cargando ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
                </div>
              </button>
            </form>

            <!-- Footer -->
            <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100 text-center">
              <p class="text-xs text-gray-400 font-medium tracking-wide uppercase">
                © 2026 SISS Honduras. Todos los derechos reservados.
              </p>
            </div>
          </div>

          <!-- Offline Indicator -->
          <div *ngIf="!enLinea" class="mt-6 flex items-center justify-center gap-2 text-amber-600 bg-amber-50 py-2 rounded-xl border border-amber-100 animate-pulse">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="text-xs font-bold uppercase tracking-wider">Modo sin conexión detectado</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-fade-up { animation: fadeUp 0.8s ease-out; }
    
    @keyframes fadeIn { 
      from { opacity: 0; transform: translateY(10px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
    
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #cbd5e1;
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  imgService = inject(LoginImagesService);

  identificador = '';
  contrasena = '';
  mostrarContrasena = false;
  cargando = false;
  error = '';
  mensajeInfo = '';
  enLinea = navigator.onLine;
  mostrandoRecuperacion = false;
  mostrandoCambioObligatorio = false;
  nuevaContrasena = '';
  confirmarContrasena = '';

  asignaciones: any[] = [];
  
  // Carrusel
  imagenes: LoginImage[] = [];
  currentIndex = 0;
  configGeneral: ConfigGeneral | null = null;
  private carouselSub?: Subscription;

  ngOnInit() {
    this.cargarImagenes();
    this.cargarConfig();
    
    this.route.queryParams.subscribe(params => {
      if (params['reason'] === 'inactivity') {
        const mins = params['minutes'] || 30;
        this.mensajeInfo = `Su sesión ha finalizado automáticamente debido a ${mins} minutos de inactividad por motivos de seguridad. Por favor, ingrese de nuevo.`;
      }
    });

    window.addEventListener('online', () => this.enLinea = true);
    window.addEventListener('offline', () => this.enLinea = false);
  }

  ngOnDestroy() {
    this.carouselSub?.unsubscribe();
  }

  cargarConfig() {
    this.imgService.getConfig().subscribe({
      next: (config) => {
        this.configGeneral = config;
        // const siglas = config?.siglasSistema || 'SISS';
        // this.titleService.setTitle(`${siglas} - Honduras`);
      },
      error: () => { /* Silenciar error */ }
    });
  }

  cargarImagenes() {
    this.imgService.getImages().subscribe({
      next: (imgs) => {
        this.imagenes = imgs;
        if (this.imagenes.length > 1) {
          this.iniciarCarrusel();
        }
      },
      error: () => {
        // Fallback or handle error
      }
    });
  }

  iniciarCarrusel() {
    this.carouselSub = interval(6000).subscribe(() => {
      this.currentIndex = (this.currentIndex + 1) % this.imagenes.length;
    });
  }

  setSlide(index: number) {
    this.currentIndex = index;
    // Reset timer
    this.carouselSub?.unsubscribe();
    this.iniciarCarrusel();
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
        } else if (res.requiereCambioContrasena) {
          this.mostrandoCambioObligatorio = true;
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

  enviarRecuperacion() {
    if (!this.identificador) return;

    this.cargando = true;
    this.error = '';
    this.mensajeInfo = '';

    this.auth.solicitarRecuperacion(this.identificador).subscribe({
      next: (res) => {
        this.mensajeInfo = res.mensaje || 'Se ha enviado un correo con su nueva clave temporal.';
        this.cargando = false;
        this.mostrandoRecuperacion = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al solicitar la recuperación de contraseña';
        this.cargando = false;
      }
    });
  }

  confirmarCambioContrasena() {
    if (!this.nuevaContrasena || this.nuevaContrasena !== this.confirmarContrasena) return;

    this.cargando = true;
    this.error = '';

    this.auth.cambiarContrasena(this.nuevaContrasena).subscribe({
      next: () => {
        this.mensajeInfo = 'Contraseña actualizada. Bienvenido al sistema.';
        this.mostrandoCambioObligatorio = false;
        this.cargando = false;
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al actualizar la contraseña';
        this.cargando = false;
      }
    });
  }
}
