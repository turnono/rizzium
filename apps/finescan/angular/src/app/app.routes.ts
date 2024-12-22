import { Route } from '@angular/router';
import { NxWelcomeComponent } from './nx-welcome.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: NxWelcomeComponent,
  },
  {
    path: 'file-upload',
    loadComponent: () => import('./pages/file-upload/file-upload.page').then((m) => m.FileUploadPage),
  },
];
