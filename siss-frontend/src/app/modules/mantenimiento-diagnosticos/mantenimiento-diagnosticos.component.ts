import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DiagnosticosService, CatDiagnostico } from '../../core/services/diagnosticos.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-mantenimiento-diagnosticos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mantenimiento-diagnosticos.component.html',
})
export class MantenimientoDiagnosticosComponent implements OnInit {
  private svc          = inject(DiagnosticosService);
  private fb           = inject(FormBuilder);
  private notification = inject(NotificationService);

  registros   = signal<CatDiagnostico[]>([]);
  total       = signal(0);
  pagina      = signal(1);
  readonly limite = 50;
  cargando    = signal(false);
  busqueda    = '';

  modalAbierto = signal(false);
  editando     = signal<CatDiagnostico | null>(null);
  guardando    = signal(false);

  form = this.fb.group({
    codigo:      ['', [Validators.required, Validators.maxLength(10)]],
    descripcion: ['', [Validators.required, Validators.maxLength(300)]],
    capitulo:    [''],
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.svc.listar(this.pagina(), this.limite, this.busqueda || undefined).subscribe({
      next: (res: any) => {
        const data = res.data ?? res;
        this.registros.set(Array.isArray(data) ? data : (data.data ?? []));
        this.total.set(res.total ?? data.total ?? 0);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  buscar(ev: Event) {
    this.busqueda = (ev.target as HTMLInputElement).value;
    this.pagina.set(1);
    this.cargar();
  }

  get totalPaginas() { return Math.ceil(this.total() / this.limite); }

  cambiarPagina(n: number) {
    this.pagina.set(n);
    this.cargar();
  }

  abrirCrear() {
    this.editando.set(null);
    this.form.reset();
    this.modalAbierto.set(true);
  }

  abrirEditar(r: CatDiagnostico) {
    this.editando.set(r);
    this.form.patchValue({ codigo: r.codigo, descripcion: r.descripcion, capitulo: r.capitulo ?? '' });
    this.modalAbierto.set(true);
  }

  cerrarModal() { this.modalAbierto.set(false); }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const dto = {
      codigo:      this.form.value.codigo!.toUpperCase().trim(),
      descripcion: this.form.value.descripcion!.trim(),
      capitulo:    this.form.value.capitulo?.trim() || undefined,
    };
    const op = this.editando()
      ? this.svc.actualizar(this.editando()!.id, dto)
      : this.svc.crear(dto);

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.notification.success(this.editando() ? 'Registro actualizado' : 'Código CIE-10 creado');
        this.cerrarModal();
        this.cargar();
      },
      error: (err: any) => {
        this.guardando.set(false);
        this.notification.error(err?.error?.message ?? 'Error al guardar');
      },
    });
  }

  toggleActivo(r: CatDiagnostico) {
    this.svc.actualizar(r.id, { activo: !r.activo }).subscribe({
      next: () => {
        this.notification.success(r.activo ? 'Código desactivado' : 'Código activado');
        this.registros.update(list => list.map(x => x.id === r.id ? { ...x, activo: !x.activo } : x));
      },
      error: () => this.notification.error('Error al cambiar estado'),
    });
  }
}
