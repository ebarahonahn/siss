import { Component, inject, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';
import { NombreRutaActivaPipe } from '../../pipes/nombre-ruta.pipe';

interface NavItem {
  label: string;
  ruta: string;
  roles: string[];
  modulo?: string;
  subItems?: { label: string; ruta: string; modulo?: string; roles?: string[] }[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NombreRutaActivaPipe],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private auth   = inject(AuthService);
  private socket = inject(SocketService);
  private router = inject(Router);

  usuario    = this.auth.obtenerUsuario();
  sidebarAbierto = signal(true);
  rutaActual = signal('');
  expandedMenus = signal<string[]>([]);

  readonly navSections: NavSection[] = [
    {
      title: 'GENERAL',
      items: [
        {
          label: 'Dashboard',
          ruta: '/dashboard',
          roles: ['ADMIN','MEDICO','ENFERMERA','FARMACEUTICO','RECEPCIONISTA','EPIDEMIOLOGO','ADMIN_ESTABLECIMIENTO'],
        },
      ]
    },
    {
      title: 'ATENCIÓN MÉDICA',
      items: [
        {
          label: 'Pacientes',
          ruta: '/pacientes',
          roles: ['ADMIN','MEDICO','ENFERMERA','RECEPCIONISTA','ADMIN_ESTABLECIMIENTO'],
          modulo: 'pacientes',
        },
        {
          label: 'Citas',
          ruta: '/citas',
          roles: ['ADMIN','MEDICO','ENFERMERA','RECEPCIONISTA','ADMIN_ESTABLECIMIENTO'],
          modulo: 'citas',
        },
        {
          label: 'Agendas',
          ruta: '/agendas',
          roles: ['ADMIN','MEDICO','ENFERMERA','RECEPCIONISTA','ADMIN_ESTABLECIMIENTO'],
          modulo: 'agendas', 
        },
        {
          label: 'Historia Clínica',
          ruta: '/historia-clinica',
          roles: ['ADMIN','MEDICO','ENFERMERA'],
          modulo: 'historia_clinica',
        },
        {
          label: 'Triaje',
          ruta: '/triaje',
          roles: ['ADMIN','ENFERMERA'],
          modulo: 'triaje',
        },
        {
          label: 'Vacunación (PAI)',
          ruta: '/vacunacion',
          roles: ['ADMIN','MEDICO','ENFERMERA','ADMIN_ESTABLECIMIENTO'],
          modulo: 'vacunacion',
          subItems: [
            { label: 'Vacunación', ruta: '/vacunacion', roles: ['ENFERMERA', 'MEDICO', 'ADMIN', 'ADMIN_ESTABLECIMIENTO'] },
            { label: 'Inventario PAI', ruta: '/vacunacion/inventario', roles: ['ENFERMERA', 'ADMIN', 'ADMIN_ESTABLECIMIENTO'] }
          ]
        },
        {
          label: 'Hospitalización',
          ruta: '/hospitalizacion',
          roles: ['ADMIN','MEDICO','ENFERMERA','RECEPCIONISTA','ADMIN_ESTABLECIMIENTO'],
          modulo: 'hospitalizacion',
        },
      ]
    },
    {
      title: 'SERVICIOS',
      items: [
        {
          label: 'Farmacia',
          ruta: '/farmacia',
          roles: ['ADMIN','FARMACEUTICO'],
          modulo: 'recetas',
        },
        {
          label: 'Recetas por Paciente',
          ruta: '/servicios/recetas-paciente',
          roles: ['ADMIN','FARMACEUTICO','MEDICO','ADMIN_ESTABLECIMIENTO'],
          modulo: 'recetas',
        },
      ]
    },
    {
      title: 'INVENTARIOS',
      items: [
        {
          label: 'Inventario Central',
          ruta: '/mantenimiento/inventario',
          roles: ['ADMIN', 'FARMACEUTICO', 'ADMIN_ESTABLECIMIENTO'],
          modulo: 'inventario',
        },
        {
          label: 'Movimientos',
          ruta: '/inventario/movimientos',
          roles: ['ADMIN', 'FARMACEUTICO', 'ADMIN_ESTABLECIMIENTO'],
          modulo: 'inventario',
        },
      ]
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
        {
          label: 'Usuarios',
          ruta: '/usuarios',
          roles: ['ADMIN','ADMIN_ESTABLECIMIENTO'],
          modulo: 'usuarios',
        },
        {
          label: 'Permisos Individuales',
          ruta: '/permisos-usuarios',
          roles: ['ADMIN','ADMIN_ESTABLECIMIENTO'],
        },
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        {
          label: 'Mantenimiento',
          ruta: '/mantenimiento/formularios',
          roles: ['ADMIN', 'FARMACEUTICO', 'ADMIN_ESTABLECIMIENTO'],
          subItems: [
            { label: 'Formularios Clínicos', ruta: '/mantenimiento/formularios',  modulo: 'formularios'  },
            { label: 'Catálogo CIE-10',      ruta: '/mantenimiento/diagnosticos',  modulo: 'diagnosticos' },
            { label: 'Medicamentos',         ruta: '/mantenimiento/medicamentos',  modulo: 'medicamentos' },
            { label: 'Exámenes Lab',         ruta: '/mantenimiento/laboratorio',   roles: ['ADMIN']       },
            { label: 'Estudios Imagen',      ruta: '/mantenimiento/radiologia',    roles: ['ADMIN']       },
            { label: 'Establecimientos',     ruta: '/mantenimiento/establecimientos',      roles: ['ADMIN']       },
            { label: 'Roles y Permisos',     ruta: '/mantenimiento/roles',         roles: ['ADMIN']       },
            { label: 'Personalización Login', ruta: '/mantenimiento/login',         roles: ['ADMIN']       },
            { label: 'Solicitudes Móviles',  ruta: '/mantenimiento/solicitudes',   roles: ['ADMIN', 'ADMIN_ESTABLECIMIENTO'] },
          ],
        },
      ]
    },
    {
      title: 'ANÁLISIS',
      items: [
        {
          label: 'Control Epidemiológico',
          ruta: '/epidemiologia/dashboard',
          roles: ['ADMIN','ADMIN_ESTABLECIMIENTO','EPIDEMIOLOGO'],
        },
        {
          label: 'Reportes',
          ruta: '/reportes',
          roles: ['ADMIN','MEDICO','ADMIN_ESTABLECIMIENTO','FARMACEUTICO','EPIDEMIOLOGO'],
          modulo: 'reportes',
        },
      ]
    }
  ];

  seccionesFiltradas: NavSection[] = [];

  private calcularSecciones() {
    const rol = this.usuario?.rol ?? '';
    this.seccionesFiltradas = this.navSections
      .map(section => ({
        ...section,
        items: section.items
          .filter(item => item.roles.includes(rol))
          .filter(item => !item.modulo || this.auth.tieneAccesoModulo(item.modulo))
          .map(item => ({
            ...item,
            subItems: item.subItems?.filter(
              sub => (!sub.modulo || this.auth.tieneAccesoModulo(sub.modulo)) &&
                     (!sub.roles || sub.roles.includes(rol))
            ),
          })),
      }))
      .filter(section => section.items.length > 0);
  }

  // Mantenemos itemsFiltrados para el topbar por ahora o compatibilidad
  get itemsFiltrados(): NavItem[] {
    return this.seccionesFiltradas.flatMap(s => s.items);
  }

  ngOnInit() {
    this.calcularSecciones();
    this.socket.conectar();
    this.rutaActual.set(this.router.url);

    this.auth.usuario$.subscribe(u => {
      this.usuario = u;
      this.calcularSecciones();
    });

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.rutaActual.set(e.urlAfterRedirects);
        this.expandActiveMenu();
      });
    
    this.expandActiveMenu();
  }

  private expandActiveMenu() {
    const url = this.router.url;
    this.navSections.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems?.some(sub => url.startsWith(sub.ruta))) {
          if (!this.isExpanded(item.label)) {
            this.toggleMenu(item.label);
          }
        }
      });
    });
  }

  toggleMenu(label: string) {
    this.expandedMenus.update(current => {
      if (current.includes(label)) {
        return current.filter(l => l !== label);
      } else {
        return [...current, label];
      }
    });
  }

  isExpanded(label: string): boolean {
    return this.expandedMenus().includes(label);
  }

  ngOnDestroy() {
    this.socket.desconectar();
  }

  @HostListener('window:keydown.alt.s', ['$event'])
  handleGlobalSearch(event: KeyboardEvent) {
    event.preventDefault();
    this.router.navigate(['/pacientes']);
  }

  esRutaActiva(ruta: string): boolean {
    return this.rutaActual().startsWith(ruta) && ruta !== '/dashboard'
      ? true
      : this.rutaActual() === ruta;
  }

  cerrarSesion() {
    this.auth.cerrarSesion();
  }

  toggleSidebar() {
    this.sidebarAbierto.update(v => !v);
  }

  trackBySection(index: number, section: NavSection) {
    return section.title;
  }

  trackByItem(index: number, item: NavItem) {
    return item.label;
  }

  trackBySubItem(index: number, sub: { label: string; ruta: string }) {
    return sub.ruta;
  }
}
