import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';

export const routes: Routes = [
  // Ruta raíz: redirige a login si no hay sesión, a dashboard si ya la hay
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./modules/auth/login/login.component').then((m) => m.LoginComponent),
  },

  // Rutas protegidas - Usan el MainLayoutComponent
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'pacientes',
        canActivate: [roleGuard],
        data: { roles: ['MEDICO', 'ENFERMERA', 'ADMIN', 'RECEPCIONISTA', 'ADMIN_ESTABLECIMIENTO'] },
        loadComponent: () =>
          import('./modules/pacientes/pacientes.component').then(
            (m) => m.PacientesComponent,
          ),
      },
      {
        path: 'citas',
        canActivate: [roleGuard],
        data: { roles: ['MEDICO', 'ENFERMERA', 'ADMIN', 'RECEPCIONISTA', 'ADMIN_ESTABLECIMIENTO'] },
        loadComponent: () =>
          import('./modules/citas/citas.component').then((m) => m.CitasComponent),
      },
      {
        path: 'agendas',
        canActivate: [roleGuard],
        data: { roles: ['MEDICO', 'ADMIN', 'ADMIN_ESTABLECIMIENTO'] },
        loadComponent: () =>
          import('./modules/agendas/agendas.component').then((m) => m.AgendasComponent),
      },

      {
        path: 'triaje',
        canActivate: [roleGuard],
        data: { roles: ['ENFERMERA', 'ADMIN'] },
        loadComponent: () =>
          import('./modules/triaje/triaje.component').then((m) => m.TriajeComponent),
      },
      {
        path: 'vacunacion',
        canActivate: [roleGuard],
        data: { roles: ['ENFERMERA', 'ADMIN', 'MEDICO', 'ADMIN_ESTABLECIMIENTO'] },
        loadComponent: () =>
          import('./modules/vacunacion/vacunacion.component').then((m) => m.VacunacionComponent),
      },
      {
        path: 'vacunacion/inventario',
        canActivate: [roleGuard],
        data: { roles: ['ENFERMERA', 'ADMIN', 'MEDICO', 'ADMIN_ESTABLECIMIENTO'] },
        loadComponent: () =>
          import('./modules/vacunacion/inventario-vacunas.component').then((m) => m.InventarioVacunasComponent),
      },
      {
        path: 'historia-clinica',
        canActivate: [roleGuard],
        data: { roles: ['MEDICO', 'ENFERMERA', 'ADMIN'] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./modules/historia-clinica/historia-clinica.component').then(
                (m) => m.HistoriaClinicaComponent,
              ),
          },
          {
            path: 'nueva',
            loadComponent: () =>
              import('./modules/historia-clinica/pages/nueva-consulta/nueva-consulta.component').then(
                (m) => m.NuevaConsultaComponent,
              ),
          }
        ]
      },
      {
        path: 'farmacia',
        canActivate: [roleGuard],
        data: { roles: ['FARMACEUTICO', 'ADMIN'] },
        loadComponent: () =>
          import('./modules/farmacia/farmacia.component').then((m) => m.FarmaciaComponent),
      },
      {
        path: 'laboratorio',
        canActivate: [roleGuard],
        data: { roles: ['MEDICO', 'ENFERMERA', 'ADMIN'] },
        loadComponent: () =>
          import('./modules/laboratorio/laboratorio.component').then(
            (m) => m.LaboratorioComponent,
          ),
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'ADMIN_ESTABLECIMIENTO'] },
        loadComponent: () =>
          import('./modules/usuarios/usuarios.component').then(
            (m) => m.UsuariosComponent,
          ),
      },
      {
        path: 'permisos-usuarios',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'ADMIN_ESTABLECIMIENTO'] },
        loadComponent: () =>
          import('./modules/usuarios/permisos-usuarios.component').then(
            (m) => m.PermisosUsuariosComponent,
          ),
      },
      {
        path: 'mantenimiento/roles',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./modules/mantenimiento-roles/mantenimiento-roles.component').then(
            (m) => m.MantenimientoRolesComponent,
          ),
      },
      {
        path: 'mantenimiento/formularios',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./modules/mantenimiento-formularios/pages/lista-plantillas/lista-plantillas.component').then(
            (m) => m.ListaPlantillasComponent,
          ),
      },
      {
        path: 'mantenimiento/diagnosticos',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./modules/mantenimiento-diagnosticos/mantenimiento-diagnosticos.component').then(
            (m) => m.MantenimientoDiagnosticosComponent,
          ),
      },
      {
        path: 'mantenimiento/medicamentos',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'FARMACEUTICO'] },
        loadComponent: () =>
          import('./modules/mantenimiento-medicamentos/mantenimiento-medicamentos.component').then(
            (m) => m.MantenimientoMedicamentosComponent,
          ),
      },
      {
        path: 'mantenimiento/inventario',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'FARMACEUTICO', 'ADMIN_ESTABLECIMIENTO'] },
        loadComponent: () =>
          import('./modules/mantenimiento-inventario/mantenimiento-inventario.component').then(
            (m) => m.MantenimientoInventarioComponent,
          ),
      },
      {
        path: 'mantenimiento/laboratorio',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./modules/mantenimiento-laboratorio/mantenimiento-laboratorio.component').then(
            (m) => m.MantenimientoLaboratorioComponent,
          ),
      },
      {
        path: 'mantenimiento/radiologia',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./modules/mantenimiento-radiologia/mantenimiento-radiologia.component').then(
            (m) => m.MantenimientoRadiologiaComponent,
          ),
      },
      {
        path: 'mantenimiento/establecimientos',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./modules/mantenimiento-establecimientos/mantenimiento-establecimientos.component').then(
            (m) => m.MantenimientoEstablecimientosComponent,
          ),
      },
      {
        path: 'mantenimiento/formularios/:id/constructor',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./modules/mantenimiento-formularios/pages/constructor-formulario/constructor-formulario.component').then(
            (m) => m.ConstructorFormularioComponent,
          ),
      },
      {
        path: 'epidemiologia',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'ADMIN_ESTABLECIMIENTO', 'EPIDEMIOLOGO'] },
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./modules/epidemiologia/pages/dashboard/dashboard.component').then(
                (m) => m.EpidemiologiaDashboardComponent,
              ),
          }
        ]
      },
      {
        path: 'reportes',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MEDICO', 'ADMIN_ESTABLECIMIENTO', 'FARMACEUTICO', 'EPIDEMIOLOGO'] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./modules/reportes/reportes-dashboard.component').then(
                (m) => m.ReportesComponent,
              ),
          },
          {
            path: 'gestion',
            canActivate: [roleGuard],
            data: { roles: ['ADMIN'] },
            loadComponent: () =>
              import('./modules/reportes/gestion-reportes.component').then(
                (m) => m.GestionReportesComponent,
              ),
          }
        ]
      },
    ]
  },

  // Cualquier ruta desconocida va a login
  { path: '**', redirectTo: 'login' },
];
