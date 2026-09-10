import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RolesService, Rol } from '../../core/services/roles.service';
import { NotificationService } from '../../core/services/notification.service';

interface ModuloPermiso {
  key: string;
  label: string;
  acciones: string[];
}

const MODULOS: ModuloPermiso[] = [
  // Atención al Paciente
  { key: 'pacientes',        label: 'Pacientes',         acciones: ['leer', 'crear', 'editar', 'eliminar'] },
  { key: 'citas',            label: 'Citas',             acciones: ['leer', 'crear', 'editar', 'cancelar'] },
  { key: 'triaje',           label: 'Triaje',            acciones: ['leer', 'crear'] },
  { key: 'historia_clinica', label: 'Historia Clínica',  acciones: ['leer', 'crear', 'editar'] },
  { key: 'vacunacion',       label: 'Vacunación (PAI)',  acciones: ['leer', 'gestionar', 'editar', 'eliminar'] },
  { key: 'inventario_vacunas', label: 'Inventario PAI (Vacunas)', acciones: ['leer', 'gestionar'] },
  { key: 'agendas',          label: 'Agendas Médicas',   acciones: ['leer', 'gestionar'] },
  { key: 'control_prenatal', label: 'Control Prenatal',   acciones: ['leer', 'escribir', 'eliminar'] },
  { key: 'pediatria',        label: 'Pediatría',         acciones: ['leer', 'crear'] },
  { key: 'hospitalizacion',  label: 'Hospitalización',   acciones: ['leer', 'gestionar'] },
  { key: 'historial_unificado', label: 'Historial Clínico Unificado', acciones: ['leer', 'exportar'] },
  
  // Servicios Clínicos
  { key: 'formularios',      label: 'Formularios',       acciones: ['leer', 'llenar', 'crear', 'editar'] },
  { key: 'recetas',          label: 'Recetas',           acciones: ['leer', 'crear', 'dispensar'] },
  { key: 'laboratorio',      label: 'Laboratorio',       acciones: ['leer', 'gestionar'] },
  { key: 'radiologia',       label: 'Radiología e Imagen', acciones: ['leer', 'gestionar', 'solicitar'] },
  { key: 'diagnosticos',     label: 'Diagnósticos CIE-10', acciones: ['leer', 'crear'] },
  { key: 'farmacia',         label: 'Farmacia (Dispensación)', acciones: ['leer', 'crear'] },
  { key: 'epidemiologia',    label: 'Control Epidemiológico',  acciones: ['leer', 'notificar', 'gestionar'] },
  
  // Gestión Administrativa
  { key: 'usuarios',         label: 'Usuarios',          acciones: ['leer', 'gestionar'] },
  { key: 'inventario',       label: 'Inventario General', acciones: ['leer', 'gestionar'] },
  { key: 'medicamentos',     label: 'Medicamentos',         acciones: ['leer', 'gestionar'] },
  
  // Configuración
  { key: 'especialidades',   label: 'Especialidades',    acciones: ['leer', 'crear', 'editar'] },
  { key: 'establecimientos', label: 'Establecimientos',  acciones: ['leer', 'crear', 'editar'] },
  { key: 'reportes',         label: 'Reportes (Visualización)', acciones: ['generar'] },
  { key: 'gestion_reportes', label: 'Gestión de Reportes', acciones: ['leer', 'gestionar'] },
  { key: 'geo',              label: 'Geografía',         acciones: ['leer'] },
  { key: 'catalogos',        label: 'Catálogos',         acciones: ['leer'] },
];

const CATEGORIAS = [
  { nombre: 'Atención al Paciente',   keys: ['pacientes', 'citas', 'triaje', 'historia_clinica', 'historial_unificado', 'vacunacion', 'inventario_vacunas', 'agendas', 'control_prenatal', 'pediatria', 'hospitalizacion'] },
  { nombre: 'Servicios Clínicos',      keys: ['formularios', 'recetas', 'laboratorio', 'radiologia', 'diagnosticos', 'farmacia', 'epidemiologia'] },
  { nombre: 'Gestión Administrativa', keys: ['usuarios', 'inventario', 'medicamentos'] },
  { nombre: 'Configuración y Otros',  keys: ['especialidades', 'establecimientos', 'reportes', 'gestion_reportes', 'geo', 'catalogos'] },
];

