import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products.component').then((m) => m.ProductsComponent),
      },
      {
        path: 'assembly-lines',
        loadComponent: () =>
          import('./features/assembly-lines/assembly-lines.component').then(
            (m) => m.AssemblyLinesComponent
          ),
      },
      {
        path: 'assembly-lines/:lineId/allocations',
        loadComponent: () =>
          import('./features/allocations/allocations.component').then(
            (m) => m.AllocationsComponent
          ),
      },
      {
        path: 'workstations',
        loadComponent: () =>
          import('./features/workstations/workstations.component').then(
            (m) => m.WorkstationsComponent
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'products' },
    ],
  },
  { path: '**', redirectTo: '' },
];
