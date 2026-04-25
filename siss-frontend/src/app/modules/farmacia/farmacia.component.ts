import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { DispensacionService } from '../../core/services/dispensacion.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-farmacia',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './farmacia.component.html',
})
export class FarmaciaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(DispensacionService);
  private auth = inject(AuthService);
  private notification = inject(NotificationService);

  recetas = signal<any[]>([]);
  cargando = signal(false);
  error = signal('');
  
  recetaSeleccionada = signal<any | null>(null);
  form: FormGroup;
  procesando = signal(false);

  constructor() {
    this.form = this.fb.group({
      detalles: this.fb.array([])
    });
  }

  ngOnInit() {}

  buscar(event: any) {
    const term = event.target.value;
    if (term.length < 3) {
      this.recetas.set([]);
      return;
    }

    this.cargando.set(true);
    this.service.buscarRecetasPendientes(term).subscribe({
      next: (res: any) => {
        // El backend envuelve la respuesta en { ok: true, data: [...] }
        const lista = res.data || (Array.isArray(res) ? res : []);
        this.recetas.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.notification.error('Error al buscar recetas');
        this.cargando.set(false);
      }
    });
  }

  seleccionarReceta(r: any) {
    this.recetaSeleccionada.set(r);
    this.error.set('');
    
    // Limpiar form array
    const detallesArr = this.form.get('detalles') as FormArray;
    detallesArr.clear();

    // Llenar con los items de la receta
    r.detalles.forEach((d: any) => {
      const pendiente = d.cantidad - d.cantidadEntregada;
      if (pendiente > 0) {
        detallesArr.push(this.fb.group({
          detalleRecetaId: [d.id],
          medicamento: [d.medicamento.nombreGenerico],
          dosis: [`${d.dosis} - ${d.frecuencia} (${d.duracion})`],
          cantidadPrescrita: [d.cantidad],
          cantidadEntregada: [d.cantidadEntregada],
          cantidadPendiente: [pendiente],
          cantidadADispensar: [pendiente, [Validators.required, Validators.min(0), Validators.max(pendiente)]]
        }));
      }
    });
  }

  get detallesForm() {
    return (this.form.get('detalles') as FormArray).controls;
  }

  private readonly labels: Record<string, string> = {
    cantidadADispensar: 'Cantidad a dispensar'
  };

  confirmarDispensacion() {
    if (this.form.invalid) {
      this.notification.error('Verifique las cantidades ingresadas. No pueden ser negativas ni mayores a lo pendiente.');
      return;
    }

    const values = this.form.value.detalles;
    const detallesADispensar = values
      .filter((v: any) => v.cantidadADispensar > 0)
      .map((v: any) => ({
        detalleRecetaId: v.detalleRecetaId,
        cantidad: v.cantidadADispensar
      }));

    if (detallesADispensar.length === 0) {
      this.error.set('Debe dispensar al menos un medicamento');
      return;
    }

    this.procesando.set(true);
    this.service.dispensar({
      recetaId: this.recetaSeleccionada()!.id,
      detalles: detallesADispensar
    }).subscribe({
      next: () => {
        this.notification.success('Dispensación procesada con éxito');
        this.recetaSeleccionada.set(null);
        this.recetas.set([]);
        this.procesando.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al procesar la dispensación';
        this.notification.error(msg);
        this.procesando.set(false);
      }
    });
  }

  cerrarDetalle() {
    this.recetaSeleccionada.set(null);
    this.error.set('');
  }
}
