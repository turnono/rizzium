import { Routes } from '@angular/router';
import { AuthGuard } from '@rizzium/shared/guards';
import { UsageLimitGuard } from '@rizzium/shared/guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePageComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'file-upload',
    loadComponent: () => import('./pages/file-upload/file-upload.page').then((m) => m.FileUploadPage),
    canActivate: [AuthGuard, UsageLimitGuard],
  },
  {
    path: 'upload',
    redirectTo: 'file-upload',
    pathMatch: 'full',
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports.page').then((m) => m.ReportsPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'pricing',
    loadComponent: () => import('./pages/pricing/pricing.page').then((m) => m.PricingPageComponent),
    canActivate: [AuthGuard],
  },
];
