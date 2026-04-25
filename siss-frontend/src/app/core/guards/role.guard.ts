import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const roles: string[] = route.data['roles'] ?? [];

  if (auth.tieneRol(...roles)) return true;

  return router.createUrlTree(['/dashboard']);
};
