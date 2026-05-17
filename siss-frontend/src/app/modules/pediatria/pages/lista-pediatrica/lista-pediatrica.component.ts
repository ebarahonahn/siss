import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PacientesService } from '../../../../core/services/pacientes.service';
import { BehaviorSubject, debounceTime, switchMap } from 'rxjs';

@Component({
  selector: 'app-lista-pediatrica',
  standalone: false,
  template: `



    <div class="min-h-screen bg-gray-50 p-6">
      <div class="w-full mx-auto">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Módulo de Pediatría</h1>
            <p class="text-sm text-gray-500">Gestión de controles de niño sano y crecimiento</p>
          </div>
        </div>

        <!-- Buscador -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center gap-4">
          <div class="flex-1 relative">
            <svg class="w-5 h-5 absolute left-4 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              placeholder="Buscar niño por nombre o DNI..."
              (input)="onSearch($event)"
              type="text"
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none" />
          </div>
        </div>

        <!-- Tabla de Niños -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="text-left px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Expediente</th>
                <th class="text-left px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Niño / DNI</th>
                <th class="text-left px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Edad Actual</th>
                <th class="text-center px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr *ngFor="let p of pacientesFiltrados" class="hover:bg-blue-50/30 transition-colors">
                <td class="px-6 py-4">
                  <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded font-mono text-[11px] font-bold uppercase">{{ p.numeroExpediente }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="font-bold text-gray-900">{{ p.apellidos }}, {{ p.nombres }}</div>
                  <div class="text-[11px] text-gray-500 font-medium">{{ p.dni }} | {{ p.sexo?.nombre }}</div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-gray-700 font-medium">{{ calcularEdad(p.fechaNacimiento) }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button (click)="irDashboard(p.id)"
                       class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      CONTROL NIÑO SANO
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="pacientesFiltrados.length === 0">
                <td colspan="4" class="px-6 py-12 text-center text-gray-400 font-medium">
                  No se encontraron pacientes pediátricos que coincidan con la búsqueda.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ListaPediatricaComponent implements OnInit {
  private service = inject(PacientesService);
  private router = inject(Router);
  
  pacientesFiltrados: any[] = [];
  searchSubject = new BehaviorSubject<string>('');

  ngOnInit() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        switchMap((q: string) => this.service.buscar(q))
      )
      .subscribe((res: any) => {
        const todos = res?.data?.data ?? [];

        // Filtrar solo menores de 18 años
        this.pacientesFiltrados = todos.filter((p: any) => {
          const edad = this.getEdadAnos(p.fechaNacimiento);
          return edad < 18;
        });
      });
  }

  onSearch(event: any) {
    this.searchSubject.next(event.target.value);
  }

  getEdadAnos(fechaNac: string): number {
    const nac = new Date(fechaNac);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
      edad--;
    }
    return edad;
  }

  calcularEdad(fechaNac: string): string {
    const nac = new Date(fechaNac);
    const hoy = new Date();
    let años = hoy.getFullYear() - nac.getFullYear();
    let meses = hoy.getMonth() - nac.getMonth();
    if (meses < 0 || (meses === 0 && hoy.getDate() < nac.getDate())) {
      años--;
      meses += 12;
    }
    if (años === 0) return `${meses} meses`;
    return `${años} años, ${meses} meses`;
  }

  irDashboard(pacienteId: number) {
    this.router.navigate(['/pediatria/dashboard', pacienteId]);
  }
}
