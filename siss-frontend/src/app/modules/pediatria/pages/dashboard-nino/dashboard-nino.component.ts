import { abrirPdfEnVisor } from '../../../../shared/utils/pdf-viewer';
import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { PediatriaService } from '../../pediatria.service';
import { PacientesService } from '../../../../core/services/pacientes.service';
import { MedicamentosService, Medicamento } from '../../../../core/services/medicamentos.service';
import { LaboratorioService, ExamenLaboratorio } from '../../../../core/services/laboratorio.service';
import { RadiologiaService, ExamenRadiologico } from '../../../../core/services/radiologia.service';
import { ReferenciasService } from '../../../../core/services/referencias.service';
import { EstablecimientosService } from '../../../../core/services/establecimientos.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DispensacionService } from '../../../../core/services/dispensacion.service';
import { CitasService } from '../../../../core/services/citas.service';
import { ParametrosService } from '../../../../core/services/parametros.service';
import { DateUtils } from '../../../../core/utils/date-utils';

@Component({
  selector: 'app-dashboard-nino',
  standalone: false,
  templateUrl: './dashboard-nino.component.html',
  styleUrls: ['./dashboard-nino.component.css']
})
export class DashboardNinoComponent implements OnInit {
  pacienteId!: number;
  paciente: any;
  controles: any[] = [];
  activeTab: string = 'resumen';
  controlForm!: FormGroup;
  guardando: boolean = false;
  enviando = signal(false);
  edadCalculada: string = '--';
  edadMesesTotal: number = 0;
  ultimoEstadoNutricional: string = '';

  // Señales de paneles
  panelRecetas       = signal(false);
  panelIncapacidades = signal(false);
  panelLaboratorio   = signal(false);
  panelRadiologia    = signal(false);
  panelReferencias   = signal(false);
  panelCita          = signal(false);

  // Modales
  modalMed = signal(false);
  modalCIE = signal(false);
  modalLab = signal(false);
  modalRad = signal(false);
  modalReferencia = signal(false);
  modalCita = signal(false);
  modalDuplicado = signal(false);
  modalVerControl = signal<any>(null);

  // Datos
  infoDuplicado = signal<any>(null);
  medSugerencias = signal<Medicamento[]>([]);
  labSugerencias = signal<ExamenLaboratorio[]>([]);
  categoriasLab  = signal<string[]>([]);
  estudiosRad    = signal<ExamenRadiologico[]>([]);
  categoriasRad  = signal<string[]>([]);
  
  referenciasCreadas = signal<any[]>([]);
  establecimientosList = signal<any[]>([]);
  especialidadesList = signal<any[]>([
    { nombre: 'PEDIATRÍA' },
    { nombre: 'NEUROLOGÍA PEDIÁTRICA' },
    { nombre: 'CARDIOLOGÍA PEDIÁTRICA' },
    { nombre: 'CIRUGÍA PEDIÁTRICA' },
    { nombre: 'ENDOCRINOLOGÍA PEDIÁTRICA' }
  ]);

  proximaCitaData = signal<any>(null);
  proximaCitaResumen = signal<string | null>(null);
  medicosCentroList = signal<any[]>([]);
  minutosEntreConsultas = signal(15);
  esMedico = signal(false);

  mostrarFichaEpi = signal(false);
  diagNotificable = signal<any>(null);
  mostrarModalVacunaControl: boolean = false;
  vacunasRecetadas: any[] = [];

  referenciaForm!: FormGroup;
  citaForm!: FormGroup;

  idxMed = 0;
  med$ = new Subject<string>();

  // Getters para FormArrays
  get recetasArr()        { return this.controlForm.get('recetas')        as FormArray; }
  get incapacidadesArr()  { return this.controlForm.get('incapacidades')  as FormArray; }
  get laboratorioArr()    { return this.controlForm.get('laboratorio')    as FormArray; }
  get radiologiaArr()     { return this.controlForm.get('radiologia')     as FormArray; }

