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
    loadComponent: () => import('./pages/file-upload/file-upload.page').then((m) => m.FileUploadPageComponent),
    canActivate: [AuthGuard, UsageLimitGuard],
  },
  {
    path: 'upload',
    redirectTo: 'file-upload',
    pathMatch: 'full',
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports.page').then((m) => m.ReportsPageComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'pricing',
    loadComponent: () => import('./pages/pricing/pricing.page').then((m) => m.PricingPageComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPageComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/terms-of-service/terms-of-service.page').then((m) => m.TermsOfServicePage),
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy-policy/privacy-policy.page').then((m) => m.PrivacyPolicyPage),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact-us/contact-us.page').then((m) => m.ContactUsComponent),
  },
];
