import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { TenantContextService } from './tenant-context.service';

// Evita que múltiplos 402 simultâneos disparem várias navegações em cascata.
let redirecting = false;

// A mensagem que o backend devolve no 402 ("Regularize a assinatura...", ver
// cortex-api LicenseEnforcementFilter.cs) é escrita para o dono do salão — o cliente final
// não tem como regularizar nada. Qualquer 402 de rota de tenant redireciona para a tela
// genérica "indisponível" (mesma usada pelo tenantGuard no acesso inicial), que já orienta
// a falar direto com o salão. Cobre bloqueios que ocorrem no meio da sessão (ex.: licença
// suspensa enquanto o cliente navega), complementando o tenantGuard (que só roda na entrada).
export const licenseInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tenantContext = inject(TenantContextService);

  return next(req).pipe(
    tap({
      error: (err) => {
        if (!(err instanceof HttpErrorResponse) || err.status !== 402) return;
        if (router.url.startsWith('/indisponivel')) return;

        if (redirecting) return;
        redirecting = true;

        router
          .navigate(['/indisponivel'], { queryParams: { salao: tenantContext.name() || null } })
          .finally(() => {
            redirecting = false;
          });
      },
    }),
  );
};
