import { Routes } from '@angular/router';
import { AuthGuard } from '@rizzium/shared/guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'learn',
    pathMatch: 'full',
  },
  {
    path: 'learn',
    loadChildren: () => import('./pages/learn/learn.routes').then((m) => m.learnRoutes),
  },
  // ... other existing routes
];
