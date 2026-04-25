import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-laboratorio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Laboratorio</h2>
      <div class="bg-white rounded-xl p-8 border border-gray-100 shadow-sm text-center">
        <div class="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900">Módulo en Desarrollo</h3>
        <p class="text-gray-500 mt-2">Próximamente podrá gestionar las órdenes y resultados de laboratorio.</p>
      </div>
    </div>
  `
})
export class LaboratorioComponent {}
