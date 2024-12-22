import { Route } from '@angular/router';
import { LandingComponent } from '@rizzium/shared/ui/molecules';
import { AuthGuard } from '@rizzium/shared/guards';

export const appRoutes: Route[] = [
  {
    path: '',
    component: LandingComponent,
  },
  {
    path: 'file-upload',
    loadComponent: () => import('./pages/file-upload/file-upload.page').then((m) => m.FileUploadPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports.page').then((m) => m.ReportsPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
];
