import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/agent-dashboard/agent-dashboard.component').then((m) => m.AgentDashboardComponent),
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/create/create.page').then((m) => m.CreatePageComponent),
  },
  {
    path: 'optimize',
    loadComponent: () =>
      import('./pages/content-optimization/content-optimization.component').then((m) => m.ContentOptimizationComponent),
  },
  {
    path: 'social-media',
    loadComponent: () =>
      import('./pages/social-media-manager/social-media-manager.component').then((m) => m.SocialMediaManagerComponent),
  },
];
