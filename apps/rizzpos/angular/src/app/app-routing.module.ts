import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  // ... existing routes ...
  {
    path: 'business/:businessId/sales',
    loadComponent: () =>
      import('./pages/sales/sales.component').then((m) => m.SalesComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['cashier', 'manager', 'owner'] },
  },
  {
    path: 'business/:businessId/inventory',
    loadComponent: () =>
      import('./pages/inventory/inventory.component').then(
        (m) => m.InventoryComponent
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['manager', 'owner'] },
  },
  {
    path: 'business/:businessId/reports',
    loadComponent: () =>
      import('./pages/reports/reports.component').then(
        (m) => m.ReportsComponent
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['manager', 'owner'] },
  },
  // ... other routes ...
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
