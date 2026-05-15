import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ControlPrenatalService } from '../../control-prenatal.service';
import { PacientesService } from '../../../../core/services/pacientes.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { BehaviorSubject, debounceTime, distinctUntilChanged, switchMap, Subscription } from 'rxjs';

@Component({
  selector: 'app-lista-embarazadas',
  templateUrl: './lista-embarazadas.component.html',
  styleUrls: ['./lista-embarazadas.component.css'],
  standalone: false
})
export class ListaEmbarazadasComponent implements OnInit, OnDestroy {
  private controlService = inject(ControlPrenatalService);
  private pacientesService = inject(PacientesService);
  private router = inject(Router);
  
  embarazos: any[] = [];
  embarazosFiltrados: any[] = [];
  
  private searchSubject = new BehaviorSubject<string>('');
  private searchSubscription?: Subscription;

  totalEmbarazadas: number = 0;
  altoRiesgo: number = 0;
  controlesHoy: number = 0;
  mostrarFinalizados: boolean = false;

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.controlService.buscar(term))
    ).subscribe({
      next: (res: any) => {
        const rawData = res.ok ? res.data : res;
        this.procesarDatos(rawData);
      },
      error: (err) => console.error('Error en búsqueda', err)
    });

    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  onSearch(term: string) {
    this.searchSubject.next(term);
  }

  cargarDatos() {
    const term = this.searchSubject.value;
    const obs = term ? this.controlService.buscar(term) : this.controlService.getEmbarazosActivos();
    
    obs.subscribe({
      next: (res: any) => {
        const data = res.ok ? res.data : res;
        this.procesarDatos(data);
      },
      error: (err) => console.error('Error al cargar embarazos', err)
    });
  }

  private procesarDatos(data: any[]) {
    if (!Array.isArray(data)) return;

    this.embarazos = data.map(emb => {
      let semanas = 0;
      if (emb.fum) {
        const fum = new Date(emb.fum);
        const hoy = new Date();
        const diffMs = hoy.getTime() - fum.getTime();
        semanas = diffMs / (1000 * 60 * 60 * 24 * 7);
      }

      return {
        ...emb,
        semanasActuales: semanas,
        ultimoControl: emb.controles && emb.controles.length > 0 
          ? emb.controles[0].fechaControl 
          : null
      };
    });
    
    this.aplicarFiltros();
  }

  toggleFinalizados() {
    this.mostrarFinalizados = !this.mostrarFinalizados;
    this.aplicarFiltros();
  }

  private aplicarFiltros() {
    const term = this.searchSubject.value;
    // Si hay búsqueda, mostramos todo lo que coincida
    if (term || this.mostrarFinalizados) {
      this.embarazosFiltrados = [...this.embarazos];
    } else {
      // Si no hay búsqueda y no queremos ver historial, solo activos
      this.embarazosFiltrados = this.embarazos.filter(e => e.estado === 'ACTIVO');
    }
    this.actualizarStats();
  }

  actualizarStats() {
    const activos = this.embarazos.filter(e => e.estado === 'ACTIVO');
    this.totalEmbarazadas = activos.length;
    this.altoRiesgo = activos.filter(e => e.riesgo === 'ALTO').length;
    this.controlesHoy = 0;
  }

  verFicha(emb: any) {
    this.router.navigate(['/control-prenatal/ficha', emb.id]);
  }

  nuevoControl(emb: any) {
    this.router.navigate(['/control-prenatal/ficha', emb.id], { 
      queryParams: { nuevoControl: 'true' } 
    });
  }

  verCarnet(emb: any) {
    Swal.fire({
      title: 'Generando Carnet...',
      text: 'Por favor espere mientras preparamos el documento.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.controlService.exportarPdf(emb.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CARNET_PERINATAL_${emb.paciente.dni}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        Swal.close();
      },
      error: (err) => {
        console.error('Error al generar PDF', err);
        Swal.fire('Error', 'No se pudo generar el PDF del carnet', 'error');
      }
    });
  }

  async confirmarFinalizacion(emb: any) {
    const { value: formValues } = await Swal.fire({
      title: 'Finalizar Embarazo',
      html: `
        <div class="text-left">
          <p class="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">Registrar terminación del proceso gestacional</p>
          
          <div class="mb-4">
            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Fecha de Terminación</label>
            <input id="swal-fecha-fin" type="date" class="swal2-input !m-0 !w-full" value="${new Date().toISOString().split('T')[0]}">
          </div>

          <div class="mb-4">
            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Resultado / Tipo de Egreso</label>
            <select id="swal-estado-fin" class="swal2-input !m-0 !w-full">
              <option value="FINALIZADO_PARTO">FINALIZADO POR PARTO</option>
              <option value="FINALIZADO_ABORTO">FINALIZADO POR ABORTO</option>
              <option value="FINALIZADO_OBITO">FINALIZADO POR ÓBITO FETAL</option>
            </select>
          </div>

          <div class="mb-2">
            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Observaciones Finales</label>
            <textarea id="swal-obs-fin" class="swal2-textarea !m-0 !w-full" placeholder="Detalles sobre el parto, complicaciones, o motivo del aborto..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Finalizar Registro',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f43f5e', // Rose-500
      preConfirm: () => {
        const fecha = (document.getElementById('swal-fecha-fin') as HTMLInputElement).value;
        const estado = (document.getElementById('swal-estado-fin') as HTMLSelectElement).value;
        const observaciones = (document.getElementById('swal-obs-fin') as HTMLTextAreaElement).value;

        if (!observaciones || observaciones.trim().length < 5) {
          Swal.showValidationMessage('Es obligatorio ingresar observaciones detalladas sobre la finalización');
          return false;
        }

        return {
          embarazoId: emb.id,
          fechaTerminacion: fecha,
          estado: estado,
          observaciones: observaciones
        }
      }
    });

    if (formValues) {
      this.controlService.finalizarEmbarazo(formValues).subscribe({
        next: () => {
          Swal.fire('¡Cerrado!', 'El embarazo ha sido finalizado y archivado.', 'success');
          this.cargarDatos();
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo finalizar el embarazo', 'error');
        }
      });
    }
  }

  exportarSip(emb: any) {
    this.controlService.exportarSip(emb.id).subscribe({
      next: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SIP_EXPORT_${emb.paciente.dni}.json`;
        a.click();
        Swal.fire('Éxito', 'Archivo generado correctamente', 'success');
      }
    });
  }

  async abrirCaptacion() {
    const { value: paciente } = await Swal.fire({
      title: 'Captación: Buscar Paciente',
      html: `
        <div class="text-left">
          <p class="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">Búsqueda restringida a pacientes de sexo femenino</p>
          <input id="swal-search-input" class="swal2-input" style="width: 100%; margin: 0;" placeholder="Escriba DNI o Nombre...">
          <div id="swal-results" class="mt-4 max-h-60 overflow-y-auto border border-gray-100 rounded-xl"></div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      showConfirmButton: false,
      didOpen: () => {
        const input = document.getElementById('swal-search-input') as HTMLInputElement;
        const resultsDiv = document.getElementById('swal-results') as HTMLDivElement;
        
        input.addEventListener('input', (e: any) => {
          const term = e.target.value;
          if (term.length < 3) return;
          this.pacientesService.buscar(term, 1, 10, 2).subscribe(res => {
            const pacientes = res.data.data;
            resultsDiv.innerHTML = pacientes.map((p: any) => `
              <div class="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 flex flex-col" 
                   onclick="window.selectPaciente(${p.id}, '${p.nombres} ${p.apellidos}', '${p.dni}', '${p.fechaNacimiento}')">
                <span class="font-bold text-sm text-gray-900">${p.nombres} ${p.apellidos}</span>
                <span class="text-xs text-gray-500 font-mono">DNI: ${p.dni} | EXP: ${p.numeroExpediente}</span>
              </div>
            `).join('');
          });
        });

        (window as any).selectPaciente = (id: number, name: string, dni: string, birth: string) => {
          Swal.clickConfirm();
          this.abrirModalFum(id, name, dni, birth);
        };
      }
    });
  }

  async abrirModalFum(pacienteId: number, name: string, dni: string, birth: string) {
    // Calcular edad (Regla de Oro: Literal UTC)
    const fNac = new Date(birth); // Prisma ya envía ISO con Z
    const hoy = new Date();
    let edad = hoy.getUTCFullYear() - fNac.getUTCFullYear();
    const m = hoy.getUTCMonth() - fNac.getUTCMonth();
    if (m < 0 || (m === 0 && hoy.getUTCDate() < fNac.getUTCDate())) {
        edad--;
    }

    const { value: formValues } = await Swal.fire({
      title: 'Datos Obstétricos',
      html: `
        <div class="text-left p-2">
          <div class="flex justify-between items-start mb-4">
            <div class="flex flex-col">
              <span class="text-sm text-blue-600 font-bold">${name}</span>
              <span class="text-[10px] text-gray-500 font-mono">DNI: ${dni}</span>
            </div>
            <div class="bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 text-center">
              <span class="block text-[9px] font-black text-blue-400 uppercase leading-none">Edad</span>
              <span class="text-sm font-bold text-blue-700">${edad} Años</span>
            </div>
          </div>
          
          <div class="mb-4">
            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Fecha Última Menstruación (FUM)</label>
            <input id="swal-fum" type="date" class="swal2-input" style="width: 100%; margin: 0;">
          </div>

          <div id="calc-panel" class="hidden mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex justify-around text-center">
            <div>
              <span class="block text-[9px] font-bold text-blue-400 uppercase">F. Probable Parto</span>
              <span id="res-fpp" class="text-sm font-bold text-blue-700">-</span>
            </div>
            <div class="border-l border-blue-200"></div>
            <div>
              <span class="block text-[9px] font-bold text-blue-400 uppercase">Gestación Actual</span>
              <span id="res-semanas" class="text-sm font-bold text-blue-700">-</span>
            </div>
            <div class="border-l border-blue-200"></div>
            <div>
              <span class="block text-[9px] font-bold text-blue-400 uppercase">Riesgo Inicial</span>
              <span id="res-riesgo" class="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 uppercase">Pendiente</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Gravidez (G)</label>
              <input id="swal-g" type="number" class="swal2-input !m-0 !w-full" value="1">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Partos (P)</label>
              <input id="swal-p" type="number" class="swal2-input !m-0 !w-full" value="0">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Cesáreas (C)</label>
              <input id="swal-c" type="number" class="swal2-input !m-0 !w-full" value="0">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 text-rose-500">Abortos (A)</label>
              <input id="swal-a" type="number" class="swal2-input !m-0 !w-full border-rose-200" value="0">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase mb-1 text-rose-500">Óbitos (O)</label>
              <input id="swal-o" type="number" class="swal2-input !m-0 !w-full border-rose-200" value="0">
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Captación',
      didOpen: () => {
        const fumInput = document.getElementById('swal-fum') as HTMLInputElement;
        const panel = document.getElementById('calc-panel') as HTMLDivElement;
        const fppSpan = document.getElementById('res-fpp') as HTMLElement;
        const semSpan = document.getElementById('res-semanas') as HTMLElement;
        const riesgoSpan = document.getElementById('res-riesgo') as HTMLElement;
        
        const gInput = document.getElementById('swal-g') as HTMLInputElement;
        const cInput = document.getElementById('swal-c') as HTMLInputElement;
        const aInput = document.getElementById('swal-a') as HTMLInputElement;
        const oInput = document.getElementById('swal-o') as HTMLInputElement;

        const calcular = () => {
          // 1. Cálculos de FUM (FPP y Semanas - Regla de Oro: Literal UTC)
          if (fumInput.value) {
            const fum = new Date(fumInput.value + 'T00:00:00Z');
            const fpp = new Date(fum);
            fpp.setUTCDate(fpp.getUTCDate() + 7);
            fpp.setUTCMonth(fpp.getUTCMonth() - 3);
            fpp.setUTCFullYear(fpp.getUTCFullYear() + 1);

            const hoy = new Date();
            const diff = hoy.getTime() - fum.getTime();
            const semanas = diff / (1000 * 60 * 60 * 24 * 7);

            fppSpan.innerText = fpp.getUTCDate() + '/' + (fpp.getUTCMonth() + 1) + '/' + fpp.getUTCFullYear();
            semSpan.innerText = `${Math.floor(semanas)}.${Math.floor((semanas % 1) * 7)} Sem`;
            panel.classList.remove('hidden');
          } else {
            panel.classList.add('hidden');
          }

          // 2. Cálculos Obstétricos (Independientes de FUM)
          const c = parseInt(cInput.value || '0');
          const a = parseInt(aInput.value || '0');
          const o = parseInt(oInput.value || '0');
          const p = parseInt((document.getElementById('swal-p') as HTMLInputElement).value || '0');

          // Automatizar Gravidez: G = P + C + A + O + 1 (el actual)
          const gCalculada = p + c + a + o + 1;
          gInput.value = gCalculada.toString();

          // 3. Evaluación de Riesgo en tiempo real (Edad + Antecedentes)
          if (edad < 18 || edad > 35 || c >= 2 || a >= 2 || o > 0) {
            riesgoSpan.innerText = 'ALTO RIESGO';
            riesgoSpan.className = 'text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 uppercase animate-pulse';
          } else {
            riesgoSpan.innerText = 'BAJO RIESGO';
            riesgoSpan.className = 'text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase';
          }
        };

        const pInput = document.getElementById('swal-p') as HTMLInputElement;

        [fumInput, gInput, pInput, cInput, aInput, oInput].forEach(el => el.addEventListener('input', calcular));
        fumInput.addEventListener('change', calcular);
      },
      preConfirm: () => {
        const fum = (document.getElementById('swal-fum') as HTMLInputElement).value;
        if (!fum) {
          Swal.showValidationMessage('La FUM es obligatoria');
          return false;
        }

        // Regla de Oro: Enviar hora literal del cliente
        const ahora = new Date();
        const literal = new Date(ahora.getTime() - (ahora.getTimezoneOffset() * 60000)).toISOString();

        return {
          pacienteId,
          fum: fum,
          fechaLiteral: literal,
          gravidez: parseInt((document.getElementById('swal-g') as HTMLInputElement).value || '1'),
          partos: parseInt((document.getElementById('swal-p') as HTMLInputElement).value || '0'),
          cesareas: parseInt((document.getElementById('swal-c') as HTMLInputElement).value || '0'),
          abortos: parseInt((document.getElementById('swal-a') as HTMLInputElement).value || '0'),
          obitos: parseInt((document.getElementById('swal-o') as HTMLInputElement).value || '0')
        }
      }
    });

    if (formValues) {
      this.controlService.captarEmbarazo(formValues).subscribe({
        next: async () => {
          this.cargarDatos(); // Refrescar en segundo plano
          await Swal.fire({
            title: '¡Éxito!',
            text: 'Embarazo registrado correctamente y apertura de historia clínica realizada.',
            icon: 'success',
            timer: 2000,
            timerProgressBar: true
          });
        },
        error: (err) => Swal.fire('Error', err.error?.message || 'Error al guardar', 'error')
      });
    }
  }
}