  get countRecetasReal() { return this.recetasArr.length; }
  get countIncapacidadesReal() { return this.incapacidadesArr.length; }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private pediatriaService: PediatriaService,
    private pacientesService: PacientesService,
    private medSvc: MedicamentosService,
    private labSvc: LaboratorioService,
    private radSvc: RadiologiaService,
    private refSvc: ReferenciasService,
    private estSvc: EstablecimientosService,
    private auth: AuthService,
    private notification: NotificationService,
    private dispSvc: DispensacionService,
    private citasSvc: CitasService,
    private paramSvc: ParametrosService
  ) {
    this.initForm();
    this.initFormsExtra();
  }

  ngOnInit(): void {
    this.pacienteId = Number(this.route.snapshot.paramMap.get('pacienteId'));
    if (this.pacienteId) {
      this.cargarDatos();
    }
    this.setupBusquedaMedicamentos();
    this.cargarCatalogosLaboratorio();
    this.cargarCatalogosRadiologia();
    this.cargarEstablecimientos();
  }

  initForm() {
    this.controlForm = this.fb.group({
      fechaControl: [DateUtils.getHoyString(), Validators.required],
      peso: ['', [Validators.required, Validators.min(0.1)]],
      talla: ['', [Validators.required, Validators.min(10)]],
      perimetroCefalico: [''],
      lactanciaMaterna: [true],
      alimentacionComp: [false],
      vitaminaA: [false],
      hierro: [false],
      desparasitacion: [false],
      observaciones: ['', Validators.required],
      
      desarrolloJson: [null],
      alertaDesarrollo: ['NORMAL'],
      
      // Arrays para Órdenes Adicionales
      recetas: this.fb.array([]),
      laboratorio: this.fb.array([]),
      radiologia: this.fb.array([]),
      incapacidades: this.fb.array([])
    });
  }

  initFormsExtra() {
    this.referenciaForm = this.fb.group({
      establecimientoDestinoId: [null, Validators.required],
      especialidadDestino: ['', Validators.required],
      motivo: ['', Validators.required],
      urgente: [false]
    });

    this.citaForm = this.fb.group({
      medicoId: [null, Validators.required],
      especialidadId: [null, Validators.required],
      fecha: [DateUtils.getHoyString(), Validators.required],
      hora: ['', Validators.required],
      motivo: ['Consulta de Seguimiento']
    });
  }

  setupBusquedaMedicamentos() {
    this.med$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 2) return of([]);
        return this.medSvc.buscar(term);
      })
    ).subscribe((res: any) => {
      // Manejar estructura { data: [] }
      const meds = Array.isArray(res) ? res : (res.data || []);
      this.medSugerencias.set(meds);
      if (meds.length > 0) this.modalMed.set(true);
    });
  }

  cargarCatalogosLaboratorio() {
    this.labSvc.listarCatalogo().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.labSugerencias.set(data);
        const catSet = new Set<string>();
        data.forEach((e: ExamenLaboratorio) => {
          if (e.categoria) catSet.add(e.categoria);
        });
        this.categoriasLab.set(Array.from(catSet).sort());
      }
    });
  }

  cargarCatalogosRadiologia() {
    this.radSvc.listarCatalogo().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.estudiosRad.set(data);
        const catSet = new Set<string>();
        data.forEach((e: ExamenRadiologico) => {
          if (e.categoria) catSet.add(e.categoria);
        });
        this.categoriasRad.set(Array.from(catSet).sort());
      }
    });
  }

  cargarEstablecimientos() {
    this.estSvc.listar().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.establecimientosList.set(data);
      }
    });
  }

  cargarDatos() {
    this.pacientesService.obtenerPerfil(this.pacienteId).subscribe({
      next: (res: any) => {
        this.paciente = res.data || res;
        this.calcularEdad();
      },
      error: (err: any) => {
        Swal.fire('Error', 'No se pudo cargar la información del paciente', 'error');
      }
    });
    this.cargarControles();
  }

  cargarControles() {
    this.pediatriaService.getControles(this.pacienteId).subscribe({
      next: (res: any) => {
        this.controles = Array.isArray(res) ? res : (res.data || []);
        if (this.controles.length > 0) {
          this.ultimoEstadoNutricional = 'Estado Nutricional: ' + this.controles[0].estadoNutricional;
        }
      }
    });
  }

  calcularEdad() {
    if (!this.paciente?.fechaNacimiento) return;
    const nac = new Date(this.paciente.fechaNacimiento);
    const hoy = new Date();
    let años = hoy.getFullYear() - nac.getFullYear();
    let meses = hoy.getMonth() - nac.getMonth();
    let dias = hoy.getDate() - nac.getDate();

    if (dias < 0) {
      meses--;
      dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    }
    if (meses < 0) {
      años--;
      meses += 12;
    }

    this.edadMesesTotal = (años * 12) + meses;
    if (años > 0) {
      this.edadCalculada = `${años} ${años === 1 ? 'año' : 'años'}, ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    } else {
      this.edadCalculada = `${meses} ${meses === 1 ? 'mes' : 'meses'}, ${dias} ${dias === 1 ? 'día' : 'días'}`;
    }
  }

  calcularIMC(): number | null {
    const peso = this.controlForm.get('peso')?.value;
    const talla = this.controlForm.get('talla')?.value / 100;
    if (peso && talla) {
      return Number((peso / (talla * talla)).toFixed(2));
    }
    return null;
  }

  sugerirEstadoNutricional(): string {
    const imc = this.calcularIMC();
    if (!imc) return '--';
    if (imc < 14) return 'Desnutrición';
    if (imc >= 14 && imc < 18) return 'Normal';
    if (imc >= 18 && imc < 22) return 'Sobrepeso';
    return 'Obesidad';
  }

  guardarControl() {
    if (this.controlForm.invalid) return;

    this.guardando = true;
    this.enviando.set(true);
    
    // Limpiar arrays vacíos
    this.limpiarRecetasVacias();
    this.limpiarIncapacidadesVacias();

    const values = this.controlForm.value;
    const imc = this.calcularIMC();
    const estado = this.sugerirEstadoNutricional();

    const { laboratorio, radiologia, incapacidades, ...baseValues } = values;

    const dto = {
      ...baseValues,
      pacienteId: this.pacienteId,
      imc: imc,
      estadoNutricional: estado,
      historiaId: 0,
      recetas: values.recetas,
      laboratorios: values.laboratorio,
      radiologias: values.radiologia,
      incapacidades: values.incapacidades,
      referencias: this.referenciasCreadas(),
      vacunasRecetadas: this.vacunasRecetadas
    };

    this.pediatriaService.registrarControl(dto).subscribe({
      next: (res) => {
        console.log('--- RESPUESTA DE GUARDAR CONTROL ---', res);
        Swal.fire('Guardado', 'El control ha sido registrado exitosamente', 'success');
        this.guardando = false;
        this.enviando.set(false);
        this.controlForm.reset({ lactanciaMaterna: true, fechaControl: DateUtils.getHoyString() });
        this.recetasArr.clear();
        this.laboratorioArr.clear();
        this.radiologiaArr.clear();
        this.incapacidadesArr.clear();
        this.referenciasCreadas.set([]);
        this.proximaCitaData.set(null);
        this.vacunasRecetadas = [];
        
        this.cargarControles();
        this.activeTab = 'resumen';
      },
      error: (err) => {
        this.guardando = false;
        this.enviando.set(false);
        Swal.fire('Error', 'Ocurrió un error al guardar el control', 'error');
      }
    });
  }

  imprimirResumen() {
    Swal.fire({
      title: 'Generando Carnet Pediátrico...',
      text: 'Por favor, espere mientras se compila el historial clínico y las gráficas.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.pediatriaService.generarPdf(this.pacienteId).subscribe({
      next: (blob: Blob) => {
        Swal.close();
        abrirPdfEnVisor(blob);
        },
      error: (err) => {
        Swal.close();
        Swal.fire('Error', 'No se pudo generar el carnet pediátrico PDF.', 'error');
      }
    });
  }

  eliminarControl(id: number) {
    Swal.fire({
      title: '¿Está seguro?',
      text: "Esta acción anulará el registro.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pediatriaService.eliminarControl(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Anulado', 'success');
            this.cargarControles();
          }
        });
      }
    });
  }

  imprimirDetalleControl(controlId: number) {
    Swal.fire({
      title: 'Generando Reporte de Consulta...',
      text: 'Por favor, espere mientras se compila el detalle de la consulta.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.pediatriaService.generarPdfControl(controlId).subscribe({
      next: (blob: Blob) => {
        Swal.close();
        abrirPdfEnVisor(blob);
        },
      error: (err) => {
        Swal.close();
        Swal.fire('Error', 'No se pudo generar el reporte de consulta PDF.', 'error');
      }
    });
  }

  // --- Funciones UI Adicionales ---
  verDetallesControl(control: any) {
    this.modalVerControl.set(control);
  }

  actualizarDesarrollo(evento: { hitos: any, alerta: string }) {
    this.controlForm.patchValue({
      desarrolloJson: evento.hitos,
      alertaDesarrollo: evento.alerta
    });
  }

  scrollASeccion(id: string) {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  cancelar() {
    this.activeTab = 'resumen';
  }

  // RECETAS
  togglePanelRecetas() {
    const abrir = !this.panelRecetas();
    if (abrir) {
      this.panelIncapacidades.set(false);
      this.panelLaboratorio.set(false);
      this.panelRadiologia.set(false);
      this.panelReferencias.set(false);
      this.limpiarIncapacidadesVacias();
      if (this.recetasArr.length === 0) this.agregarReceta();
      this.scrollASeccion('seccion-recetas');
    } else {
      this.limpiarRecetasVacias();
    }
    this.panelRecetas.set(abrir);
  }

  agregarReceta() {
    const grupo = this.fb.group({
      medicamentoId: [null, Validators.required],
      medicamento:   ['', Validators.required],
      dosis:         ['', Validators.required],
      frecuencia:    ['', Validators.required],
      duracion:      [null, [Validators.required, Validators.min(1)]],
      cantidad:      [0, [Validators.required, Validators.min(1)]],
      indicaciones:  [''],
      stock:         [0],
    });
    grupo.valueChanges.subscribe(() => this.calcularCantidad(grupo));
    this.recetasArr.push(grupo);
  }

  removerReceta(i: number) { this.recetasArr.removeAt(i); }
  
  buscarMed(idx: number, ev: Event) {
    this.idxMed = idx;
    this.med$.next((ev.target as HTMLInputElement).value);
  }

  seleccionarMed(med: Medicamento) {
    const yaExiste = this.recetasArr.controls.some((ctrl, i) =>
      i !== this.idxMed && ctrl.get('medicamentoId')?.value === med.id
    );
    if (yaExiste) {
      this.notification.warn('El medicamento ya ha sido agregado.');
      this.medSugerencias.set([]);
      this.modalMed.set(false);
      return;
    }
    this.recetasArr.at(this.idxMed).patchValue({
      medicamentoId: med.id,
      medicamento:   med.nombreGenerico,
      dosis:         med.concentracion,
      stock:         med.stock ?? 0,
    });
    this.medSugerencias.set([]);
    this.modalMed.set(false);
  }

  calcularCantidad(grupo: FormGroup) {
    const freq = grupo.get('frecuencia')?.value;
    const dur = grupo.get('duracion')?.value;
    if (freq && dur) {
      let multiplicador = 1;
      switch (freq) {
        case 'Cada 4 horas': multiplicador = 6; break;
        case 'Cada 6 horas': multiplicador = 4; break;
        case 'Cada 8 horas': multiplicador = 3; break;
        case 'Cada 12 horas': multiplicador = 2; break;
        case 'Una vez al día': multiplicador = 1; break;
        default: multiplicador = 1; break;
      }
      grupo.get('cantidad')?.setValue(multiplicador * dur, { emitEvent: false });
    }
  }

  limpiarRecetasVacias() {
    for (let i = this.recetasArr.length - 1; i >= 0; i--) {
      const v = this.recetasArr.at(i).value;
      if (!v.medicamento?.trim() && !v.medicamentoId && !v.indicaciones?.trim()) {
        this.recetasArr.removeAt(i);
      }
    }
  }

  // LABORATORIO
  togglePanelLaboratorio() {
    const abrir = !this.panelLaboratorio();
    if (abrir) {
      this.panelRecetas.set(false);
      this.panelIncapacidades.set(false);
      this.panelRadiologia.set(false);
      this.panelReferencias.set(false);
      this.limpiarRecetasVacias();
      this.scrollASeccion('seccion-laboratorio');
      if (this.laboratorioArr.length === 0) this.modalLab.set(true);
    }
    this.panelLaboratorio.set(abrir);
  }

  cerrarModalLab() {
    this.modalLab.set(false);
    this.panelLaboratorio.set(true);
  }

  filtrarLabPorCat(cat: string) {
    return this.labSugerencias().filter(e => e.categoria === cat);
  }

  estaSeleccionado(id: number): boolean {
    return this.laboratorioArr.controls.some(ctrl => ctrl.get('examenId')?.value === id);
  }

  toggleLab(ex: ExamenLaboratorio) {
    const idx = this.laboratorioArr.controls.findIndex(ctrl => ctrl.get('examenId')?.value === ex.id);
    if (idx >= 0) {
      this.laboratorioArr.removeAt(idx);
    } else {
      this.laboratorioArr.push(this.fb.group({ examenId: [ex.id], nombre: [ex.nombre], indicaciones: [ex.indicaciones] }));
    }
  }

  removerExamen(i: number) { this.laboratorioArr.removeAt(i); }

  // RADIOLOGÍA
  togglePanelRadiologia() {
    const abrir = !this.panelRadiologia();
    if (abrir) {
      this.panelRecetas.set(false);
      this.panelIncapacidades.set(false);
      this.panelLaboratorio.set(false);
      this.panelReferencias.set(false);
      this.limpiarRecetasVacias();
      this.scrollASeccion('seccion-radiologia');
      if (this.radiologiaArr.length === 0) this.modalRad.set(true);
    }
    this.panelRadiologia.set(abrir);
  }

  cerrarModalRad() {
    this.modalRad.set(false);
    this.panelRadiologia.set(true);
  }

  filtrarRadPorCat(cat: string) {
    return this.estudiosRad().filter(e => e.categoria === cat);
  }

  estaSeleccionadoRad(id: number): boolean {
    return this.radiologiaArr.controls.some(ctrl => ctrl.get('estudioId')?.value === id);
  }

  toggleRad(ex: ExamenRadiologico) {
    const idx = this.radiologiaArr.controls.findIndex(ctrl => ctrl.get('estudioId')?.value === ex.id);
    if (idx >= 0) {
      this.radiologiaArr.removeAt(idx);
    } else {
      this.radiologiaArr.push(this.fb.group({ estudioId: [ex.id], nombre: [ex.nombre], indicaciones: [ex.indicaciones] }));
    }
  }

  removerEstudioRad(i: number) { this.radiologiaArr.removeAt(i); }

  // INCAPACIDAD
  togglePanelIncapacidades() {
    const abrir = !this.panelIncapacidades();
    if (abrir) {
      this.panelRecetas.set(false);
      this.panelLaboratorio.set(false);
      this.panelRadiologia.set(false);
      this.panelReferencias.set(false);
      this.limpiarRecetasVacias();
      if (this.incapacidadesArr.length === 0) this.agregarIncapacidad();
      this.scrollASeccion('seccion-incapacidades');
    } else {
      this.limpiarIncapacidadesVacias();
    }
    this.panelIncapacidades.set(abrir);
  }

  agregarIncapacidad() {
    this.incapacidadesArr.push(this.fb.group({
      fechaInicio: ['', Validators.required],
      dias:        [null, [Validators.required, Validators.min(1)]],
      fechaFin:    [''],
      tipo:        ['LABORAL'],
      motivo:      ['', Validators.required],
    }));
  }

  removerIncapacidad(i: number) { this.incapacidadesArr.removeAt(i); }

  calcularFechaFin(i: number) {
    const grupo = this.incapacidadesArr.at(i);
    const inicio = grupo.get('fechaInicio')?.value as string;
    const dias   = grupo.get('dias')?.value as number;
    if (inicio && dias > 0) {
      const [y, m, d] = inicio.split('-').map(Number);
      const fin = new Date(y, m - 1, d);
      fin.setDate(fin.getDate() + dias - 1);
      grupo.get('fechaFin')?.setValue(DateUtils.getFechaISO(fin));
    }
  }

  limpiarIncapacidadesVacias() {
    for (let i = this.incapacidadesArr.length - 1; i >= 0; i--) {
      const v = this.incapacidadesArr.at(i).value;
      if (!v.motivo?.trim() && !v.fechaInicio && !v.dias) {
        this.incapacidadesArr.removeAt(i);
      }
    }
  }

  // REFERENCIAS
  togglePanelReferencias() {
    const abrir = !this.panelReferencias();
    if (abrir) {
      this.panelRecetas.set(false);
      this.panelIncapacidades.set(false);
      this.panelLaboratorio.set(false);
      this.panelRadiologia.set(false);
      if (this.referenciasCreadas().length === 0) this.modalReferencia.set(true);
    }
    this.panelReferencias.set(abrir);
  }

  agregarReferenciaALista(cerrarModal: boolean = true) {
    if (this.referenciaForm.invalid) return;
    const formVal = this.referenciaForm.value;
    const targetId = Number(formVal.establecimientoDestinoId);
    const estDestino = this.establecimientosList().find(e => Number(e.id) === targetId);

    this.referenciasCreadas.update(list => [...list, {
      ...formVal,
      establecimientoDestinoId: targetId,
      establecimientoNombre: estDestino?.nombre || 'Centro no identificado'
    }]);

    this.referenciaForm.reset({ establecimientoDestinoId: null, especialidadDestino: '', motivo: '', urgente: false });
    if (cerrarModal) this.modalReferencia.set(false);
  }

  removerReferencia(idx: number) {
    this.referenciasCreadas.update(list => list.filter((_, i) => i !== idx));
  }

  // CITA
  togglePanelCita() {
    const abrir = !this.panelCita();
    if (abrir && !this.proximaCitaData()) this.abrirModalCita();
    this.panelCita.set(abrir);
  }

  abrirModalCita() {
    this.modalCita.set(true);
  }

  agendarCita() {
    if (this.citaForm.invalid) return;
    const val = this.citaForm.getRawValue();
    const fechaHoraStr = `${val.fecha}T${val.hora}:00`;
    this.proximaCitaData.set(val);
    const f = new Date(fechaHoraStr);
    this.proximaCitaResumen.set(f.toLocaleString());
    this.modalCita.set(false);
  }

  removerCita() {
    this.proximaCitaData.set(null);
    this.proximaCitaResumen.set(null);
  }

  abrirModalVacunaDirecto() {
    this.mostrarModalVacunaControl = true;
  }

  recargarDatosVacunacion() {
    this.notification.success('Inmunización registrada exitosamente en el Carnet PAI.');
  }

  agregarVacunaControl(vacuna: any) {
    this.vacunasRecetadas.push(vacuna);
    this.notification.success('Vacuna añadida a la receta del paciente.');
  }

  removerVacunaControl(index: number) {
    this.vacunasRecetadas.splice(index, 1);
    this.notification.info('Vacuna removida de la receta.');
  }

  // Ficha Epidemiológica mock
  inicializarMapa() {}

}
