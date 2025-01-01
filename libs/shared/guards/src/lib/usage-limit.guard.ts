import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UsageLimitService } from '@rizzium/shared/services';

@Injectable({
  providedIn: 'root',
})
export class UsageLimitGuard implements CanActivate {
  private usageLimitService = inject(UsageLimitService);
  private router = inject(Router);

  async canActivate(): Promise<boolean> {
    try {
      const hasReachedLimit = await this.usageLimitService.hasReachedLimit();
      console.log('hasReachedLimit', hasReachedLimit);
      if (hasReachedLimit.hasReached) {
        await this.router.navigate(['/pricing']);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return false;
    }
  }
}
