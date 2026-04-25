import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TriajeService, CitaPendienteTriaje } from '../../core/services/triaje.service';
import { NotificationService } from '../../core/services/notification.service';
import { DateUtils } from '../../core/utils/date-utils';

const CATEGORIAS = [
  { valor: 'ROJO',     label: 'ROJO — Inmediato',        tiempo: '< 1 min',   bg: 'bg-red-600',    text: 'text-white',      ring: 'ring-red-400' },
  { valor: 'NARANJA',  label: 'NARANJA — Muy urgente',   tiempo: '≤ 10 min',  bg: 'bg-orange-500', text: 'text-white',      ring: 'ring-orange-400' },
  { valor: 'AMARILLO', label: 'AMARILLO — Urgente',      tiempo: '≤ 30 min',  bg: 'bg-yellow-400', text: 'text-yellow-900', ring: 'ring-yellow-400' },
  { valor: 'VERDE',    label: 'VERDE — Menos urgente',   tiempo: '≤ 2 h',     bg: 'bg-green-500',  text: 'text-white',      ring: 'ring-green-400' },
  { valor: 'AZUL',     label: 'AZUL — No urgente',       tiempo: '≤ 4 h',     bg: 'bg-blue-500',   text: 'text-white',      ring: 'ring-blue-400' },
];

const CONCIENCIA = [
  { valor: 'ALERTA',         label: 'A — Alerta',              desc: 'Despierto, orientado' },
  { valor: 'RESPONDE_VOZ',   label: 'V — Responde a voz',      desc: 'Abre ojos al hablarle' },
  { valor: 'RESPONDE_DOLOR', label: 'D — Responde a dolor',    desc: 'Sólo responde a estímulo' },
  { valor: 'INCONSCIENTE',   label: 'I — Inconsciente',        desc: 'Sin respuesta' },
];

@Component({
  selector: 'app-triaje',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './triaje.component.html',
})
export class TriajeComponent implements OnInit {
  private svc          = inject(TriajeService);
  private fb           = inject(FormBuilder);
  private notification = inject(NotificationService);

  citas         = signal<CitaPendienteTriaje[]>([]);
  cargando      = signal(false);
  fechaFiltro   = DateUtils.getHoyString();

  citaSeleccionada  = signal<CitaPendienteTriaje | null>(null);
  triajeCargado     = signal<any>(null);
  soloLectura       = signal(false);
  guardando         = signal(false);
  paso              = signal<'lista' | 'form'>('lista');

  readonly categorias  = CATEGORIAS;
  readonly conciencias = CONCIENCIA;

  form = this.fb.group({
    motivoConsulta:         ['', Validators.required],
    presionSistolica:       [null as number | null],
    presionDiastolica:      [null as number | null],
    frecuenciaCardiaca:     [null as number | null],
    frecuenciaRespiratoria: [null as number | null],
    temperatura:            [null as number | null],
    saturacionO2:           [null as number | null],
    glucometria:            [null as number | null],
    peso:                   [null as number | null],
    talla:                  [null as number | null, [Validators.min(0), Validators.max(999.9)]],
    escalaDolor:            [null as number | null],
    nivelConciencia:        ['ALERTA', Validators.required],
    categoria:              ['', Validators.required],
    observaciones:          [''],
  });

  private readonly labels: Record<string, string> = {
    motivoConsulta: 'Motivo de consulta',
    categoria: 'Categoría de triaje',
    nivelConciencia: 'Nivel de conciencia',
    talla: 'Talla (cm)'
  };

