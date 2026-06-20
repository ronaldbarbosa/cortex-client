import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantContextService } from '../tenant/tenant-context.service';
import { UnitContextService } from './unit-context.service';

export const unitGuard: CanActivateFn = (route) => {
  const unitSlug = route.paramMap.get('unitSlug')!;
  const tenantContext = inject(TenantContextService);
  const unitContext = inject(UnitContextService);
  const router = inject(Router);

  const unit = tenantContext.units().find((u) => u.slug === unitSlug);
  if (!unit) {
    return router.createUrlTree(['/nao-encontrado']);
  }

  unitContext.set(unit);
  return true;
};
