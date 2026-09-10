import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const ROUTE_MODULES: Record<string, string> = {
  'pacientes': 'pacientes',
  'citas': 'citas',
  'agendas': 'agendas',
  'triaje': 'triaje',
  'vacunacion/inventario': 'inventario_vacunas',
  'vacunacion': 'vacunacion',
  'control-prenatal': 'control_prenatal',
  'pediatria': 'pediatria',
  'hospitalizacion': 'hospitalizacion',
  'historia-clinica': 'historia_clinica',
  'historial-unificado': 'historial_unificado',
  'servicios/recetas-paciente': 'recetas',
  'laboratorio': 'laboratorio',
  'usuarios': 'usuarios',
  'permisos-usuarios': 'usuarios',
  'mantenimiento/formularios': 'formularios',
  'mantenimiento/diagnosticos': 'diagnosticos',
  'mantenimiento/medicamentos': 'medicamentos',
  'mantenimiento/vacunas': 'vacunacion',
  'mantenimiento/inventario': 'inventario',
  'inventario/movimientos': 'inventario',
  'mantenimiento/laboratorio': 'laboratorio',
  'mantenimiento/radiologia': 'radiologia',
  'mantenimiento/establecimientos': 'establecimientos',
  'mantenimiento/roles': 'roles',
  'mantenimiento/login': 'login',
  'mantenimiento/solicitudes': 'usuarios',
  'reportes/gestion': 'gestion_reportes',
  'reportes': 'reportes',
  'epidemiologia': 'epidemiologia',
};

const obtenerRutaActiva = (route: ActivatedRouteSnapshot): string => {
  const paths: string[] = [];
  let current: ActivatedRouteSnapshot | null = route;
  while (current) {
    if (current.url && current.url.length > 0) {
      paths.unshift(...current.url.map(segment => segment.path));
    } else if (current.routeConfig?.path) {
      paths.unshift(current.routeConfig.path);
    }
    current = current.parent;
  }
  // Filtrar vacíos
  return paths.filter(p => p !== '').join('/');
};

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // 1. Compatibilidad por roles harcodeados
  const roles: string[] = route.data['roles'] ?? [];
  if (auth.tieneRol(...roles)) return true;

  // 2. Validación por permisos dinámicos basados en la ruta activa
  const fullPath = obtenerRutaActiva(route);
  
  let moduloCoincidencia: string | null = null;
  for (const [prefix, modulo] of Object.entries(ROUTE_MODULES)) {
    if (fullPath === prefix || fullPath.startsWith(prefix + '/')) {
      moduloCoincidencia = modulo;
      break;
    }
  }

  if (moduloCoincidencia && auth.tieneAccesoModulo(moduloCoincidencia)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
