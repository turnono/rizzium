import { Route } from '@angular/router';
import { HomePageComponent } from './pages/home/home.page';
import { LoginPageComponent } from './pages/login/login.page';
import { BusinessSetupComponent } from './pages/business-setup/business-setup.component';
import { BusinessDashboardComponent } from './pages/business-dashboard/business-dashboard.component';
import { ProductManagementComponent } from './pages/product-management/product-management.component';
import { AuthGuard } from '@rizzpos/shared/guards';

export const routes: Route[] = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  { path: 'home', component: HomePageComponent, canActivate: [AuthGuard] },
  { path: 'business-setup', component: BusinessSetupComponent, canActivate: [AuthGuard] },
  {
    path: 'business/:businessId',
    canActivate: [AuthGuard],
    children: [
      { path: '', component: BusinessDashboardComponent },
      { path: 'products', component: ProductManagementComponent },
      // Add more routes for inventory, sales, reports, etc.
    ]
  },
  { path: '**', redirectTo: '/home' }
];
