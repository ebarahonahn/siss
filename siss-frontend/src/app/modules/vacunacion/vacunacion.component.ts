
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VacunacionService } from './vacunacion.service';
import { BuscadorPacienteComponent } from '../../shared/components/buscador-paciente/buscador.component';
import { RegistroVacunaModalComponent } from './components/registro-vacuna-modal.component';
import { ReportePdfService } from '../../core/services/reporte-pdf.service';

@Component({
  selector: 'app-vacunacion',
  standalone: true,
  imports: [
    CommonModule, 
    BuscadorPacienteComponent, 
    RegistroVacunaModalComponent
  ],
  templateUrl: './vacunacion.component.html',
  styleUrls: ['./vacunacion.component.css']
})
export class VacunacionComponent implements OnInit {
  private vacService = inject(VacunacionService);
  private pdfSvc = inject(ReportePdfService);

  paciente: any = null;
  historial: any[] = [];
  loading: boolean = false;

  mostrarModalRegistro = false;
  mostrarModalLotes = false;
  mostrarModalFormato = false;
  tipoImpresion: 'INDIVIDUAL' | 'CARNET' = 'INDIVIDUAL';
  registroParaImprimir: any = null;

  ngOnInit() {
  }

  onPacienteSeleccionado(paciente: any) {
    this.paciente = paciente;
    this.cargarHistorial();
  }

  cargarHistorial() {
    if (!this.paciente) return;
    this.loading = true;
    this.vacService.obtenerHistorial(this.paciente.id).subscribe({
      next: (res: any) => {
        this.historial = res.data || res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  abrirModalRegistro() {
    this.mostrarModalRegistro = true;
  }

  imprimirComprobante(reg: any) {
    this.tipoImpresion = 'INDIVIDUAL';
    this.registroParaImprimir = reg;
    this.mostrarModalFormato = true;
  }

  imprimirCarnet() {
    this.tipoImpresion = 'CARNET';
    this.mostrarModalFormato = true;
  }

  ejecutarImpresion(formato: 'NORMAL' | 'POS') {
    if (!this.paciente) return;
    this.mostrarModalFormato = false;

    let promise: Promise<string>;

    if (this.tipoImpresion === 'INDIVIDUAL') {
      promise = formato === 'NORMAL' 
        ? this.pdfSvc.generarVacunacionPdfUrl(this.registroParaImprimir, this.paciente)
        : this.pdfSvc.generarVacunacionPosUrl(this.registroParaImprimir, this.paciente);
    } else {
      promise = formato === 'NORMAL'
        ? this.pdfSvc.generarCarnetPdfUrl(this.historial, this.paciente)
        : this.pdfSvc.generarCarnetPosUrl(this.historial, this.paciente);
    }

    promise.then(url => window.open(url, '_blank'));
  }
}