  imc = computed(() => {
    const p = this.form.get('peso')?.value;
    const t = this.form.get('talla')?.value;
    if (!p || !t || t === 0) return null;
    const tallaMt = t / 100;
    return (p / (tallaMt * tallaMt)).toFixed(1);
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.svc.citasPendientes(this.fechaFiltro).subscribe({
      next: data => { this.citas.set(data ?? []); this.cargando.set(false); },
      error: ()   => { this.citas.set([]); this.cargando.set(false); },
    });
  }

  iniciarTriaje(cita: CitaPendienteTriaje) {
    this.citaSeleccionada.set(cita);
    this.triajeCargado.set(null);
    this.form.reset({ nivelConciencia: 'ALERTA', categoria: '' });

    if (cita.triaje) {
      // Cargar datos existentes y abrir en modo solo lectura
      this.soloLectura.set(true);
      this.svc.obtenerPorCita(cita.id).subscribe({
        next: (t: any) => {
          this.triajeCargado.set(t);
          this.form.patchValue({
            motivoConsulta:         t.motivoConsulta,
            presionSistolica:       t.presionSistolica,
            presionDiastolica:      t.presionDiastolica,
            frecuenciaCardiaca:     t.frecuenciaCardiaca,
            frecuenciaRespiratoria: t.frecuenciaRespiratoria,
            temperatura:            t.temperatura,
            saturacionO2:           t.saturacionO2,
            glucometria:            t.glucometria,
            peso:                   t.peso,
            talla:                  t.talla,
            escalaDolor:            t.escalaDolor,
            nivelConciencia:        t.nivelConciencia,
            categoria:              t.categoria,
            observaciones:          t.observaciones ?? '',
          });
          this.form.disable();
        },
        error: () => this.notification.error('Error al cargar el triaje'),
      });
    } else {
      this.soloLectura.set(false);
      this.form.enable();
      if (cita.motivo) this.form.patchValue({ motivoConsulta: cita.motivo });
    }

    this.paso.set('form');
  }

  volver() {
    this.paso.set('lista');
    this.citaSeleccionada.set(null);
    this.triajeCargado.set(null);
    this.form.enable();
  }

  seleccionarCategoria(valor: string) {
    this.form.patchValue({ categoria: valor });
  }

  guardar() {
    if (this.form.invalid) { 
      this.form.markAllAsTouched(); 
      this.notification.warnForm(this.form, this.labels);
      return; 
    }
    const cita = this.citaSeleccionada();
    if (!cita) return;

    this.guardando.set(true);
    const v = this.form.value;

    const payload = {
      citaId: cita.id,
      motivoConsulta:         v.motivoConsulta!,
      presionSistolica:       v.presionSistolica ?? undefined,
      presionDiastolica:      v.presionDiastolica ?? undefined,
      frecuenciaCardiaca:     v.frecuenciaCardiaca ?? undefined,
      frecuenciaRespiratoria: v.frecuenciaRespiratoria ?? undefined,
      temperatura:            v.temperatura ?? undefined,
      saturacionO2:           v.saturacionO2 ?? undefined,
      glucometria:            v.glucometria ?? undefined,
      peso:                   v.peso ?? undefined,
      talla:                  v.talla ?? undefined,
      escalaDolor:            v.escalaDolor ?? undefined,
      nivelConciencia:        v.nivelConciencia!,
      categoria:              v.categoria!,
      observaciones:          v.observaciones || undefined,
    };

    this.svc.crear(payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.notification.success(`Triaje registrado — Categoría ${v.categoria}`);
        this.volver();
        this.cargar();
      },
      error: (err: any) => {
        this.guardando.set(false);
        this.notification.error(err?.error?.message ?? 'Error al guardar el triaje');
      },
    });
  }

  edad(fechaNac: string): number {
    if (!fechaNac) return 0;
    const n = new Date(fechaNac), h = new Date();
    let e = h.getFullYear() - n.getFullYear();
    const m = h.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && h.getDate() < n.getDate())) e--;
    return e;
  }

  categoriaInfo(valor: string) {
    return CATEGORIAS.find(c => c.valor === valor);
  }

  invalido(campo: string) {
    const c = this.form.get(campo);
    return c?.invalid && c?.touched;
  }

  tipoBadge(tipo: string) {
    const m: Record<string, string> = {
      CONSULTA_GENERAL: 'bg-blue-100 text-blue-700',
      ESPECIALIDAD:     'bg-purple-100 text-purple-700',
      CONTROL:          'bg-green-100 text-green-700',
      URGENCIA:         'bg-red-100 text-red-700',
    };
    return m[tipo] ?? 'bg-gray-100 text-gray-600';
  }
}
