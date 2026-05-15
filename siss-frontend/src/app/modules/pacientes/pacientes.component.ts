import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import * as L from 'leaflet';
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
                  <div class="flex items-center gap-2">
                    <div class="font-bold text-gray-900">{{ p.apellidos }}, {{ p.nombres }}</div>
                    <svg *ngIf="p.latitud && p.longitud" class="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" title="Paciente Georreferenciado">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
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
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">DNI (13 Dígitos) <span class="text-red-500">*</span></label>
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
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Nombres <span class="text-red-500">*</span></label>
                  <input type="text" formControlName="nombres" class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none uppercase"/>
                </div>
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Apellidos <span class="text-red-500">*</span></label>
                  <input type="text" formControlName="apellidos" class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none uppercase"/>
                </div>
                <!-- Nacimiento y Sexo -->
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha de Nacimiento <span class="text-red-500">*</span></label>
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
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Sexo <span class="text-red-500">*</span></label>
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
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Depto. Residencia <span class="text-red-500">*</span></label>
                  <select formControlName="departamentoId" class="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none font-medium">
                    <option [ngValue]="null" disabled>Seleccionar depto...</option>
                    <option *ngFor="let d of departamentos()" [ngValue]="d.id">{{ d.nombre }}</option>
                  </select>
                </div>
                <div class="md:col-span-4">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Municipio <span class="text-red-500">*</span></label>
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
                
                <div class="md:col-span-12">
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-xs font-bold text-gray-500 uppercase">Georreferenciación (Coordenadas)</label>
                    <button type="button" (click)="toggleMapa()" 
                            class="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {{ mostrarMapa() ? 'Ocultar Mapa' : 'Seleccionar en Mapa' }}
                    </button>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Latitud <span class="text-red-500">*</span></label>
                      <input type="number" formControlName="latitud" step="any" 
                             class="w-full px-4 py-2 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg text-xs transition-all outline-none"/>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Longitud <span class="text-red-500">*</span></label>
                      <input type="number" formControlName="longitud" step="any" 
                             class="w-full px-4 py-2 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg text-xs transition-all outline-none"/>
                    </div>
                  </div>
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

    <!-- ═══ MODAL SELECCIONAR UBICACIÓN (MAPA) ════════════════════════════════ -->
    <div *ngIf="mostrarMapa()" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md">
      <div class="bg-white w-full max-w-5xl h-[80vh] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col scale-in">
        
        <!-- Header -->
        <div class="px-8 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-800">Georreferenciación de Residencia</h2>
              <p class="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Haga clic en el mapa o use el buscador</p>
            </div>
          </div>

          <!-- Buscador de Direcciones -->
          <div class="flex-1 max-w-md mx-8">
            <div class="relative group">
              <input type="text" #busquedaRef (keyup.enter)="buscarEnMapa(busquedaRef.value)"
                     placeholder="Ej: Aldea Villa Vieja, Francisco Morazán..."
                     class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none shadow-sm group-hover:border-blue-300"/>
              <svg class="absolute left-3 top-3 w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <button (click)="buscarEnMapa(busquedaRef.value)" 
                      class="absolute right-2 top-1.5 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-all">
                BUSCAR
              </button>
            </div>
          </div>

          <button (click)="toggleMapa()" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-all">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Map Container -->
        <div class="flex-1 relative">
          <div id="map-paciente" class="absolute inset-0"></div>
          
          <!-- Coordenadas Flotantes -->
          <div class="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-xl border border-gray-100 flex gap-6">
            <div>
              <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Latitud</p>
              <p class="text-sm font-mono font-bold text-blue-600">{{ form.get('latitud')?.value || '0.000000' }}</p>
            </div>
            <div class="w-px h-8 bg-gray-200 self-center"></div>
            <div>
              <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Longitud</p>
              <p class="text-sm font-mono font-bold text-blue-600">{{ form.get('longitud')?.value || '0.000000' }}</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button (click)="toggleMapa()" 
                  class="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-200">
            CONFIRMAR UBICACIÓN
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
  
  // Mapa
  private map?: L.Map;
  private mapMarker?: L.Marker;
  mostrarMapa = signal(false);

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
    escolaridadId: [null as number | null],
    latitud: [null as number | null, Validators.required],
    longitud: [null as number | null, Validators.required]
  });

  private notification = inject(NotificationService);

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
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
    this.form.reset();
    this.showModal.set(true);
    this.mostrarMapa.set(false);
  }

  cerrarModal() {
    this.showModal.set(false);
    this.pacienteEnEdicion.set(null);
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  toggleMapa() {
    this.mostrarMapa.set(!this.mostrarMapa());
    if (this.mostrarMapa()) {
      this.inicializarMapa();
    }
  }

  private inicializarMapa() {
    setTimeout(() => {
      if (this.map) {
        this.map.remove();
      }

      // Valores actuales o default (Tegucigalpa, Honduras)
      const lat = this.form.get('latitud')?.value || 14.0818;
      const lng = this.form.get('longitud')?.value || -87.2068;

      this.map = L.map('map-paciente').setView([lat, lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map);

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style='background-color:#2563eb; width:30px; height:30px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); border:2px solid white; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);'>
                <div style='width:10px; height:10px; background-color:white; border-radius:50%; transform:rotate(45deg);'></div>
               </div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      this.mapMarker = L.marker([lat, lng], { draggable: true, icon })
        .addTo(this.map)
        .on('dragend', (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          this.form.patchValue({
            latitud: position.lat,
            longitud: position.lng
          });
        });

      this.map.on('click', (e) => {
        const position = e.latlng;
        this.mapMarker?.setLatLng(position);
        this.form.patchValue({
          latitud: position.lat,
          longitud: position.lng
        });
      });

      // Asegurar que el mapa se renderice correctamente
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 200);
    }, 100);
  }

  buscarEnMapa(direccion: string) {
    if (!direccion || direccion.trim().length < 3) return;

    this.geo.geocodificar(direccion).subscribe({
      next: (res: any[]) => {
        if (res && res.length > 0) {
          const location = res[0];
          const lat = parseFloat(location.lat);
          const lng = parseFloat(location.lon);

          if (this.map && this.mapMarker) {
            const pos = new L.LatLng(lat, lng);
            this.map.setView(pos, 16);
            this.mapMarker.setLatLng(pos);
            
            this.form.patchValue({
              latitud: lat,
              longitud: lng
            });

            this.notification.success('Ubicación encontrada');
          }
        } else {
          this.notification.warn('No se encontró la ubicación solicitada');
        }
      },
      error: () => this.notification.error('Error al conectar con el servicio de búsqueda')
    });
  }

  editar(paciente: any) {
    this.pacienteEnEdicion.set(paciente);
    
    // Asegurar que latitud y longitud sean números para el formulario
    const lat = paciente.latitud ? parseFloat(paciente.latitud.toString()) : null;
    const lng = paciente.longitud ? parseFloat(paciente.longitud.toString()) : null;

    // Si hay depto, cargar municipios primero
    if (paciente.departamentoId) {
      this.geo.listarMunicipios(paciente.departamentoId).subscribe((res: any) => {
        this.municipios.set(res);
        // Formatear fecha para el input date (YYYY-MM-DD)
        const fecha = DateUtils.getFechaISO(paciente.fechaNacimiento);
        
        this.form.patchValue({
          ...paciente,
          fechaNacimiento: fecha,
          latitud: lat,
          longitud: lng
        });
        this.showModal.set(true);
      });
    } else {
      this.form.patchValue({
        ...paciente,
        latitud: lat,
        longitud: lng
      });
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
