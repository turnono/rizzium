import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { FirebaseAuthService } from '@rizzium/shared/services';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);

  canActivate() {
    return this.authService.user$.pipe(
      take(1),
      map((user) => {
        if (user) {
          return true;
        } else {
          this.router.navigate(['/']);
          return false;
        }
      })
    );
  }
}
