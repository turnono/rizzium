import { Routes } from '@angular/router';
import { AuthGuard } from '@rizzium/shared/guards';

export const learnRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./learn.page').then((m) => m.LearnPageComponent),
  },
  {
    path: 'course',
    canActivate: [AuthGuard],
    loadComponent: () => import('./course/course.page').then((m) => m.CoursePageComponent),
  },
  {
    path: 'progress',
    canActivate: [AuthGuard],
    loadComponent: () => import('./progress/progress.page').then((m) => m.ProgressPageComponent),
  },
];
