import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-carnet-digital',
  template: `
    <div class="carnet-card printable">
      <div class="carnet-header">
        <div class="logo">SISS - Control Prenatal</div>
        <div class="title">CARNET PERINATAL</div>
      </div>
      
      <div class="carnet-content">
        <div class="patient-banner">
          <h3>{{embarazo?.paciente?.nombres}} {{embarazo?.paciente?.apellidos}}</h3>
          <span>DNI: {{embarazo?.paciente?.dni}}</span>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <label>FUM:</label>
            <span>{{embarazo?.fum | date:'dd/MM/yyyy'}}</span>
          </div>
          <div class="info-item">
            <label>FPP:</label>
            <span class="highlight">{{embarazo?.fpp | date:'dd/MM/yyyy'}}</span>
          </div>
          <div class="info-item">
            <label>RIESGO:</label>
            <span [class.risk]="embarazo?.riesgo === 'ALTO'">{{embarazo?.riesgo}}</span>
          </div>
        </div>

        <div class="controles-summary">
          <h4>Últimos Controles</h4>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Sem</th>
                <th>PA</th>
                <th>Peso</th>
                <th>AU</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of embarazo?.controles?.slice(0,5)">
                <td>{{c.fechaControl | date:'dd/MM'}}</td>
                <td>{{c.semanasGestacion | number:'1.0-0'}}</td>
                <td>{{c.taSistolica}}/{{c.taDiastolica}}</td>
                <td>{{c.peso}}kg</td>
                <td>{{c.alturaUterina}}cm</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="carnet-footer">
        Presente este carnet en cada consulta y al momento del parto.
      </div>
    </div>
  `,
  styles: [`
    .carnet-card {
      width: 100%;
      max-width: 400px;
      border: 2px solid #334155;
      border-radius: 0.5rem;
      background: white;
      font-family: 'Inter', sans-serif;
      overflow: hidden;
      margin: 1rem auto;
    }
    .carnet-header {
      background: #1e293b;
      color: white;
      padding: 0.75rem;
      text-align: center;
    }
    .logo { font-size: 0.7rem; opacity: 0.8; }
    .title { font-weight: 800; font-size: 1.1rem; letter-spacing: 1px; }
    .carnet-content { padding: 1rem; }
    .patient-banner { border-bottom: 1px solid #e2e8f0; margin-bottom: 1rem; padding-bottom: 0.5rem; }
    .patient-banner h3 { margin: 0; font-size: 1rem; color: #0f172a; }
    .patient-banner span { font-size: 0.75rem; color: #64748b; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem; }
    .info-item { display: flex; flex-direction: column; }
    .info-item label { font-size: 0.6rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    .info-item span { font-size: 0.85rem; font-weight: 600; }
    .highlight { color: #2563eb; }
    .risk { color: #dc2626; }
    .controles-summary h4 { font-size: 0.75rem; margin-bottom: 0.5rem; color: #334155; border-bottom: 1px solid #f1f5f9; }
    table { width: 100%; border-collapse: collapse; font-size: 0.7rem; }
    th { text-align: left; color: #94a3b8; padding-bottom: 0.25rem; }
    td { padding: 0.25rem 0; border-bottom: 1px solid #f8fafc; }
    .carnet-footer { background: #f8fafc; padding: 0.5rem; font-size: 0.6rem; text-align: center; color: #94a3b8; }

    @media print {
      body * { visibility: hidden; }
      .printable, .printable * { visibility: visible; }
      .printable { position: absolute; left: 0; top: 0; width: 100%; border: none; }
    }
  `],
  standalone: false
})
export class CarnetDigitalComponent {
  @Input() embarazo: any;
}
