import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TenantContextService } from '../tenant/tenant-context.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const tenantContext = inject(TenantContextService);

  if (auth.isAuthenticated()) return true;

  const slug = tenantContext.slug();
  return router.createUrlTree(['/s', slug, 'login']);
};
