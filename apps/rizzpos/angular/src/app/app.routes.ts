import { Route } from '@angular/router';
import { LoginPageComponent }  from './pages/login/login.page';
import { AuthGuard } from '@rizzpos/shared/guards';
import { HomePageComponent } from './pages/home/home.page';

export const routes: Route[] = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomePageComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginPageComponent },
  { path: '**', redirectTo: '/home' },
];
