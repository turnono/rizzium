import { Route } from '@angular/router';
import { HomePageComponent } from './pages/home/home.page';
import { LoginPageComponent } from './pages/login/login.page';
import { BusinessSetupComponent } from './pages/business-setup/business-setup.page';
import { BusinessDashboardComponent } from './pages/business-dashboard/business-dashboard.page';
import { ProductManagementComponent } from './pages/product-management/product-management.page';
import { AuthGuard } from '@rizzpos/shared/guards';
import { NotAuthGuard } from './guards/not-auth.guard';
import { InventoryPageComponent } from './pages/inventory/inventory.page';
import { SalesPageComponent } from './pages/sales/sales.page';
import { ReportsPageComponent } from './pages/reports/reports.page';
import { BusinessUserManagementPageComponent } from './pages/business-user-management/business-user-management.page';
import { CustomerDashboardPageComponent } from './pages/customer-dashboard/customer-dashboard.page';

export const routes: Route[] = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginPageComponent,
    canActivate: [NotAuthGuard],
  },
  { path: 'home', component: HomePageComponent, canActivate: [AuthGuard] },
  {
    path: 'business-setup',
    component: BusinessSetupComponent,
    canActivate: [AuthGuard],
  },
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
      {
        path: 'customer-dashboard',
        loadComponent: () =>
          import('./pages/customer-dashboard/customer-dashboard.page').then(
            (m) => m.CustomerDashboardPageComponent
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.page').then(
            (m) => m.ReportsPageComponent
          ),
      },
      {
        path: 'user-management',
        loadComponent: () =>
          import(
            './pages/business-user-management/business-user-management.page'
          ).then((m) => m.BusinessUserManagementPageComponent),
      },
    ],
  },
  { path: '**', redirectTo: '/home' },
];
