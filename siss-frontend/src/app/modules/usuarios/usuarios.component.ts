import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { UsuariosService, UsuarioResumen } from '../../core/services/usuarios.service';

const ROLES = ['ADMIN','MEDICO','ENFERMERA','FARMACEUTICO','RECEPCIONISTA','EPIDEMIOLOGO', 'ADMIN_ESTABLECIMIENTO'];

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  private svc = inject(UsuariosService);
  private fb  = inject(FormBuilder);

  usuarios   = signal<UsuarioResumen[]>([]);
  total      = signal(0);
  pagina     = signal(1);
  limite     = signal(20);
  busqueda   = signal('');
  cargando   = signal(false);
  error      = signal('');

  modalAbierto  = signal(false);
  editandoId    = signal<number | null>(null);
  guardando     = signal(false);
  errorModal    = signal('');
  mostrarContrasena = signal(false);

  establecimientos = signal<any[]>([]);
  especialidades   = signal<any[]>([]);
  servicios        = signal<any[]>([]);
  asignaciones     = signal<any[]>([]);

  readonly roles = ROLES;

  totalPaginas = computed(() => Math.ceil(this.total() / this.limite()) || 1);

  form = this.fb.group({
    numeroEmpleado: ['', Validators.required],
    nombres:        ['', Validators.required],
    apellidos:      ['', Validators.required],
    correo:         ['', [Validators.required, Validators.email]],
    contrasena:     ['', [Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d)/)]],
    telefono:       [''],
    rol:            ['MEDICO', Validators.required],
    especialidadId: [null as number | null],
    numeroColegiado: [''],
    activo:         [true],
  });

  asigForm = this.fb.group({
    establecimientoId: [null as number | null, Validators.required],
    servicioId:        [null as number | null],
    especialidadId:    [null as number | null],
    rol:               ['MEDICO', Validators.required],
  });

  esRolMedico(rol?: string | null): boolean {
    return (rol || this.form.get('rol')?.value) === 'MEDICO';
  }

  esRolAdmin(rol?: string | null): boolean {
    return (rol || this.form.get('rol')?.value) === 'ADMIN';
  }

  ngOnInit() {
    this.cargar();
    this.cargarCatalogos();

    // Sincronizar rol de asignación con rol principal
    this.form.get('rol')?.valueChanges.subscribe(rol => {
      this.asigForm.get('rol')?.setValue(rol);
    });
  }

  cargarCatalogos() {
    this.svc.listarEstablecimientos().subscribe(res => this.establecimientos.set(res));
    this.svc.listarEspecialidades().subscribe(res => this.especialidades.set(res));
  }

  onEstablecimientoChange(id: number) {
    if (!id) { this.servicios.set([]); return; }
    this.svc.listarServicios(id).subscribe(res => this.servicios.set(res));
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.svc.listar(this.pagina(), this.limite(), this.busqueda()).subscribe({
      next: r => {
        this.usuarios.set(r.items);
        this.total.set(r.total);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar usuarios');
        this.cargando.set(false);
      },
    });
  }

  buscar(e: Event) {
    this.busqueda.set((e.target as HTMLInputElement).value);
    this.pagina.set(1);
    this.cargar();
  }

  irPagina(p: number) {
    if (p < 1 || p > this.totalPaginas()) return;
    this.pagina.set(p);
    this.cargar();
  }

  abrirCrear() {
    this.editandoId.set(null);
    this.errorModal.set('');
    this.mostrarContrasena.set(false);
    this.form.reset({ rol: 'MEDICO', activo: true });
    this.asignaciones.set([]);
    this.form.get('contrasena')!.setValidators([
      Validators.required, 
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)/)
    ]);
    this.form.get('contrasena')!.updateValueAndValidity();
    this.modalAbierto.set(true);
  }

  abrirEditar(u: UsuarioResumen) {
    this.editandoId.set(u.id);
    this.errorModal.set('');
    this.mostrarContrasena.set(false);
    this.asignaciones.set(u.asignaciones || []);
    this.form.reset({
      numeroEmpleado: u.numeroEmpleado,
      nombres: u.nombres,
      apellidos: u.apellidos,
      correo: u.correo,
      contrasena: '',
      telefono: u.telefono ?? '',
      rol: u.rol.nombre,
      especialidadId: u.especialidad?.id ?? null,
      numeroColegiado: u.numeroColegiado ?? '',
      activo: u.activo,
    });
    this.form.get('contrasena')!.setValidators([
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)/)
    ]);
    this.form.get('contrasena')!.updateValueAndValidity();
    this.modalAbierto.set(true);
  }

  agregarAsig() {
    const rolSeleccionado = this.asigForm.get('rol')?.value;
    const esMedico = rolSeleccionado === 'MEDICO';
    
    // Si no es médico, no obligar a servicio ni especialidad
    if (!esMedico) {
      this.asigForm.get('servicioId')?.clearValidators();
      this.asigForm.get('especialidadId')?.clearValidators();
    } else {
      // Para médicos, el servicio suele ser importante (ej. CONSULTA EXTERNA)
      // Pero no lo haremos obligatorio aquí por si el usuario prefiere no asignarlo aún
    }
    this.asigForm.get('servicioId')?.updateValueAndValidity();
    this.asigForm.get('especialidadId')?.updateValueAndValidity();

    if (this.asigForm.invalid) return;
    const v = this.asigForm.value;
    const userId = this.editandoId();

    if (userId) {
      this.svc.agregarAsignacion({
        usuarioId: userId,
        establecimientoId: Number(v.establecimientoId),
        servicioId: esMedico ? (v.servicioId ? Number(v.servicioId) : undefined) : undefined,
        especialidadId: esMedico ? (v.especialidadId ? Number(v.especialidadId) : undefined) : undefined,
      }).subscribe({
        next: () => {
          this.svc.obtener(userId).subscribe(u => this.asignaciones.set(u.asignaciones));
          this.asigForm.reset({ rol: this.form.get('rol')?.value });
        }
      });
    } else {
      const est = this.establecimientos().find(e => e.id == v.establecimientoId);
      const ser = this.servicios().find(s => s.id == v.servicioId);
      const esp = this.especialidades().find(e => e.id == v.especialidadId);
      
      const nueva = {
        id: Date.now(),
        establecimiento: { id: est.id, nombre: est.nombre },
        servicio: (esMedico && ser) ? { id: ser.id, catServicio: { nombre: ser.catServicio?.nombre } } : null,
        especialidad: (esMedico && esp) ? { id: esp.id, nombre: esp.nombre } : null,
        rol: { id: 0, nombre: v.rol || 'MEDICO' },
        establecimientoId: est.id,
        servicioId: esMedico ? (ser?.id || null) : null,
        especialidadId: esMedico ? (esp?.id || null) : null
      };
      this.asignaciones.update(list => [...list, nueva]);
      this.asigForm.reset({ rol: this.form.get('rol')?.value });
    }
  }

  quitarAsig(asigId: number) {
    const userId = this.editandoId();
    if (userId) {
      this.svc.quitarAsignacion(asigId).subscribe({
        next: () => {
          this.svc.obtener(userId).subscribe(u => this.asignaciones.set(u.asignaciones));
        }
      });
    } else {
      this.asignaciones.update(list => list.filter(a => a.id !== asigId));
    }
  }

  cerrarModal() { this.modalAbierto.set(false); }

  guardar() {
    if (this.form.invalid) { 
      this.form.markAllAsTouched(); 
      this.errorModal.set('Por favor, complete todos los campos requeridos correctamente.');
      return; 
    }
    
    // Auto-añadir si hay datos válidos en el form de asignación que no han sido agregados a la lista
    if (this.asigForm.valid && this.asigForm.get('establecimientoId')?.value) {
      this.agregarAsig();
    }

    if (this.asignaciones().length === 0) {
      this.errorModal.set('Debe agregar al menos una asignación de centro/servicio');
      return;
    }

    this.guardando.set(true);
    this.errorModal.set('');

    const v = this.form.value;
    const id = this.editandoId();

    const obs = id
      ? this.svc.actualizar(id, {
          nombres: v.nombres!, apellidos: v.apellidos!, correo: v.correo!,
          telefono: v.telefono || undefined,
          especialidadId: v.especialidadId ?? undefined,
          numeroColegiado: v.numeroColegiado || undefined,
          activo: v.activo!,
          contrasena: v.contrasena || undefined,
        })
      : this.svc.crear({
          numeroEmpleado: v.numeroEmpleado!,
          nombres: v.nombres!, apellidos: v.apellidos!, correo: v.correo!,
          contrasena: v.contrasena!,
          telefono: v.telefono || undefined,
          rol: v.rol!,
          asignaciones: this.asignaciones().map(a => ({
            establecimientoId: Number(a.establecimientoId),
            servicioId: a.servicioId ? Number(a.servicioId) : undefined,
            especialidadId: a.especialidadId ? Number(a.especialidadId) : undefined,
          })),
          especialidadId: v.especialidadId ?? undefined,
          numeroColegiado: v.numeroColegiado || undefined,
        });

    obs.subscribe({
      next: () => { 
        this.guardando.set(false); 
        this.cerrarModal(); 
        this.cargar(); 
      },
      error: (err: any) => {
        this.guardando.set(false);
        console.error('Error al guardar usuario:', err);
        
        let msg = 'Error al guardar';
        if (err?.error?.message) {
          msg = Array.isArray(err.error.message) 
            ? err.error.message.join(', ') 
            : err.error.message;
        } else if (err?.message) {
          msg = err.message;
        }
        
        this.errorModal.set(msg);
      },
    });
  }

  toggle(u: UsuarioResumen) {
    this.svc.toggleActivo(u.id).subscribe({ next: () => this.cargar() });
  }

  get f(): { [key: string]: AbstractControl } { return this.form.controls; }

  invalido(campo: string) {
    const c = this.form.get(campo);
    return c?.invalid && c?.touched;
  }

  rolColor(rol: string): string {
    const m: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-700',
      MEDICO: 'bg-blue-100 text-blue-700',
      ENFERMERA: 'bg-green-100 text-green-700',
      FARMACEUTICO: 'bg-purple-100 text-purple-700',
      RECEPCIONISTA: 'bg-orange-100 text-orange-700',
      EPIDEMIOLOGO: 'bg-teal-100 text-teal-700',
      ADMIN_ESTABLECIMIENTO: 'bg-indigo-100 text-indigo-700',
    };
    return m[rol] ?? 'bg-gray-100 text-gray-700';
  }
}
