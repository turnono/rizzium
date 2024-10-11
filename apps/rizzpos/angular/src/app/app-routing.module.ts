import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { CustomerDashboardComponent } from './pages/customer-dashboard/customer-dashboard.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'join',
    loadComponent: () =>
      import('./pages/join/join.component').then((m) => m.JoinComponent),
  },
  {
    path: 'business/:businessId',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './pages/business-dashboard/business-dashboard.component'
          ).then((m) => m.BusinessDashboardComponent),
      },
      {
        path: 'user-management',
        loadComponent: () =>
          import(
            './pages/business-user-management/business-user-management.component'
          ).then((m) => m.BusinessUserManagementComponent),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./pages/inventory/inventory.component').then(
            (m) => m.InventoryComponent
          ),
      },
      {
        path: 'sales',
        loadComponent: () =>
          import('./pages/sales/sales.component').then((m) => m.SalesComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.component').then(
            (m) => m.ReportsComponent
          ),
      },
      {
        path: 'customer-dashboard',
        loadComponent: () =>
          import(
            './pages/customer-dashboard/customer-dashboard.component'
          ).then((m) => m.CustomerDashboardComponent),
      },
    ],
  },
  {
    path: 'business/:businessId/customer-dashboard/:customerId',
    component: CustomerDashboardComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
