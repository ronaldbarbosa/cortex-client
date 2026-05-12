import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { tenantGuard } from './core/tenant/tenant.guard';

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
            loadComponent: () => import('./pages/loyalty/loyalty').then((m) => m.LoyaltyComponent),
          },
          {
            path: 'historico',
            canActivate: [authGuard],
            loadComponent: () => import('./pages/history/history').then((m) => m.HistoryComponent),
          },
          {
            path: 'conta',
            loadComponent: () => import('./pages/account/account').then((m) => m.AccountComponent),
          },
        ],
      },
    ],
  },
  {
    path: 'nao-encontrado',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
  { path: '', redirectTo: 'nao-encontrado', pathMatch: 'full' },
  { path: '**', redirectTo: 'nao-encontrado' },
];