const ROL_COLOR: Record<string, string> = {
  ADMIN:         'bg-red-100 text-red-700 border-red-200',
  MEDICO:        'bg-blue-100 text-blue-700 border-blue-200',
  ENFERMERA:     'bg-green-100 text-green-700 border-green-200',
  FARMACEUTICO:  'bg-purple-100 text-purple-700 border-purple-200',
  RECEPCIONISTA: 'bg-orange-100 text-orange-700 border-orange-200',
  EPIDEMIOLOGO:  'bg-teal-100 text-teal-700 border-teal-200',
  ADMIN_ESTABLECIMIENTO: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

@Component({
  selector: 'app-mantenimiento-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mantenimiento-roles.component.html',
})
export class MantenimientoRolesComponent implements OnInit {
  private svc          = inject(RolesService);
  private fb           = inject(FormBuilder);
  private notification = inject(NotificationService);

  roles     = signal<Rol[]>([]);
  cargando  = signal(false);

  rolSeleccionado = signal<Rol | null>(null);
  guardando       = signal(false);

  // Mapa mutable: modulo -> Set de acciones habilitadas
  permisosActivos: Record<string, Set<string>> = {};

  readonly modulos   = MODULOS;
  readonly categorias = CATEGORIAS;

  modulosPorCategoria(keys: string[]) {
    return MODULOS.filter(m => keys.includes(m.key));
  }

  form = this.fb.group({
    descripcion: [''],
  });

  mostrarModalCrear = signal(false);
  guardandoNuevoRol = signal(false);

  crearRolForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
    descripcion: [''],
  });

  abrirModalCrear() {
    this.crearRolForm.reset();
    this.mostrarModalCrear.set(true);
  }

  cerrarModalCrear() {
    this.mostrarModalCrear.set(false);
  }

  crearRol() {
    if (this.crearRolForm.invalid) return;
    this.guardandoNuevoRol.set(true);
    const { nombre, descripcion } = this.crearRolForm.value;

    this.svc.crear({ nombre: nombre!.toUpperCase().trim(), descripcion: descripcion ?? '' }).subscribe({
      next: (nuevoRol) => {
        this.guardandoNuevoRol.set(false);
        this.cerrarModalCrear();
        this.notification.success(`Rol ${nuevoRol.nombre} creado exitosamente`);
        this.roles.update(list => [...list, nuevoRol]);
        this.seleccionarRol(nuevoRol);
      },
      error: (err: any) => {
        this.guardandoNuevoRol.set(false);
        this.notification.error(err?.error?.message ?? 'Error al crear el rol');
      }
    });
  }

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.svc.listar().subscribe({
      next: data => { this.roles.set(data); this.cargando.set(false); },
      error: ()   => this.cargando.set(false),
    });
  }

  seleccionarRol(rol: Rol) {
    this.rolSeleccionado.set(rol);
    this.form.patchValue({ descripcion: rol.descripcion ?? '' });
    this.permisosActivos = this.permisosDesdeJson(rol.permisos);
  }

  private permisosDesdeJson(permisos: Record<string, any>): Record<string, Set<string>> {
    const mapa: Record<string, Set<string>> = {};
    for (const mod of MODULOS) {
      const acciones = permisos[mod.key];
      mapa[mod.key] = new Set(Array.isArray(acciones) ? acciones : []);
    }
    return mapa;
  }

  tienePermiso(modulo: string, accion: string): boolean {
    return this.permisosActivos[modulo]?.has(accion) ?? false;
  }

  togglePermiso(modulo: string, accion: string) {
    const rol = this.rolSeleccionado();
    if (!rol || rol.nombre === 'ADMIN') return;
    const set = this.permisosActivos[modulo] ?? new Set();
    set.has(accion) ? set.delete(accion) : set.add(accion);
    this.permisosActivos = { ...this.permisosActivos, [modulo]: set };
  }

  todosMarcados(modulo: string): boolean {
    const mod = MODULOS.find(m => m.key === modulo);
    if (!mod) return false;
    return mod.acciones.every(a => this.tienePermiso(modulo, a));
  }

  toggleModulo(modulo: string) {
    const rol = this.rolSeleccionado();
    if (!rol || rol.nombre === 'ADMIN') return;
    const mod = MODULOS.find(m => m.key === modulo)!;
    const todas = this.todosMarcados(modulo);
    this.permisosActivos = {
      ...this.permisosActivos,
      [modulo]: todas ? new Set() : new Set(mod.acciones),
    };
  }

  private permisosAJson(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const mod of MODULOS) {
      const acciones = [...(this.permisosActivos[mod.key] ?? [])];
      if (acciones.length > 0) result[mod.key] = acciones;
    }
    return result;
  }

  guardar() {
    const rol = this.rolSeleccionado();
    if (!rol) return;
    this.guardando.set(true);

    const payload: any = { descripcion: this.form.value.descripcion ?? '' };
    if (rol.nombre !== 'ADMIN') payload.permisos = this.permisosAJson();

    this.svc.actualizar(rol.id, payload).subscribe({
      next: updated => {
        this.guardando.set(false);
        this.notification.success(`Rol ${rol.nombre} actualizado`);
        this.roles.update(list => list.map(r => r.id === rol.id ? { ...r, ...updated } : r));
        this.rolSeleccionado.set({ ...rol, ...updated });
      },
      error: (err: any) => {
        this.guardando.set(false);
        this.notification.error(err?.error?.message ?? 'Error al guardar');
      },
    });
  }

  esAdmin(rol: Rol) { return rol.nombre === 'ADMIN'; }
  rolColor(nombre: string) { return ROL_COLOR[nombre] ?? 'bg-gray-100 text-gray-700 border-gray-200'; }

  totalPermisos(permisos: Record<string, any>): number {
    if (permisos?.['all']) return -1;
    return Object.values(permisos).reduce((s: number, v) => s + (Array.isArray(v) ? v.length : 0), 0);
  }
}
