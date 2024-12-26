import { Route } from '@angular/router';
import { AuthGuard } from '@rizzium/shared/guards';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePageComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
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
    path: 'privacy',
    loadComponent: () => import('./pages/privacy-policy/privacy-policy.page').then((m) => m.PrivacyPolicyPage),
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/terms-of-service/terms-of-service.page').then((m) => m.TermsOfServicePage),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact-us/contact-us.page').then((m) => m.ContactUsComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPageComponent),
  },
  // Add other routes as needed
  {
    path: '**',
    redirectTo: '',
  },
];
