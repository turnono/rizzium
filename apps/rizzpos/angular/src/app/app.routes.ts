import { Route } from '@angular/router';
import { HomePageComponent } from './pages/home/home.page';
import { LoginPageComponent } from './pages/login/login.page';
import { BusinessSetupComponent } from './pages/business-setup/business-setup.component';
import { BusinessDetailsComponent } from './pages/business-details/business-details.component';
import { AuthGuard } from '@rizzpos/shared/guards';

export const routes: Route[] = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  { path: 'home', component: HomePageComponent, canActivate: [AuthGuard] },
  { path: 'business-setup', component: BusinessSetupComponent, canActivate: [AuthGuard] },
  { path: 'business/:businessId', component: BusinessDetailsComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/home' }
];
