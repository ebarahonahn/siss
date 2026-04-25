import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private dashSvc = inject(DashboardService);

  usuario = this.auth.obtenerUsuario();

  // Datos reales desde el servicio
  stats = signal({
    citasHoy: 0,
    pacientesEsperando: 0,
    historiasPendientes: 0,
    alertasInventario: 0,
    casosEpi: 0
  });

  agenda = signal<any[]>([]);

  readonly accesosRapidos = [
    { label: 'Pacientes',      ruta: '/pacientes',       roles: ['ADMIN','MEDICO','ENFERMERA','RECEPCIONISTA','ADMIN_ESTABLECIMIENTO'], icon: 'users' },
    { label: 'Citas',          ruta: '/citas',            roles: ['ADMIN','MEDICO','ENFERMERA','RECEPCIONISTA','ADMIN_ESTABLECIMIENTO'], icon: 'calendar' },
    { label: 'H. Clínica',     ruta: '/historia-clinica', roles: ['ADMIN','MEDICO','ENFERMERA'], icon: 'book' },
    { label: 'Triaje',         ruta: '/triaje',           roles: ['ADMIN','ENFERMERA'], icon: 'activity' },
    { label: 'Farmacia',       ruta: '/farmacia',         roles: ['ADMIN','FARMACEUTICO','ADMIN_ESTABLECIMIENTO'], icon: 'shopping-bag' },
    { label: 'Laboratorio',    ruta: '/laboratorio',      roles: ['ADMIN','LABORATORISTA'], icon: 'test-tube' },
    { label: 'Epidemiología',  ruta: '/epidemiologia/dashboard', roles: ['ADMIN','EPIDEMIOLOGO','ADMIN_ESTABLECIMIENTO'], icon: 'shield-alert' },
    { label: 'Configuración',  ruta: '/usuarios',         roles: ['ADMIN'], icon: 'settings' },
  ];

  get itemsFiltrados() {
    const rol = this.usuario?.rol ?? '';
    return this.accesosRapidos.filter(item => item.roles.includes(rol));
  }

  ngOnInit() {
    this.auth.usuario$.subscribe(u => this.usuario = u);
    this.cargarDatos();
  }

  cargarDatos() {
    this.dashSvc.getStats().subscribe(data => this.stats.set(data));
    if (this.usuario?.rol === 'MEDICO') {
      this.dashSvc.getAgenda().subscribe(data => this.agenda.set(data));
    }
  }
}
