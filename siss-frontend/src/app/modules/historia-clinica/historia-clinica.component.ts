import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HistoriaClinicaService, HistoriaClinica } from '../../core/services/historia-clinica.service';
import { PacientesService } from '../../core/services/pacientes.service';
import { CitasService } from '../../core/services/citas.service';
import { DateUtils } from '../../core/utils/date-utils';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReportePdfService } from '../../core/services/reporte-pdf.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './historia-clinica.component.html',
})
export class HistoriaClinicaComponent implements OnInit {
  private svc    = inject(HistoriaClinicaService);
  private ps     = inject(PacientesService);
  private citasSvc = inject(CitasService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private pdfSvc    = inject(ReportePdfService);
  private ns        = inject(NotificationService);

  // Vista agenda
  citas        = signal<any[]>([]);
  cargandoCitas = signal(false);
  fechaFiltro  = DateUtils.getHoyString();

  // Vista paciente
  pacienteId   = signal<number | null>(null);
  paciente     = signal<any>(null);
  consultas    = signal<HistoriaClinica[]>([]);

  // Vista Resumen (Modal)
  vistaHistorial = signal<HistoriaClinica | null>(null);
  vistaModo      = signal<'RESUMEN' | 'PDF'>('RESUMEN');
  pdfUrl         = signal<SafeResourceUrl | null>(null);
  rawPdfUrl: string | null = null;

  // Modal Confirmación No Asistió
  confirmarCitaNoAsistio = signal<any | null>(null);
  procesandoNoAsistio    = signal(false);

  // Modal Impresión (Post-Guardado / Bajo demanda)
  mostrarModalImpresion = signal(false);
  datosGuardados = signal<any>(null);

  ngOnInit() {
    const pid = history.state?.pacienteId as number | undefined;
    if (pid) {
      this.pacienteId.set(pid);
      this.cargarDatosPaciente(pid);
    } else {
      this.pacienteId.set(null);
      this.cargarAgenda();
    }
  }

  cargarAgenda() {
    if (!DateUtils.esFechaValida(this.fechaFiltro)) {
      return;
    }
    this.cargandoCitas.set(true);
    this.citasSvc.listar(this.fechaFiltro).subscribe({
      next: data => {
        const raw = Array.isArray(data) ? data : [];
        // Ordenar: ATENDIDA al final, de lo contrario por hora
        const sorted = raw.sort((a, b) => {
          if (a.estado === 'ATENDIDA' && b.estado !== 'ATENDIDA') return 1;
          if (a.estado !== 'ATENDIDA' && b.estado === 'ATENDIDA') return -1;
          return new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime();
        });
        this.citas.set(sorted);
        this.cargandoCitas.set(false);
      },
      error: () => {
        this.citas.set([]);
        this.cargandoCitas.set(false);
      },
    });
  }

  cargarDatosPaciente(pid: number) {
    this.ps.obtenerPerfil(pid).subscribe((res: any) => this.paciente.set(res.data ?? res));
    this.svc.listarPorPaciente(pid).subscribe((res: any) => this.consultas.set(res.data ?? res ?? []));
  }

  abrirHistoria(cita: any) {
    this.router.navigate(['/historia-clinica'], {
      state: { pacienteId: cita.paciente.id },
    });
  }

  nuevaConsulta(cita: any) {
    this.router.navigate(['/historia-clinica/nueva'], {
      state: { pacienteId: cita.paciente.id, citaId: cita.id, triaje: cita.triaje ?? null, especialidadId: cita.medico.especialidadId ?? null },
    });
  }

  verResumen(historiaId: number) {
    this.svc.obtenerDetalle(historiaId).subscribe({
      next: (res: any) => {
        this.vistaHistorial.set(res.data ?? res);
        this.vistaModo.set('RESUMEN');
      },
      error: () => console.error('Error al cargar detalle')
    });
  }

  async verPDF() {
    const h = this.vistaHistorial();
    if (!h) return;

    try {
      // Ya no cambiamos a modo PDF, nos quedamos en RESUMEN
      console.log('Generando PDF para historia (Apertura Directa):', h.id);
      const url = await this.pdfSvc.generarConsultaPdfUrl(h);
      console.log('[Componente] PDF generado con éxito, abriendo en nueva pestaña...');
      
      // Abrimos directamente en nueva pestaña
      window.open(url, '_blank');
      
      // Resetear estados por si acaso
      this.rawPdfUrl = url;
      this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    } catch (error: any) {
      console.error('Error al visualizar PDF:', error);
      this.ns.error('No se pudo generar el PDF: ' + (error.message || 'Error desconocido'));
      this.vistaModo.set('RESUMEN');
    }
  }

  abrirEnNuevaPestana() {
    if (this.rawPdfUrl) {
      window.open(this.rawPdfUrl, '_blank');
    }
  }

  cerrarVistaHistorial() {
    this.vistaHistorial.set(null);
    this.pdfUrl.set(null);
    this.rawPdfUrl = null;
  }

  abrirModalImpresion(historiaId: number) {
    // Abrir el modal inmediatamente para dar feedback visual
    this.mostrarModalImpresion.set(true);
    this.datosGuardados.set(null); // Limpiar datos previos

    this.svc.obtenerDetalle(historiaId).subscribe({
      next: (res: any) => {
        this.datosGuardados.set(res);
      },
      error: () => {
        this.ns.error('Error al cargar datos para impresión');
        this.mostrarModalImpresion.set(false);
      }
    });
  }

  async imprimirDocumento(tipo: string, formato: 'NORMAL' | 'POS') {
    const data = this.datosGuardados();
    if (!data) return;

    let url = '';
    try {
      switch (tipo) {
        case 'RECETA':
          url = await this.pdfSvc.generarRecetaPdfUrl(data, formato);
          break;
        case 'LABORATORIO':
          url = await this.pdfSvc.generarLaboratorioPdfUrl(data, formato);
          break;
        case 'RADIOLOGIA':
          url = await this.pdfSvc.generarRadiologiaPdfUrl(data, formato);
          break;
        case 'INCAPACIDAD':
          url = await this.pdfSvc.generarIncapacidadPdfUrl(data, formato);
          break;
        case 'REMISION':
          url = await this.pdfSvc.generarRemisionPdfUrl(data, formato);
          break;
        case 'CONSULTA':
          url = await this.pdfSvc.generarConsultaPdfUrl(data);
          break;
      }

      if (url) {
        const win = window.open(url, '_blank');
        win?.focus();
      }
    } catch (error) {
      console.error('Error generando impresión:', error);
      this.ns.error('Error al generar el documento');
    }
  }

  cerrarModalImpresion() {
    this.mostrarModalImpresion.set(false);
    this.datosGuardados.set(null);
  }

  salirPaciente() {
    this.router.navigate(['/historia-clinica']);
  }

  marcarNoAsistio(cita: any) {
    this.confirmarCitaNoAsistio.set(cita);
  }

  ejecutarNoAsistio() {
    const cita = this.confirmarCitaNoAsistio();
    if (!cita) return;

    this.procesandoNoAsistio.set(true);
    this.citasSvc.marcarNoAsistio(cita.id).subscribe({
      next: () => {
        this.ns.success('Cita marcada como no asistió');
        this.confirmarCitaNoAsistio.set(null);
        this.procesandoNoAsistio.set(false);
        this.cargarAgenda();
      },
      error: () => {
        this.ns.error('Error al actualizar el estado de la cita');
        this.procesandoNoAsistio.set(false);
      }
    });
  }

  cancelarNoAsistio() {
    this.confirmarCitaNoAsistio.set(null);
  }

  estadoBadge(estado: string): string {
    const m: Record<string, string> = {
      PROGRAMADA:  'bg-blue-100 text-blue-700',
      CONFIRMADA:  'bg-green-100 text-green-700',
      EN_SALA:     'bg-amber-100 text-amber-700',
      ATENDIDA:    'bg-gray-100 text-gray-500',
      CANCELADA:   'bg-red-100 text-red-600',
      NO_ASISTIO:  'bg-orange-100 text-orange-600',
    };
    return m[estado] ?? 'bg-gray-100 text-gray-600';
  }

  estadoBorde(estado: string): string {
    const m: Record<string, string> = {
      PROGRAMADA: 'border-l-blue-400',
      CONFIRMADA: 'border-l-green-500',
      EN_SALA:    'border-l-amber-400',
      ATENDIDA:   'border-l-gray-300',
      CANCELADA:  'border-l-red-400',
      NO_ASISTIO: 'border-l-orange-400',
    };
    return m[estado] ?? 'border-l-gray-200';
  }

  puedeAtender(estado: string) {
    return ['PROGRAMADA', 'CONFIRMADA', 'EN_SALA'].includes(estado);
  }

  triajeBadge(categoria: string): string {
    const m: Record<string, string> = {
      ROJO:    'bg-red-100 text-red-700 border-red-200',
      NARANJA: 'bg-orange-100 text-orange-700 border-orange-200',
      AMARILLO:'bg-yellow-100 text-yellow-700 border-yellow-200',
      VERDE:   'bg-green-100 text-green-700 border-green-200',
      AZUL:    'bg-blue-100 text-blue-700 border-blue-200',
    };
    return m[categoria] ?? 'bg-gray-100 text-gray-600';
  }

  triajePunto(categoria: string): string {
    const m: Record<string, string> = {
      ROJO:    'bg-red-500',
      NARANJA: 'bg-orange-500',
      AMARILLO:'bg-yellow-400',
      VERDE:   'bg-green-500',
      AZUL:    'bg-blue-500',
    };
    return m[categoria] ?? 'bg-gray-400';
  }

  imc(peso?: number | null, talla?: number | null): string {
    if (!peso || !talla) return '—';
    return (peso / Math.pow(talla / 100, 2)).toFixed(1);
  }

  calcularEdad(fecha?: string): number {
    if (!fecha) return 0;
    const naci = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - naci.getFullYear();
    const m = hoy.getMonth() - naci.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < naci.getDate())) edad--;
    return edad;
  }

  getClasificacionIMC(imcStr: string, fechaNacimiento?: string): { label: string, textColor: string, bgColor: string } | null {
    const valor = parseFloat(imcStr);
    if (isNaN(valor) || valor <= 0) return null;
    if (fechaNacimiento && this.calcularAge(fechaNacimiento) < 18) return null;

    if (valor < 18.5) return { label: 'Bajo peso', textColor: 'text-blue-700', bgColor: 'bg-blue-100/50' };
    if (valor < 25)   return { label: 'Normal',    textColor: 'text-green-700', bgColor: 'bg-green-100/50' };
    if (valor < 30)   return { label: 'Sobrepeso', textColor: 'text-amber-700', bgColor: 'bg-amber-100/50' };
    if (valor < 35)   return { label: 'Obesidad I', textColor: 'text-orange-700', bgColor: 'bg-orange-100/50' };
    if (valor < 40)   return { label: 'Obesidad II',textColor: 'text-red-700', bgColor: 'bg-red-100/50' };
    return { label: 'Obesidad III', textColor: 'text-purple-700', bgColor: 'bg-purple-100/50' };
  }

  esFechaValida(fecha: string): boolean {
    return DateUtils.esFechaValida(fecha);
  }

  private calcularAge(fecha?: string): number {
    if (!fecha) return 0;
    const naci = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - naci.getFullYear();
    const m = hoy.getMonth() - naci.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < naci.getDate())) edad--;
    return edad;
  }
}
