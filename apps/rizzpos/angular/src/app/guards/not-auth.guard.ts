import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { FirebaseAuthService } from '@rizzpos/shared/services';
import { Observable, map, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotAuthGuard implements CanActivate {
  constructor(
    private authService: FirebaseAuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.user$.pipe(
      take(1),
      map((user) => {
        if (user) {
          // User is authenticated, redirect to home page
          this.router.navigate(['/home']);
          return false;
        } else {
          // User is not authenticated, allow access to login page
          return true;
        }
      })
    );
  }
}
