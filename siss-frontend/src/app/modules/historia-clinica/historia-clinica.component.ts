import { abrirPdfEnVisor } from '../../shared/utils/pdf-viewer';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
import Swal from 'sweetalert2';

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
  citas         = signal<any[]>([]);
  cargandoCitas = signal(false);
  fechaFiltro   = DateUtils.getHoyString();
  tipoDeVista   = signal<'LISTA' | 'SEMANAL'>('LISTA');
  citasSemana   = signal<any[]>([]);
  cargandoSemana = signal(false);
  citaDetalleModal = signal<any | null>(null);

  // Vista paciente
  pacienteId   = signal<number | null>(null);
  paciente     = signal<any>(null);
  consultas    = signal<HistoriaClinica[]>([]);

  // Filtros y Paginación Vista Paciente
  filtroTexto        = signal('');
  filtroTipo         = signal<'TODAS' | 'PRENATAL' | 'ANIO_ACTUAL'>('TODAS');
  paginaActual       = signal(1);
  elementosPorPagina = signal(5);

  consultasFiltradas = computed(() => {
    const text = this.filtroTexto().toLowerCase().trim();
    const tipo = this.filtroTipo();
    const currentYear = new Date().getFullYear();

    return this.consultas().filter(c => {
      if (tipo === 'PRENATAL' && !c.controlPrenatal) return false;
      if (tipo === 'ANIO_ACTUAL') {
        const fechaAño = new Date(c.fecha).getUTCFullYear();
        if (fechaAño !== currentYear) return false;
      }

      if (text) {
        const enMedico = `${c.medico?.nombres} ${c.medico?.apellidos}`.toLowerCase().includes(text);
        const enLugar  = c.medico?.establecimiento?.nombre?.toLowerCase().includes(text) || false;
        const enDiags  = c.diagnosticos?.some(d => 
          d.codigoCIE10?.toLowerCase().includes(text) || d.descripcion?.toLowerCase().includes(text)
        ) || false;
        const enSubjetivo = c.subjetivo?.toLowerCase().includes(text) || false;

        let enFecha = false;
        if (c.fecha) {
          const d = new Date(c.fecha);
          if (!isNaN(d.getTime())) {
            const day   = String(d.getUTCDate()).padStart(2, '0');
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const year  = String(d.getUTCFullYear());
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const mesNom = meses[d.getUTCMonth()];

            enFecha = `${day}/${month}/${year}`.includes(text) || 
                      `${year}-${month}-${day}`.includes(text) || 
                      `${day}-${month}-${year}`.includes(text) || 
                      `${day} ${mesNom} ${year}`.includes(text);
          }
        }

        return enMedico || enLugar || enDiags || enSubjetivo || enFecha;
      }

      return true;
    });
  });

  totalPaginas = computed(() => {
    const total = Math.ceil(this.consultasFiltradas().length / this.elementosPorPagina());
    return total > 0 ? total : 1;
  });

  consultasPaginadas = computed(() => {
    const pag = Math.min(this.paginaActual(), this.totalPaginas());
    const inicio = (pag - 1) * this.elementosPorPagina();
    return this.consultasFiltradas().slice(inicio, inicio + this.elementosPorPagina());
  });

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas()) {
      this.paginaActual.set(nuevaPagina);
    }
  }

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
    console.log('[HC] Componente cargado - v-debug-1');
    const pid = history.state?.pacienteId as number | undefined;
    if (pid) {
      this.pacienteId.set(pid);
      this.cargarDatosPaciente(pid);
    } else {
      this.pacienteId.set(null);
      this.cargarAgenda();
    }
  }

  cambiarTipoVista(modo: 'LISTA' | 'SEMANAL') {
    this.tipoDeVista.set(modo);
    if (modo === 'SEMANAL' && this.citasSemana().length === 0) {
      this.cargarSemana();
    }
  }

  get diasDeLaSemana(): { nombre: string; num: number; fechaStr: string; esHoy: boolean }[] {
    const f = DateUtils.esFechaValida(this.fechaFiltro) ? new Date(this.fechaFiltro + 'T00:00:00') : new Date();
    const dayOfWeek = f.getDay(); // 0: Dom, 1: Lun...
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const lunes = new Date(f);
    lunes.setDate(f.getDate() + diffToMon);

    const nombres = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    const hoyStr = DateUtils.getHoyString();
    const result = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      const iso = DateUtils.getFechaISO(d);
      result.push({
        nombre: nombres[i],
        num: d.getDate(),
        fechaStr: iso,
        esHoy: iso === hoyStr
      });
    }
    return result;
  }

  horasSemana = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  cargarSemana() {
    this.cargandoSemana.set(true);
    const dias = this.diasDeLaSemana;
    if (dias.length === 0) return;
    const inicio = dias[0].fechaStr;
    const fin = dias[6].fechaStr;

    this.citasSvc.listar().subscribe({
      next: (data: any[]) => {
        const list = Array.isArray(data) ? data : [];
        const filtradas = list.filter(c => {
          const iso = DateUtils.getFechaISO(c.fechaHora);
          return iso >= inicio && iso <= fin;
        });
        this.citasSemana.set(filtradas);
        this.cargandoSemana.set(false);
      },
      error: () => {
        this.citasSemana.set([]);
        this.cargandoSemana.set(false);
      }
    });
  }

  getCitasSlot(fechaStr: string, horaStr: string): any[] {
    const list = this.tipoDeVista() === 'SEMANAL' ? this.citasSemana() : this.citas();
    return list.filter(c => {
      const iso = DateUtils.getFechaISO(c.fechaHora);
      if (iso !== fechaStr) return false;
      const d = new Date(c.fechaHora);
      const hh = String(d.getUTCHours()).padStart(2, '0');
      return `${hh}:00` === horaStr;
    });
  }

  getCitaBgClass(estado: string): string {
    switch (estado) {
      case 'CONFIRMADA': return 'bg-emerald-500 text-white hover:bg-emerald-600';
      case 'EN_SALA':
      case 'PROGRAMADA':
      case 'PENDIENTE':  return 'bg-amber-500 text-white hover:bg-amber-600';
      case 'REAGENDADA': return 'bg-purple-500 text-white hover:bg-purple-600';
      case 'CANCELADA':  return 'bg-rose-500 text-white hover:bg-rose-600';
      case 'NO_ASISTIO': return 'bg-slate-500 text-white hover:bg-slate-600';
      case 'ATENDIDA':   return 'bg-blue-600 text-white hover:bg-blue-700';
      default:          return 'bg-indigo-500 text-white hover:bg-indigo-600';
    }
  }

  cargarAgenda() {
    if (!DateUtils.esFechaValida(this.fechaFiltro)) {
      return;
    }
    this.cargandoCitas.set(true);
    if (this.tipoDeVista() === 'SEMANAL') {
      this.cargarSemana();
    }
    this.citasSvc.listar(this.fechaFiltro).subscribe({
      next: data => {
        const raw = Array.isArray(data) ? data : [];
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
      console.log('[Componente] PDF generado con éxito');
      
      // Abrir el documento en el visor interno
      abrirPdfEnVisor(url);
      

    } catch (error: any) {
      console.error('Error al visualizar PDF:', error);
      this.ns.error('No se pudo generar el PDF: ' + (error.message || 'Error desconocido'));
      this.vistaModo.set('RESUMEN');
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
        abrirPdfEnVisor(url);
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

  marcarNoAsistio(cita: any, event: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    Swal.fire({
      title: '¿Confirmar inasistencia?',
      text: `Se marcará la cita de ${cita.paciente.nombres} como "No Asistió". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, marcar como No Asistió',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      backdrop: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesandoNoAsistio.set(true);
        this.citasSvc.marcarNoAsistio(cita.id).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Actualizado!',
              text: 'La cita ha sido marcada como No Asistió.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.cargarAgenda();
            this.procesandoNoAsistio.set(false);
          },
          error: (err) => {
            Swal.fire('Error', 'No se pudo actualizar la cita: ' + (err.message || 'Error desconocido'), 'error');
            this.procesandoNoAsistio.set(false);
          }
        });
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

  formatRespuesta(valor: any): string {
    if (valor === true || valor === 'true') return 'Sí';
    if (valor === false || valor === 'false') return 'No';
    if (valor === undefined || valor === null || valor === '') return '—';
    return String(valor);
  }
}
