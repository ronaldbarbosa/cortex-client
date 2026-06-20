import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { tenantGuard } from './core/tenant/tenant.guard';
import { unitGuard } from './core/unit/unit.guard';

export const routes: Routes = [
  {
    path: 's/:slug',
    canActivate: [tenantGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
      },
      {
        path: 'esqueci-senha',
        loadComponent: () =>
          import('./pages/forgot-password/forgot-password').then((m) => m.ForgotPasswordComponent),
      },
      {
        path: 'u/:unitSlug',
        canActivate: [unitGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./layout/shell/shell').then((m) => m.ShellComponent),
            children: [
              { path: '', redirectTo: 'inicio', pathMatch: 'full' },
              {
                path: 'inicio',
                loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
              },
              {
                path: 'agendar',
                loadComponent: () => import('./pages/book/book').then((m) => m.BookComponent),
              },
              {
                path: 'fidelidade',
                loadComponent: () =>
                  import('./pages/loyalty/loyalty').then((m) => m.LoyaltyComponent),
              },
              {
                path: 'historico',
                canActivate: [authGuard],
                loadComponent: () =>
                  import('./pages/history/history').then((m) => m.HistoryComponent),
              },
              {
                path: 'profissionais',
                loadComponent: () =>
                  import('./pages/professionals/professionals').then(
                    (m) => m.ProfessionalsComponent,
                  ),
              },
              {
                path: 'conta',
                loadComponent: () =>
                  import('./pages/account/account').then((m) => m.AccountComponent),
              },
            ],
          },
        ],
      },
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/unit-select/unit-select').then((m) => m.UnitSelectComponent),
      },
    ],
  },
  {
    path: 'redefinir-senha',
    loadComponent: () =>
      import('./pages/reset-password/reset-password').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'confirmar-email',
    loadComponent: () =>
      import('./pages/confirm-email/confirm-email').then((m) => m.ConfirmEmailComponent),
  },
  {
    path: 'nao-encontrado',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
  {
    path: 'indisponivel',
    loadComponent: () =>
      import('./pages/unavailable/unavailable').then((m) => m.UnavailableComponent),
  },
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.LandingComponent),
  },
  { path: '**', redirectTo: 'nao-encontrado' },
];
