import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'listings',
    loadComponent: () => import('./pages/listings/listings.component').then((m) => m.ListingsComponent),
  },
  {
    path: 'listings/:id',
    loadComponent: () =>
      import('./pages/listing-details/listing-details.component').then((m) => m.ListingDetailsComponent),
  },
  {
    path: 'host',
    loadComponent: () =>
      import('./pages/host-dashboard/host-dashboard.component').then((m) => m.HostDashboardComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
