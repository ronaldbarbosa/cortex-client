import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TenantContextService } from './tenant-context.service';
import { Tenant } from './tenant.model';
import { environment } from '../../../environments/environment';

export const tenantGuard: CanActivateFn = async (route) => {
  const slug = route.paramMap.get('slug')!;
  const tenantContext = inject(TenantContextService);
  const http = inject(HttpClient);
  const router = inject(Router);

  if (tenantContext.slug() === slug) return true;

  try {
    const tenant = await firstValueFrom(
      http.get<Tenant>(`${environment.apiUrl}/public/establishments/${slug}`),
    );
    tenantContext.set(tenant);
    return true;
  } catch {
    return router.createUrlTree(['/nao-encontrado']);
  }
};
