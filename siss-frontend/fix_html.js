const fs = require('fs');
let html = fs.readFileSync('c:/Proy/claude/siss/siss-frontend/src/app/modules/pediatria/pages/dashboard-nino/dashboard-nino.component.html', 'utf8');
const searchString = `<!-- TAB: VACUNAS -->
            <div class="space-y-2">`;
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
            <div class="space-y-2">`;
html = html.replace(searchString, replaceString);
fs.writeFileSync('c:/Proy/claude/siss/siss-frontend/src/app/modules/pediatria/pages/dashboard-nino/dashboard-nino.component.html', html);
