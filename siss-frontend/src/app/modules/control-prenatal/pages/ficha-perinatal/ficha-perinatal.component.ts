import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ControlPrenatalService } from '../../control-prenatal.service';
import Swal from 'sweetalert2';

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
  }

  cargarDatos() {
    console.log('Cargando datos para ID:', this.pacienteId);
    // Intentamos cargar por ID de Embarazo primero
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

    // Verificar últimos signos vitales
    if (this.embarazo.controles?.length > 0) {
        const ultimo = this.embarazo.controles[0];
        if (ultimo.taSistolica >= 140 || ultimo.taDiastolica >= 90) motivos.push('Cifras tensionales elevadas (Posible Preeclampsia)');
        if (ultimo.proteinuria) motivos.push('Proteinuria positiva');
    }

    return motivos;
  }

  // El método guardarCambios ha sido eliminado para mantener la integridad de los datos consolidados.

  async abrirModalControl() {
    if (!this.embarazo) return;

    const hoy = new Date();
    const hoyStr = new Date(hoy.getTime() - (hoy.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    const { value: formValues } = await Swal.fire({
      title: 'Registrar Control Periódico',
      html: `
        <div class="text-left p-2">
          <div class="mb-4">
            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Fecha del Control</label>
            <input id="swal-fecha" type="date" class="swal2-input !m-0 !w-full" value="${hoyStr}">
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Semanas Gestación</label>
              <input id="swal-sem" type="number" step="0.1" class="swal2-input !m-0 !w-full" value="${this.semanasGestacion.toFixed(1)}">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Peso Materno (Kg)</label>
              <input id="swal-peso" type="number" step="0.1" class="swal2-input !m-0 !w-full" placeholder="0.0">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Presión Arterial Sistólica</label>
              <input id="swal-tas" type="number" class="swal2-input !m-0 !w-full" placeholder="120">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Presión Arterial Diastólica</label>
              <input id="swal-tad" type="number" class="swal2-input !m-0 !w-full" placeholder="80">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Altura Uterina (cm)</label>
              <input id="swal-au" type="number" class="swal2-input !m-0 !w-full" placeholder="0">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Frecuencia Cardíaca Fetal (LPM)</label>
              <input id="swal-fcf" type="number" class="swal2-input !m-0 !w-full" placeholder="140">
            </div>
          </div>

          ${this.embarazo.esMultiple ? this.generarHtmlCamposFetos() : ''}

          <div class="mb-4">
            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Hallazgos / Observaciones</label>
            <div class="flex flex-wrap items-center gap-x-6 gap-y-2 mb-2">
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" id="swal-mov" class="w-4 h-4 text-blue-600 rounded"> Movimientos Fetales (+)
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" id="swal-edema" class="w-4 h-4 text-rose-600 rounded"> Edema Materno
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" id="swal-prot" class="w-4 h-4 text-amber-600 rounded"> Proteinuria (+)
              </label>
            </div>
            <textarea id="swal-obs" class="swal2-textarea !m-0 !w-full" placeholder="Notas clínicas adicionales..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Control',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const fechaVal = (document.getElementById('swal-fecha') as HTMLInputElement).value;
        return {
          embarazoId: this.embarazo.id,
          fechaControl: fechaVal ? new Date(fechaVal + 'T12:00:00Z').toISOString() : new Date().toISOString(),
          semanasGestacion: parseFloat((document.getElementById('swal-sem') as HTMLInputElement).value),
          peso: parseFloat((document.getElementById('swal-peso') as HTMLInputElement).value),
          taSistolica: parseInt((document.getElementById('swal-tas') as HTMLInputElement).value),
          taDiastolica: parseInt((document.getElementById('swal-tad') as HTMLInputElement).value),
          alturaUterina: parseInt((document.getElementById('swal-au') as HTMLInputElement).value),
          fcf: parseInt((document.getElementById('swal-fcf') as HTMLInputElement).value),
          movimientosFetales: (document.getElementById('swal-mov') as HTMLInputElement).checked,
          datosFetos: this.embarazo.esMultiple ? this.obtenerDatosFetosExtra() : [],
          edema: (document.getElementById('swal-edema') as HTMLInputElement).checked,
          proteinuria: (document.getElementById('swal-prot') as HTMLInputElement).checked,
          observaciones: (document.getElementById('swal-obs') as HTMLTextAreaElement).value
        };
      }
    });

    if (formValues) {
      this.controlService.registrarControl(formValues).subscribe({
        next: () => {
          Swal.fire('Guardado', 'Control clínico registrado con éxito', 'success');
          this.cargarDatos();
        },
        error: (err) => Swal.fire('Error', 'No se pudo guardar el control', 'error')
      });
    }
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

  private generarHtmlCamposFetos(): string {
    let html = '';
    const cantidad = this.embarazo.cantidadFetos || 2;
    for (let i = 2; i <= cantidad; i++) {
        html += `
          <div class="grid grid-cols-2 gap-4 mb-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
            <div>
              <label class="block text-[10px] font-black text-blue-500 uppercase mb-1">FCF Feto ${i} (LPM)</label>
              <input id="swal-fcf-${i}" type="number" class="swal2-input !m-0 !w-full" placeholder="140">
            </div>
            <div class="flex items-center pt-4">
              <label class="flex items-center gap-2 text-sm cursor-pointer font-bold text-blue-600">
                <input type="checkbox" id="swal-mov-${i}" class="w-4 h-4 text-blue-600 rounded"> Mov. Fetales ${i} (+)
              </label>
            </div>
          </div>
        `;
    }
    return html;
  }

  private obtenerDatosFetosExtra(): any[] {
    const datos = [];
    const cantidad = this.embarazo.cantidadFetos || 2;
    for (let i = 2; i <= cantidad; i++) {
        datos.push({
            fcf: parseInt((document.getElementById(`swal-fcf-${i}`) as HTMLInputElement).value),
            movimientos: (document.getElementById(`swal-mov-${i}`) as HTMLInputElement).checked
        });
    }
    return datos;
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
}
