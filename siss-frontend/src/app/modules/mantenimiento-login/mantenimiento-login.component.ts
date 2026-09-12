import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoginImagesService, LoginImage, ConfigGeneral } from '../../core/services/login-images.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  ConfiguracionDocumento,
  ConfiguracionDocumentosService,
} from '../../core/services/configuracion-documentos.service';

interface TipoDocumentoPdf {
  codigo: string;
  nombre: string;
  descripcion: string;
}

const TIPOS_DOCUMENTO_PDF: TipoDocumentoPdf[] = [
  {
    codigo: 'HISTORIAL_UNIFICADO',
    nombre: 'Historial unificado',
    descripcion: 'Expediente clínico unificado del paciente.',
  },
  {
    codigo: 'CONSULTA_CLINICA',
    nombre: 'Consulta clínica',
    descripcion: 'Resumen y nota de una consulta médica.',
  },
  {
    codigo: 'RECETA_MEDICA',
    nombre: 'Receta médica',
    descripcion: 'Receta y tratamiento indicados al paciente.',
  },
  {
    codigo: 'SOLICITUD_LABORATORIO',
    nombre: 'Solicitud de laboratorio',
    descripcion: 'Orden para exámenes de laboratorio clínico.',
  },
  {
    codigo: 'SOLICITUD_RADIOLOGIA',
    nombre: 'Solicitud de radiología',
    descripcion: 'Orden para estudios radiológicos.',
  },
  {
    codigo: 'INCAPACIDAD_MEDICA',
    nombre: 'Constancia de incapacidad',
    descripcion: 'Constancia de incapacidad médica.',
  },
  {
    codigo: 'REFERENCIA_MEDICA',
    nombre: 'Referencia médica',
    descripcion: 'Hoja de referencia o remisión.',
  },
  {
    codigo: 'CARNET_INMUNIZACIONES',
    nombre: 'Carnet de inmunizaciones',
    descripcion: 'Carnet de vacunas del paciente.',
  },
];

