import { Route } from '@angular/router';
import { inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { map } from 'rxjs';

const authGuard = () => {
  const auth = inject(Auth);
  return authState(auth).pipe(
    map((user) => {
      if (user) {
        return true;
      } else {
        return ['/login'];
      }
    })
  );
};

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/agent-dashboard/agent-dashboard.component').then((m) => m.AgentDashboardComponent),
  },
  {
    path: 'create',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/create/create.page').then((m) => m.CreatePageComponent),
  },
  {
    path: 'optimize',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/content-optimization/content-optimization.component').then((m) => m.ContentOptimizationComponent),
  },
  {
    path: 'social-media',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/social-media-manager/social-media-manager.component').then((m) => m.SocialMediaManagerComponent),
  },
];
