import { Routes } from '@angular/router';

export const routes: Routes = [
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
        loadComponent: () => import('./pages/history/history').then((m) => m.HistoryComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
