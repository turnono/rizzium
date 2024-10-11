import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';
import { FirebaseAuthService, BusinessService } from '@rizzpos/shared/services';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: FirebaseAuthService,
    private businessService: BusinessService,
    private router: Router
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      return this.router.createUrlTree(['/login']);
    }

    const businessId = route.paramMap.get('businessId');
    if (!businessId) {
      return this.router.createUrlTree(['/dashboard']);
    }

    const userRole = await this.businessService.getUserRole(
      businessId,
      user.uid
    );
    const allowedRoles = route.data['roles'] as string[];

    if (allowedRoles.includes(userRole)) {
      return true;
    } else {
      // Redirect to an unauthorized page or show an error message
      return this.router.createUrlTree(['/unauthorized']);
    }
  }
}
