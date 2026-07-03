import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TenantContextService } from './tenant-context.service';
import { Tenant } from './tenant.model';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

export const tenantGuard: CanActivateFn = async (route) => {
  const slug = route.paramMap.get('slug')!;
  const tenantContext = inject(TenantContextService);
  const http = inject(HttpClient);
  const router = inject(Router);
  const auth = inject(AuthService);

  const cached = tenantContext.slug() === slug ? tenantContext.tenant() : null;

  let tenant: Tenant;
  if (cached) {
    tenant = cached;
  } else {
    try {
      const fetched = await firstValueFrom(
        http.get<Tenant>(`${environment.apiUrl}/public/establishments/${slug}`),
      );
      // Licença inativa → salão não aceita agendamento online: bloqueia o acesso à página.
      if (!fetched.onlineBookingEnabled) {
        return router.createUrlTree(['/indisponivel'], { queryParams: { salao: fetched.name } });
      }
      tenantContext.set(fetched);
      tenant = fetched;
    } catch {
      return router.createUrlTree(['/nao-encontrado']);
    }
  }

  // A tela sempre reflete o salão da slug: se o cliente está logado em outro salão, troca a sessão
  // ativa para este (cliente do salão → dados completos; não-cliente → sessão convidada, que ainda
  // permite agendar). Best-effort: se falhar, mantém a sessão atual sem deslogar. Ver multitenancy.md.
  const sessionTenantId = auth.user()?.tenantId;
  if (auth.isAuthenticated() && sessionTenantId && sessionTenantId !== tenant.id) {
    try {
      await firstValueFrom(auth.switchToSalon(tenant.id));
    } catch {
      /* mantém a sessão atual */
    }
  }

  return true;
};
