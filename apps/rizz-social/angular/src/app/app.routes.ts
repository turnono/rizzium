import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/social-media-manager/social-media-manager.component').then((m) => m.SocialMediaManagerComponent),
  },
];
