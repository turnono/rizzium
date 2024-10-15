import { Route } from '@angular/router';
import { HomePageComponent } from './pages/home/home.page';
import { LoginPageComponent } from './pages/login/login.page';
import { BusinessSetupComponent } from './pages/business-setup/business-setup.page';
import { BusinessDashboardComponent } from './pages/business-dashboard/business-dashboard.page';
import { ProductManagementComponent } from './pages/product-management/product-management.page';
import { JoinComponent } from './pages/join/join.page';
import { AuthGuard } from '@rizzpos/shared/guards';
import { InventoryPageComponent } from './pages/inventory/inventory.page';
import { SalesPageComponent } from './pages/sales/sales.page';
import { ReportsPageComponent } from './pages/reports/reports.page';
import { BusinessUserManagementPageComponent } from './pages/business-user-management/business-user-management.page';

export const routes: Route[] = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  { path: 'home', component: HomePageComponent, canActivate: [AuthGuard] },
  {
    path: 'business-setup',
    component: BusinessSetupComponent,
    canActivate: [AuthGuard],
  },
  { path: 'join', component: JoinComponent },
  {
    path: 'business/:businessId',
    canActivate: [AuthGuard],
    children: [
      { path: '', component: BusinessDashboardComponent },
      { path: 'products', component: ProductManagementComponent },
      {
        path: 'sales',
        loadComponent: () =>
          import('./pages/sales/sales.page').then((m) => m.SalesPageComponent),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./pages/inventory/inventory.page').then(
            (m) => m.InventoryPageComponent
          ),
      },
      // Add more routes for inventory, sales, reports, etc.
    ],
  },

  {
    path: 'business/:businessId/reports',
    canActivate: [AuthGuard],
    component: ReportsPageComponent,
  },
  {
    path: 'business/:businessId/user-management',
    canActivate: [AuthGuard],
    component: BusinessUserManagementPageComponent,
  },

  { path: '**', redirectTo: '/home' },
];
