const fs = require('fs');
let html = fs.readFileSync('c:/Proy/claude/siss/siss-frontend/src/app/modules/pediatria/pages/dashboard-nino/dashboard-nino.component.html', 'utf8');

const regex = /<!-- TAB: VACUNAS -->\s*<div class="space-y-2">\s*<label class="text-sm font-bold text-gray-600">Peso \(kg\)/;

const replaceString = `<!-- TAB: VACUNAS -->
    <div *ngSwitchCase="'vacunas'">
      <app-carnet-vacunacion-pediatrico [pacienteId]="pacienteId" [edadMeses]="edadMesesTotal"></app-carnet-vacunacion-pediatrico>
    </div>

    <!-- TAB: NUEVO CONTROL -->

    <div *ngSwitchCase="'nuevo'">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Registrar Nuevo Control de Niño Sano</h2>
        <form [formGroup]="controlForm" (ngSubmit)="guardarControl()" class="space-y-6">
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-600">Peso (kg)`;

if (regex.test(html)) {
  html = html.replace(regex, replaceString);
  fs.writeFileSync('c:/Proy/claude/siss/siss-frontend/src/app/modules/pediatria/pages/dashboard-nino/dashboard-nino.component.html', html);
  console.log('Fixed successfully');
} else {
  console.log('Regex did not match');
}
