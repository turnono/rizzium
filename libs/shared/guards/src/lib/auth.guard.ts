import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { FirebaseAuthService } from '@rizzpos/shared/services';
import { map, take, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: FirebaseAuthService,
    private router: Router
  ) {}

  canActivate() {
    return this.authService.user$.pipe(
      take(1),
      tap((user) => console.log('AuthGuard user state:', user)),
      map((user) => {
        if (user) {
          return true;
        } else {
          console.log('User not authenticated, redirecting to login');
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
