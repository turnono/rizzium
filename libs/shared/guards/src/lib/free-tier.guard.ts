import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SubscriptionService, UserSubscription } from '@rizzium/shared/services';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FreeTierGuard implements CanActivate {
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.subscriptionService.getCurrentSubscription().pipe(
      map((subscription: UserSubscription | null) => {
        console.log({ subscription });
        if (subscription?.planId === 'pro-monthly' && subscription?.status === 'active') {
          this.router.navigate(['/home']);
          return false;
        }
        return true;
      })
    );
  }
}
