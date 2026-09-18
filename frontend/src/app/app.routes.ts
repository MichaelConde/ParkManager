import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { ShellComponent } from './core/layout/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'sesiones',
        loadComponent: () => import('./features/sessions/sessions.component').then((m) => m.SessionsComponent)
      },
      {
        path: 'espacios',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/spaces/spaces.component').then((m) => m.SpacesComponent)
      },
      {
        path: 'clientes',
        loadComponent: () => import('./features/clients/clients.component').then((m) => m.ClientsComponent)
      },
      {
        path: 'membresias',
        loadComponent: () => import('./features/memberships/memberships.component').then((m) => m.MembershipsComponent)
      },
      {
        path: 'reportes',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/reports/reports.component').then((m) => m.ReportsComponent)
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/users/users.component').then((m) => m.UsersComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
