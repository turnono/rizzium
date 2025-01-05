import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'journal',
    loadComponent: () =>
      import('./pages/journal/journal-entry/journal-entry.component').then((m) => m.JournalEntryComponent),
  },
  {
    path: '',
    redirectTo: 'journal',
    pathMatch: 'full',
  },
];
