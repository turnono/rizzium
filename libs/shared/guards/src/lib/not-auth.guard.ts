import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { FirebaseAuthService } from '@rizzium/shared/services';
import { map, take, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NotAuthGuard implements CanActivate {
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);

  canActivate() {
    return this.authService.user$.pipe(
      take(1),
      tap((user) => console.log('NotAuthGuard: Current user state:', user)),
      map((user) => {
        if (user) {
          console.log('NotAuthGuard: User is logged in, redirecting to home');
          this.router.navigate(['/']);
          return false;
        }
        console.log('NotAuthGuard: No user, allowing access to login');
        return true;
      })
    );
  }
}
