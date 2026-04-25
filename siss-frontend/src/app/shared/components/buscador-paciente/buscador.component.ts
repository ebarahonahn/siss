
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PacientesService } from '../../../core/services/pacientes.service';
import { debounceTime, distinctUntilChanged, switchMap, BehaviorSubject, of, tap } from 'rxjs';

@Component({
  selector: 'app-buscador-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative">
      <div class="relative flex items-center">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <i class="bi bi-search text-gray-400"></i>
        </div>
        <input 
          type="text" 
          class="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-2xl text-sm font-medium transition-all outline-none shadow-sm" 
          placeholder="Buscar paciente por DNI, Nombre..."
          (input)="onInput($event)"
          #searchInput
        >
      </div>

      <!-- Resultados desplegables -->
      <div class="absolute z-[1000] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden scale-in" 
           *ngIf="resultados.length > 0">
        <div class="max-h-[350px] overflow-y-auto divide-y divide-gray-50">
          <button 
            type="button" 
            class="w-full text-left px-5 py-4 hover:bg-blue-50 transition-colors group flex items-center justify-between"
            *ngFor="let p of resultados"
            (click)="seleccionar(p)"
          >
            <div>
              <h6 class="font-bold text-gray-900 group-hover:text-blue-700 transition-colors uppercase">{{ p.nombres }} {{ p.apellidos }}</h6>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">{{ p.numeroExpediente }}</span>
                <span class="text-[11px] text-gray-400 font-medium">DNI: {{ p.dni }}</span>
              </div>
            </div>
            <i class="bi bi-chevron-right text-gray-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1"></i>
          </button>
        </div>
      </div>

      <!-- Empty / Loading States -->
      <div class="absolute z-[1000] left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 text-center animate__animated animate__fadeIn" 
           *ngIf="buscando && resultados.length === 0 && !loading">
        <i class="bi bi-emoji-frown text-2xl text-gray-300"></i>
        <p class="text-xs text-gray-500 font-bold uppercase mt-2 tracking-widest">Sin coincidencias</p>
      </div>
      
      <div class="absolute right-4 top-1/2 -translate-y-1/2" *ngIf="loading">
        <div class="animate-spin h-4 w-4 border-2 border-blue-600 border-b-transparent rounded-full"></div>
      </div>
    </div>
  `,
  styles: [`
    .scale-in { animation: scaleIn 0.2s ease-out; }
    @keyframes scaleIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class BuscadorPacienteComponent {
  private pacientesService = inject(PacientesService);
  
  @Output() pacienteSeleccionado = new EventEmitter<any>();
  
  resultados: any[] = [];
  loading: boolean = false;
  buscando: boolean = false;
  private searchSubject = new BehaviorSubject<string>('');

  constructor() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 3) {
          this.buscando = false;
          return of({ data: { data: [] } });
        }
        this.loading = true;
        this.buscando = true;
        return this.pacientesService.buscar(term);
      })
    ).subscribe({
      next: (res: any) => {
        // Estructura exacta según PacientesComponent
        this.resultados = res?.data?.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error en búsqueda:', err);
        this.resultados = [];
        this.loading = false;
      }
    });
  }

  onInput(event: any) {
    this.searchSubject.next(event.target.value);
  }

  seleccionar(paciente: any) {
    this.pacienteSeleccionado.emit(paciente);
    this.resultados = [];
    this.buscando = false;
    // El input se limpia si el padre lo desea o se queda así para referencia
  }
}
