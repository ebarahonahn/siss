import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { ControlPrenatalService } from '../../control-prenatal.service';
import { MedicamentosService, Medicamento } from '../../../../core/services/medicamentos.service';
import { LaboratorioService, ExamenLaboratorio } from '../../../../core/services/laboratorio.service';
import { RadiologiaService, ExamenRadiologico } from '../../../../core/services/radiologia.service';
import { ReferenciasService } from '../../../../core/services/referencias.service';
import { EstablecimientosService } from '../../../../core/services/establecimientos.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CitasService } from '../../../../core/services/citas.service';
import { HistoriaClinicaService } from '../../../../core/services/historia-clinica.service';
import { DateUtils } from '../../../../core/utils/date-utils';

@Component({
  selector: 'app-ficha-perinatal',
  templateUrl: './ficha-perinatal.component.html',
  styleUrls: ['./ficha-perinatal.component.css'],
  standalone: false
})
export class FichaPerinatalComponent implements OnInit {
  embarazo: any;
  pacienteId: number = 0;
  semanasGestacion: number = 0;

  // Reactividad del formulario de registro
  mostrarFormularioControl = false;
  controlForm!: FormGroup;
  referenciaForm!: FormGroup;
  citaForm!: FormGroup;
  guardando: boolean = false;
  enviando = signal(false);

  // Señales de paneles de órdenes
  panelRecetas = signal(false);
  panelLaboratorio = signal(false);
  panelRadiologia = signal(false);
  panelIncapacidades = signal(false);
  panelReferencias = signal(false);
  panelCita = signal(false);

  // Catalogos / Modales
  modalLab = signal(false);
  modalRad = signal(false);
  modalReferencia = signal(false);
  modalCita = signal(false);
  modalMed = signal(false);
  idxMed = 0;
  med$ = new Subject<string>();
  medSugerencias = signal<Medicamento[]>([]);
  labSugerencias = signal<ExamenLaboratorio[]>([]);
  estudiosRad = signal<ExamenRadiologico[]>([]);
  referenciasCreadas = signal<any[]>([]);
  proximaCitaData = signal<any>(null);
  proximaCitaResumen = signal<string | null>(null);

  establecimientosList = signal<any[]>([]);
  categoriasLab = signal<string[]>([]);
  categoriasRad = signal<string[]>([]);

  // Para ver detalles del control
  modalVerControl = signal<any>(null);

  // Servicios Inyectados
  private fb = inject(FormBuilder);
  private medSvc = inject(MedicamentosService);
  private labSvc = inject(LaboratorioService);
  private radSvc = inject(RadiologiaService);
  private refSvc = inject(ReferenciasService);
  private estSvc = inject(EstablecimientosService);
  private auth = inject(AuthService);
  private notification = inject(NotificationService);
  private citasSvc = inject(CitasService);
  private historiaSvc = inject(HistoriaClinicaService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private controlService: ControlPrenatalService
  ) { }

  ngOnInit(): void {
    console.log('Iniciando FichaPerinatalComponent');
    this.route.params.subscribe(params => {
      const id = +params['id'];
      console.log('ID recibido en ruta:', id);
      if (id) {
        this.pacienteId = id;
        this.cargarDatos();
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['nuevoControl'] === 'true') {
        setTimeout(() => this.abrirModalControl(), 1000);
      }
    });

    this.setupBusquedaMedicamentos();
    this.cargarCatalogosLaboratorio();
    this.cargarCatalogosRadiologia();
    this.cargarEstablecimientos();
  }

  get recetasArr(): FormArray { return this.controlForm.get('recetas') as FormArray; }
  get laboratorioArr(): FormArray { return this.controlForm.get('laboratorio') as FormArray; }
  get radiologiaArr(): FormArray { return this.controlForm.get('radiologia') as FormArray; }
  get incapacidadesArr(): FormArray { return this.controlForm.get('incapacidades') as FormArray; }
  get datosFetosArr(): FormArray { return this.controlForm.get('datosFetos') as FormArray; }

