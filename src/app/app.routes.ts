import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
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
        loadComponent: () => import('./pages/history/history').then((m) => m.HistoryComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
