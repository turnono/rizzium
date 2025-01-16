import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPageComponent),
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/create/create.page').then((m) => m.CreatePageComponent),
  },
];