  initForm() {
    this.controlForm = this.fb.group({
      fechaControl: [DateUtils.getHoyString(), Validators.required],
      semanasGestacion: [null, [Validators.required, Validators.min(0), Validators.max(45)]],
      peso: ['', [Validators.required, Validators.min(10)]],
      taSistolica: ['', [Validators.required, Validators.min(40), Validators.max(250)]],
      taDiastolica: ['', [Validators.required, Validators.min(30), Validators.max(160)]],
      alturaUterina: [null],
      fcf: [null],
      movimientosFetales: [true],
      edema: [false],
      proteinuria: [false],
      observaciones: ['', Validators.required],
      
      datosFetos: this.fb.array([]),
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
      motivo: ['Control Prenatal']
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
    console.log('Cargando datos para ID:', this.pacienteId);
    this.controlService.getEmbarazoById(this.pacienteId).subscribe({
      next: (res: any) => {
        const data = res.ok ? res.data : res;
        console.log('Respuesta recibida:', data);
        
        if (data && data.pacienteId) {
          this.embarazo = data;
          this.pacienteId = this.embarazo.pacienteId;
          this.calcularSemanas();
        } else {
          console.log('No es un ID de embarazo, intentando como pacienteId...');
          this.cargarActivoPorPaciente();
        }
      },
      error: (err) => {
        console.warn('Error al cargar por ID de embarazo, intentando fallback...', err);
        this.cargarActivoPorPaciente();
      }
    });
  }

  private cargarActivoPorPaciente() {
    this.controlService.getEmbarazoActivo(this.pacienteId).subscribe({
      next: (res: any) => {
        this.embarazo = res.ok ? res.data : res;
        if (this.embarazo) {
          this.calcularSemanas();
        } else {
          Swal.fire('Atención', 'No se encontró un expediente de embarazo para esta selección.', 'warning');
          this.router.navigate(['/control-prenatal']);
        }
      },
      error: (err) => {
        console.error('Error crítico al cargar datos en Ficha', err);
        Swal.fire('Error', 'Hubo un problema al recuperar el expediente.', 'error');
      }
    });
  }

  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    const fNac = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fNac.getFullYear();
    const m = hoy.getMonth() - fNac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fNac.getDate())) edad--;
    return edad;
  }

  calcularSemanas() {
    if (this.embarazo && this.embarazo.fum) {
      const fum = new Date(this.embarazo.fum);
      const hoy = new Date();
      const diffTime = Math.abs(hoy.getTime() - fum.getTime());
      this.semanasGestacion = diffTime / (1000 * 60 * 60 * 24 * 7);
    }
  }

  imprimir() {
    if (!this.embarazo) return;

    Swal.fire({
      title: 'Generando PDF...',
      text: 'Espere un momento mientras preparamos la ficha oficial.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.controlService.exportarPdf(this.embarazo.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HCPB_${this.embarazo.paciente.dni}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        Swal.close();
      },
      error: (err) => {
        console.error('Error al generar PDF', err);
        Swal.fire('Error', 'No se pudo generar el reporte PDF', 'error');
      }
    });
  }

  obtenerMotivosRiesgo(): string[] {
    const motivos: string[] = [];
    if (!this.embarazo) return motivos;

    const edad = this.calcularEdad(this.embarazo.paciente.fechaNacimiento);
    if (edad < 18) motivos.push('Edad menor a 18 años (Embarazo adolescente)');
    if (edad > 35) motivos.push('Edad mayor a 35 años (Riesgo obstétrico incrementado)');
    if (this.embarazo.esMultiple) motivos.push('Embarazo múltiple (Riesgo obstétrico incrementado)');

    const ant = this.embarazo.antecedentes;
    if (ant.abortos >= 2) motivos.push('Antecedentes de 2 o más abortos');
    if (ant.cesareas >= 2) motivos.push('Antecedentes de 2 o más cesáreas');
    if (ant.complicacionesPrevias?.toLowerCase().includes('preeclampsia')) motivos.push('Historia previa de Preeclampsia');

    if (this.embarazo.controles?.length > 0) {
        const ultimo = this.embarazo.controles[0];
        if (ultimo.taSistolica >= 140 || ultimo.taDiastolica >= 90) motivos.push('Cifras tensionales elevadas (Posible Preeclampsia)');
        if (ultimo.proteinuria) motivos.push('Proteinuria positiva');
    }

    return motivos;
  }

  abrirModalControl() {
    this.mostrarFormularioControl = true;
    this.initForm();
    this.initFormsExtra();
    this.referenciasCreadas.set([]);
    this.proximaCitaData.set(null);
    this.proximaCitaResumen.set(null);

    this.controlForm.patchValue({
      fechaControl: DateUtils.getHoyString(),
      semanasGestacion: Number(this.semanasGestacion.toFixed(1))
    });

    // Fetos múltiples
    if (this.embarazo && this.embarazo.esMultiple && this.embarazo.cantidadFetos > 1) {
      this.datosFetosArr.clear();
      for (let i = 2; i <= this.embarazo.cantidadFetos; i++) {
        this.datosFetosArr.push(this.fb.group({
          fcf: [null, [Validators.required, Validators.min(50), Validators.max(250)]],
          movimientos: [true]
        }));
      }
    }

    this.scrollASeccion('seccion-nuevo-control');
  }

  cancelarFormulario() {
    this.mostrarFormularioControl = false;
  }

  guardarControl() {
    this.limpiarRecetasVacias();
    this.limpiarIncapacidadesVacias();

    if (this.controlForm.invalid) {
      this.notification.warn('Complete todos los campos requeridos del control prenatal.');
      return;
    }

    this.guardando = true;
    this.enviando.set(true);

    const values = this.controlForm.value;

    const dto = {
      embarazoId: this.embarazo.id,
      fechaControl: values.fechaControl ? new Date(values.fechaControl + 'T12:00:00Z').toISOString() : new Date().toISOString(),
      semanasGestacion: values.semanasGestacion,
      peso: values.peso,
      taSistolica: values.taSistolica ? parseInt(values.taSistolica, 10) : undefined,
      taDiastolica: values.taDiastolica ? parseInt(values.taDiastolica, 10) : undefined,
      alturaUterina: values.alturaUterina ? parseInt(values.alturaUterina, 10) : undefined,
      fcf: values.fcf ? parseInt(values.fcf, 10) : undefined,
      movimientosFetales: values.movimientosFetales,
      datosFetos: values.datosFetos,
      edema: values.edema,
      proteinuria: values.proteinuria,
      observaciones: values.observaciones,
      
      recetas: values.recetas,
      laboratorios: values.laboratorio,
      radiologias: values.radiologia,
      incapacidades: values.incapacidades,
      referencias: this.referenciasCreadas(),
      proximaCita: this.proximaCitaData() || undefined
    };

    this.controlService.registrarControl(dto).subscribe({
      next: (res) => {
        Swal.fire('Guardado', 'El control prenatal ha sido registrado exitosamente', 'success');
        this.guardando = false;
        this.enviando.set(false);
        this.mostrarFormularioControl = false;
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando = false;
        this.enviando.set(false);
        Swal.fire('Error', 'Ocurrió un error al guardar el control prenatal', 'error');
      }
    });
  }

  regresar() {
    this.router.navigate(['/control-prenatal']);
  }

  async abrirModalEdicionGestacion() {
    const { value: formValues } = await Swal.fire({
      title: 'Actualizar Datos de Gestación',
      html: `
        <div class="text-left">
          <p class="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">Modificar hallazgos de multiplicidad fetal</p>
          
          <div class="mb-4">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" id="edit-multiple" class="w-5 h-5 text-rose-600 rounded" ${this.embarazo.esMultiple ? 'checked' : ''} onchange="document.getElementById('edit-feto-count-container').classList.toggle('hidden')">
              <div class="flex flex-col">
                <span class="text-sm font-bold text-rose-700">Embarazo Múltiple</span>
                <span class="text-[10px] text-rose-500 uppercase font-black">Gemelar / Trillizos</span>
              </div>
            </label>
          </div>

          <div id="edit-feto-count-container" class="${this.embarazo.esMultiple ? '' : 'hidden'} mb-4">
            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Cantidad de Fetos</label>
            <input id="edit-feto-count" type="number" class="swal2-input !m-0 !w-full" value="${this.embarazo.cantidadFetos || 1}" min="1" max="5">
          </div>

          <div class="mb-2">
            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Justificación del Cambio</label>
            <textarea id="edit-obs" class="swal2-textarea !m-0 !w-full" placeholder="Ej: Hallazgo de segundo saco gestacional en ultrasonido de control..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const esMultiple = (document.getElementById('edit-multiple') as HTMLInputElement).checked;
        const cantidad = parseInt((document.getElementById('edit-feto-count') as HTMLInputElement).value);
        const observaciones = (document.getElementById('edit-obs') as HTMLTextAreaElement).value;

        if (!observaciones) {
          Swal.showValidationMessage('Debe ingresar una justificación para este cambio clínico');
          return false;
        }

        return {
          esMultiple,
          cantidadFetos: esMultiple ? cantidad : 1,
          observaciones
        }
      }
    });

    if (formValues) {
      this.controlService.actualizarGestacion(this.embarazo.id, formValues).subscribe({
        next: () => {
          Swal.fire('¡Actualizado!', 'Los datos de la gestación han sido actualizados.', 'success');
          this.cargarDatos();
        },
        error: (err) => Swal.fire('Error', 'No se pudo actualizar la gestación', 'error')
      });
    }
  }

  abrirPanelRecetas() {
    this.panelRecetas.set(!this.panelRecetas());
    this.panelLaboratorio.set(false);
    this.panelRadiologia.set(false);
    this.panelIncapacidades.set(false);
    this.panelReferencias.set(false);
    this.panelCita.set(false);
    this.scrollASeccion('seccion-recetas');
    if (this.panelRecetas() && this.recetasArr.length === 0) {
      this.agregarReceta();
    }
  }

  // RECETAS MÈDICAS
  agregarReceta() {
    const grupo = this.fb.group({
      medicamentoId: [null],
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

  // INCAPACIDADES
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

  scrollASeccion(id: string) {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  verDetallesControl(ctrl: any) {
    if (!ctrl.historiaClinicaId) {
      this.modalVerControl.set(ctrl);
      return;
    }

    Swal.fire({
      title: 'Cargando detalles...',
      text: 'Espere un momento mientras recuperamos el expediente del control prenatal.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.historiaSvc.obtenerDetalle(ctrl.historiaClinicaId).subscribe({
      next: (historia: any) => {
        Swal.close();
        this.modalVerControl.set({
          ...ctrl,
          historia: historia
        });
      },
      error: (err) => {
        Swal.close();
        console.error('Error al cargar detalle de historia clínica', err);
        this.modalVerControl.set(ctrl);
      }
    });
  }

  formatearFcfMultiple(ctrl: any): string {
    let base = ctrl.fcf || '-';
    if (ctrl.datosFetos && Array.isArray(ctrl.datosFetos)) {
      ctrl.datosFetos.forEach((f: any) => {
        base += ` / ${f.fcf || '-'}`;
      });
    }
    return base;
  }

  formatearMovimientosMultiple(ctrl: any): string {
    let base = ctrl.movimientosFetales ? 'SÍ' : 'NO';
    if (ctrl.datosFetos && Array.isArray(ctrl.datosFetos)) {
      ctrl.datosFetos.forEach((f: any) => {
        base += ` / ${f.movimientos ? 'SÍ' : 'NO'}`;
      });
    }
    return base;
  }

  imprimirControlIndividual(ctrl: any) {
    if (!ctrl || !ctrl.id) return;

    Swal.fire({
      title: 'Generando PDF de Consulta...',
      text: 'Espere un momento mientras preparamos el resumen clínico con sus órdenes médicas.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.controlService.exportarControlPdf(ctrl.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ControlPrenatal_${ctrl.id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        Swal.close();
      },
      error: (err) => {
        console.error('Error al generar PDF de control prenatal', err);
        Swal.close();
        Swal.fire('Error', 'No se pudo generar el resumen de consulta PDF', 'error');
      }
    });
  }
}