@Component({
  selector: 'app-mantenimiento-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Mantenimiento de Pantalla de Login</h1>
          <p class="text-gray-500 mt-1">Gestiona la identidad del sistema y las imágenes del carrusel.</p>
        </div>
      </div>

      <!-- Configuración General -->
      <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-10">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          Identidad del Sistema
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div class="space-y-6">
            <div class="grid grid-cols-3 gap-4">
              <div class="col-span-1">
                <label class="block text-sm font-bold text-gray-700 mb-2">Siglas</label>
                <input [(ngModel)]="configGeneral.siglasSistema" type="text" placeholder="Ej: SISS" 
                       class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold uppercase">
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-bold text-gray-700 mb-2">Nombre Completo del Sistema</label>
                <input [(ngModel)]="configGeneral.nombreSistema" type="text" placeholder="Ej: Sistema Integral de..." 
                       class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
              </div>
            </div>
            <button (click)="guardarConfigGeneral()" [disabled]="cargandoConfig"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
              {{ cargandoConfig ? 'Guardando...' : 'Actualizar Identidad' }}
            </button>
          </div>

          <div class="flex items-start gap-8">
            <div class="w-32 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
              <img *ngIf="configGeneral.logoMimetype" [src]="imgService.getLogoUrl()" class="w-full h-full object-contain p-2">
              <div *ngIf="!configGeneral.logoMimetype" class="text-gray-300">
                <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
            </div>
            <div class="flex-1 space-y-4">
              <h3 class="font-bold text-gray-900">Logo Institucional</h3>
              <p class="text-sm text-gray-500">Este logo reemplazará al icono del corazón en la pantalla de login. Se recomienda formato PNG con fondo transparente.</p>
              <input type="file" (change)="onLogoSelected($event)" accept="image/*" class="hidden" #logoInput>
              <button (click)="logoInput.click()" class="text-blue-600 font-bold hover:underline">Cambiar logo</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuración de documentos PDF -->
      <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-10">
        <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-900 flex items-center gap-3">
              <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01.586-1.414l5-5A2 2 0 0114.999 2H17a2 2 0 012 2v14a2 2 0 01-2 2z"/></svg>
              Configuración de documentos PDF
            </h2>
            <p class="text-sm text-gray-500 mt-2">Crea una configuración por tipo de documento y personaliza sus textos sin modificar el código.</p>
          </div>
          <button (click)="nuevaConfigDocumento()" [disabled]="!hayTipoDocumentoDisponible() || cargandoDocumento"
                  class="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Agregar configuración
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-1 rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <p class="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Documentos configurados</p>
            <div class="space-y-2">
              <button *ngFor="let documento of configuracionesDocumento"
                      (click)="seleccionarConfigDocumento(documento)"
                      [class.border-blue-500]="documento.codigo === configDocumento.codigo && !modoNuevaConfiguracion"
                      [class.bg-blue-50]="documento.codigo === configDocumento.codigo && !modoNuevaConfiguracion"
                      [class.text-blue-900]="documento.codigo === configDocumento.codigo && !modoNuevaConfiguracion"
                      class="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-left transition-all hover:border-blue-200 hover:bg-blue-50">
                <span class="block text-sm font-bold">{{ nombreDocumento(documento.codigo) }}</span>
                <span class="mt-1 block text-xs text-gray-500">{{ descripcionDocumento(documento.codigo) }}</span>
              </button>
            </div>
            <p *ngIf="configuracionesDocumento.length === 0" class="px-3 py-5 text-sm text-gray-500">Todavía no hay documentos configurados.</p>
          </div>

          <div class="lg:col-span-2">
            <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 class="text-lg font-bold text-gray-900">{{ modoNuevaConfiguracion ? 'Nueva configuración de documento' : nombreDocumento(configDocumento.codigo) }}</h3>
                <p class="mt-1 text-sm text-gray-500">{{ modoNuevaConfiguracion ? 'Selecciona el documento que deseas configurar.' : descripcionDocumento(configDocumento.codigo) }}</p>
              </div>
              <span *ngIf="!modoNuevaConfiguracion" class="rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-xs text-gray-500">{{ configDocumento.codigo }}</span>
            </div>

            <div *ngIf="modoNuevaConfiguracion" class="mb-5">
              <label class="block text-sm font-bold text-gray-700 mb-2">Documento</label>
              <select [(ngModel)]="configDocumento.codigo" name="codigoDocumentoPdf"
                      class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
                <option *ngFor="let tipo of tiposDocumentoDisponibles" [value]="tipo.codigo" [disabled]="tipoDocumentoConfigurado(tipo.codigo)">
                  {{ tipo.nombre }}
                </option>
              </select>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Título del encabezado</label>
                <input [(ngModel)]="configDocumento.tituloEncabezado" name="tituloEncabezadoPdf" type="text" maxlength="200"
                       class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Subtítulo</label>
                <input [(ngModel)]="configDocumento.subtitulo" name="subtituloPdf" type="text" maxlength="200"
                       class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Título del visor</label>
                <input [(ngModel)]="configDocumento.tituloVisor" name="tituloVisorPdf" type="text" maxlength="160"
                       class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Nombre de descarga</label>
                <input [(ngModel)]="configDocumento.nombreArchivo" name="nombreArchivoPdf" type="text" maxlength="160"
                       class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
                <p class="text-xs text-gray-400 mt-1">Usa <code class="font-mono">&#123;expediente&#125;</code> para insertar el número de expediente.</p>
              </div>
            </div>

            <div class="mt-6 flex flex-wrap gap-3">
              <button *ngIf="modoNuevaConfiguracion" (click)="cancelarNuevaConfigDocumento()" [disabled]="cargandoDocumento"
                      class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                Cancelar
              </button>
              <button (click)="guardarConfigDocumento()" [disabled]="cargandoDocumento"
                      class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                {{ cargandoDocumento ? 'Guardando...' : (modoNuevaConfiguracion ? 'Crear configuración' : 'Guardar cambios') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center mb-8 pt-8 border-t border-gray-100">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Carrusel de Imágenes</h2>
          <p class="text-gray-500 mt-1">Gestiona las diapositivas que aparecen al lado izquierdo.</p>
        </div>
        <button (click)="mostrarModal = true; modoEdicion = false; limpiarFormulario()" 
                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nueva Imagen
        </button>
      </div>

      <!-- Grid de Imágenes -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let img of imagenes" 
             class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
          <div class="relative h-48 overflow-hidden bg-gray-100">
            <img [src]="imgService.getImageUrl(img.id)" 
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute top-4 right-4 flex gap-2">
               <span [class]="img.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'" 
                     class="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border border-white/50">
                 {{ img.activo ? 'Activa' : 'Inactiva' }}
               </span>
            </div>
          </div>
          
          <div class="p-5">
            <h3 class="font-bold text-gray-900 mb-1 truncate">{{ img.titulo || img.nombre }}</h3>
            <p class="text-xs text-gray-500 mb-4 line-clamp-2">{{ img.descripcion || 'Sin descripción' }}</p>
            
            <div class="flex items-center justify-between pt-4 border-t border-gray-50">
              <span class="text-xs font-medium text-gray-400">Orden: {{ img.orden }}</span>
              <div class="flex gap-2">
                <button (click)="editarImagen(img)" 
                        class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button (click)="eliminarImagen(img.id)" 
                        class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Estado Vacío -->
        <div *ngIf="imagenes.length === 0" class="col-span-full bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center">
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">No hay imágenes configuradas</h3>
          <p class="text-gray-500 mb-8">Sube tu primera imagen para que aparezca en el carrusel de login.</p>
          <button (click)="mostrarModal = true" class="text-blue-600 font-bold hover:underline">Sube una imagen ahora</button>
        </div>
      </div>

      <!-- Modal de Edición/Creación -->
      <div *ngIf="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in">
          <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 class="text-xl font-bold text-gray-900">{{ modoEdicion ? 'Editar Imagen' : 'Nueva Imagen del Carrusel' }}</h2>
            <button (click)="mostrarModal = false" class="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <svg class="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form (ngSubmit)="guardar()" class="p-8 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="col-span-full">
                <label class="block text-sm font-bold text-gray-700 mb-2">Título (se muestra en el carrusel)</label>
                <input [(ngModel)]="form.titulo" name="titulo" type="text" placeholder="Ej: Bienvenido al Hospital..." 
                       class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
              </div>

              <div class="col-span-full">
                <label class="block text-sm font-bold text-gray-700 mb-2">Descripción Corta</label>
                <textarea [(ngModel)]="form.descripcion" name="descripcion" rows="2" placeholder="Breve mensaje para el usuario..." 
                       class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"></textarea>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Orden de Aparición</label>
                <input [(ngModel)]="form.orden" name="orden" type="number" 
                       class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
              </div>

              <div class="flex items-end pb-3">
                 <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="form.activo" name="activo" class="w-5 h-5 rounded border-gray-300 text-blue-600">
                    <span class="text-sm font-bold text-gray-700">Imagen Activa</span>
                 </label>
              </div>

              <div *ngIf="!modoEdicion" class="col-span-full">
                <label class="block text-sm font-bold text-gray-700 mb-2">Archivo de Imagen</label>
                <div class="relative">
                  <input type="file" (change)="onFileSelected($event)" accept="image/*" class="hidden" #fileInput>
                  <button type="button" (click)="fileInput.click()" 
                          class="w-full px-4 py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all flex flex-col items-center justify-center gap-2 group">
                    <svg class="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    <span class="text-sm font-medium text-gray-500">{{ selectedFile ? selectedFile.name : 'Haz clic para seleccionar o arrastra una imagen' }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="flex gap-4 pt-6">
              <button type="button" (click)="mostrarModal = false" 
                      class="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all">
                Cancelar
              </button>
              <button type="submit" [disabled]="cargando || (!modoEdicion && !selectedFile)" 
                      class="flex-2 py-3 px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50">
                {{ cargando ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Subir y Guardar') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class MantenimientoLoginComponent implements OnInit {
  imgService = inject(LoginImagesService);
  private notify = inject(NotificationService);
  private documentosService = inject(ConfiguracionDocumentosService);

  imagenes: LoginImage[] = [];
  configGeneral: ConfigGeneral = { id: 1, siglasSistema: 'SISS', nombreSistema: 'Sistema Integral de Salud', actualizadoEn: '' };
  configDocumento: ConfiguracionDocumento = {
    id: 0,
    codigo: 'HISTORIAL_UNIFICADO',
    tituloEncabezado: 'REPÚBLICA DE HONDURAS - SECRETARÍA DE SALUD',
    subtitulo: 'EXPEDIENTE CLÍNICO UNIFICADO DEL PACIENTE',
    tituloVisor: 'Expediente clínico unificado',
    nombreArchivo: 'expediente-clinico-{expediente}.pdf',
    creadoEn: '',
    actualizadoEn: '',
  };
  configuracionesDocumento: ConfiguracionDocumento[] = [];
  readonly tiposDocumentoDisponibles = TIPOS_DOCUMENTO_PDF;
  modoNuevaConfiguracion = false;
  
  mostrarModal = false;
  modoEdicion = false;
  cargando = false;
  cargandoConfig = false;
  cargandoDocumento = false;
  selectedFile: File | null = null;
  selectedLogo: File | null = null;
  currentId: number | null = null;

  form = {
    titulo: '',
    descripcion: '',
    orden: 0,
    activo: true
  };

  ngOnInit() {
    this.cargarImagenes();
    this.cargarConfig();
    this.cargarConfiguracionesDocumento();
  }

  cargarConfig() {
    this.imgService.getConfig().subscribe({
      next: (config) => this.configGeneral = config,
      error: () => this.notify.error('Error al cargar la configuración general')
    });
  }

  guardarConfigGeneral() {
    this.cargandoConfig = true;
    const formData = new FormData();
    formData.append('siglasSistema', this.configGeneral.siglasSistema);
    formData.append('nombreSistema', this.configGeneral.nombreSistema);
    if (this.selectedLogo) {
      formData.append('logo', this.selectedLogo);
    }

    this.imgService.updateConfig(formData).subscribe({
      next: () => {
        this.notify.success('Configuración actualizada correctamente');
        this.cargandoConfig = false;
        this.selectedLogo = null;
        this.cargarConfig();
      },
      error: () => {
        this.notify.error('Error al guardar la configuración');
        this.cargandoConfig = false;
      }
    });
  }

  cargarConfiguracionesDocumento() {
    this.documentosService.listar().subscribe({
      next: (configuraciones) => {
        this.configuracionesDocumento = configuraciones;
        const seleccionada = configuraciones.find(
          (config) => config.codigo === this.configDocumento.codigo,
        ) || configuraciones[0];

        if (seleccionada) {
          this.seleccionarConfigDocumento(seleccionada);
        }
      },
      error: () => this.notify.error('Error al cargar las configuraciones de PDF'),
    });
  }

  seleccionarConfigDocumento(config: ConfiguracionDocumento) {
    this.configDocumento = { ...config };
    this.modoNuevaConfiguracion = false;
  }

  nuevaConfigDocumento() {
    const tipoDisponible = this.tiposDocumentoDisponibles.find(
      (tipo) => !this.tipoDocumentoConfigurado(tipo.codigo),
    );

    if (!tipoDisponible) {
      return;
    }

    this.configDocumento = this.crearConfiguracionPredeterminada(tipoDisponible.codigo);
    this.modoNuevaConfiguracion = true;
  }

  cancelarNuevaConfigDocumento() {
    this.modoNuevaConfiguracion = false;
    const seleccionada = this.configuracionesDocumento.find(
      (config) => config.codigo === 'HISTORIAL_UNIFICADO',
    ) || this.configuracionesDocumento[0];

    if (seleccionada) {
      this.seleccionarConfigDocumento(seleccionada);
    }
  }

  tipoDocumentoConfigurado(codigo: string) {
    return this.configuracionesDocumento.some((config) => config.codigo === codigo);
  }

  hayTipoDocumentoDisponible() {
    return this.tiposDocumentoDisponibles.some(
      (tipo) => !this.tipoDocumentoConfigurado(tipo.codigo),
    );
  }

  nombreDocumento(codigo: string) {
    return this.tiposDocumentoDisponibles.find((tipo) => tipo.codigo === codigo)?.nombre
      || codigo.replace(/_/g, ' ');
  }

  descripcionDocumento(codigo: string) {
    return this.tiposDocumentoDisponibles.find((tipo) => tipo.codigo === codigo)?.descripcion
      || 'Configuración de documento PDF.';
  }

  private crearConfiguracionPredeterminada(codigo: string): ConfiguracionDocumento {
    const configuracionesPredeterminadas: Record<string, Pick<
      ConfiguracionDocumento,
      'tituloEncabezado' | 'subtitulo' | 'tituloVisor' | 'nombreArchivo'
    >> = {
      HISTORIAL_UNIFICADO: {
        tituloEncabezado: 'REPÚBLICA DE HONDURAS - SECRETARÍA DE SALUD',
        subtitulo: 'EXPEDIENTE CLÍNICO UNIFICADO DEL PACIENTE',
        tituloVisor: 'Expediente clínico unificado',
        nombreArchivo: 'expediente-clinico-{expediente}.pdf',
      },
      CONSULTA_CLINICA: {
        tituloEncabezado: 'SISS CLÍNICO',
        subtitulo: 'CONSULTA CLÍNICA',
        tituloVisor: 'Consulta clínica',
        nombreArchivo: 'consulta-clinica-{expediente}.pdf',
      },
    };
    const predeterminada = configuracionesPredeterminadas[codigo] || {
      tituloEncabezado: 'SISS CLÍNICO',
      subtitulo: '',
      tituloVisor: this.nombreDocumento(codigo),
      nombreArchivo: `${codigo.toLowerCase().replaceAll('_', '-')}-{expediente}.pdf`,
    };

    return {
      id: 0,
      codigo,
      ...predeterminada,
      creadoEn: '',
      actualizadoEn: '',
    };
  }

  guardarConfigDocumento() {
    this.cargandoDocumento = true;
    const esNuevaConfiguracion = this.modoNuevaConfiguracion;
    const { codigo, tituloEncabezado, subtitulo, tituloVisor, nombreArchivo } = this.configDocumento;
    const datos = {
      tituloEncabezado,
      subtitulo,
      tituloVisor,
      nombreArchivo,
    };
    const solicitud = esNuevaConfiguracion
      ? this.documentosService.crear({ codigo, ...datos })
      : this.documentosService.actualizar(codigo, datos);

    solicitud.subscribe({
      next: (config) => {
        const index = this.configuracionesDocumento.findIndex((item) => item.codigo === config.codigo);
        this.configuracionesDocumento = index >= 0
          ? this.configuracionesDocumento.map((item) => item.codigo === config.codigo ? config : item)
          : [...this.configuracionesDocumento, config].sort((a, b) => a.codigo.localeCompare(b.codigo));
        this.seleccionarConfigDocumento(config);
        this.cargandoDocumento = false;
        this.notify.success(
          esNuevaConfiguracion
            ? 'Configuración de PDF creada correctamente'
            : 'Configuración del PDF actualizada correctamente',
        );
      },
      error: () => {
        this.cargandoDocumento = false;
        this.notify.error('Error al guardar la configuración del PDF');
      },
    });
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedLogo = file;
      this.guardarConfigGeneral(); // Auto-guardar al seleccionar logo
    }
  }

  cargarImagenes() {
    this.imgService.getImagesManagement().subscribe({
      next: (imgs: LoginImage[]) => {
        this.imagenes = imgs;
      },
      error: (err: any) => {
        this.notify.error('Error al cargar las imágenes');
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  limpiarFormulario() {
    this.form = {
      titulo: '',
      descripcion: '',
      orden: this.imagenes.length,
      activo: true
    };
    this.selectedFile = null;
    this.currentId = null;
  }

  editarImagen(img: LoginImage) {
    this.modoEdicion = true;
    this.currentId = img.id;
    this.form = {
      titulo: img.titulo || '',
      descripcion: img.descripcion || '',
      orden: img.orden,
      activo: img.activo
    };
    this.mostrarModal = true;
  }

  guardar() {
    this.cargando = true;
    
    if (this.modoEdicion && this.currentId) {
      this.imgService.updateImage(this.currentId, this.form).subscribe({
        next: () => {
          this.notify.success('Imagen actualizada correctamente');
          this.finalizarGuardado();
        },
        error: (err: any) => {
          this.notify.error('Error al actualizar la imagen');
          this.cargando = false;
        }
      });
    } else if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('nombre', this.selectedFile.name);
      formData.append('titulo', this.form.titulo);
      formData.append('descripcion', this.form.descripcion);
      formData.append('orden', this.form.orden.toString());

      this.imgService.uploadImage(formData).subscribe({
        next: () => {
          this.notify.success('Imagen subida correctamente');
          this.finalizarGuardado();
        },
        error: (err: any) => {
          this.notify.error('Error al subir la imagen');
          this.cargando = false;
        }
      });
    }
  }

  finalizarGuardado() {
    this.cargando = false;
    this.mostrarModal = false;
    this.limpiarFormulario();
    this.cargarImagenes();
  }

  eliminarImagen(id: number) {
    if (confirm('¿Estás seguro de eliminar esta imagen? Esta acción no se puede deshacer.')) {
      this.imgService.deleteImage(id).subscribe({
        next: () => {
          this.notify.success('Imagen eliminada');
          this.cargarImagenes();
        },
        error: (err: any) => {
          this.notify.error('Error al eliminar la imagen');
        }
      });
    }
  }
}
