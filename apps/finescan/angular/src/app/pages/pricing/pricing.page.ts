import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonBackButton,
  IonButtons,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  flashOutline,
  rocketOutline,
  diamondOutline,
  infiniteOutline,
  serverOutline,
  shieldCheckmarkOutline,
  timeOutline,
} from 'ionicons/icons';
import { SubscriptionService, SubscriptionPlan } from '@rizzium/shared/services';
import { FirebaseAuthService } from '@rizzium/shared/services';
import { FooterComponent } from '@rizzium/shared/ui/organisms';
import { Observable, map, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [
    IonText,
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonList,
    IonItem,
    IonLabel,
    IonBackButton,
    IonButtons,
    FooterComponent,
  ],
  templateUrl: './pricing.page.html',
  styleUrls: ['./pricing.page.scss'],
})
export class PricingPageComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);

  plans$: Observable<SubscriptionPlan[]>;
  currentPlan$: Observable<SubscriptionPlan | null>;
  readonly Infinity = Infinity;

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      closeCircleOutline,
      flashOutline,
      rocketOutline,
      diamondOutline,
      infiniteOutline,
      serverOutline,
      shieldCheckmarkOutline,
      timeOutline,
    });
  }

  ngOnInit() {
    this.plans$ = this.subscriptionService.getAvailablePlans();
    this.currentPlan$ = this.subscriptionService.getCurrentSubscription().pipe(
      switchMap((subscription) => {
        if (!subscription) return of(null);
        return this.plans$.pipe(map((plans) => plans.find((p) => p.id === subscription.planId) || null));
      })
    );
  }

  formatStorage(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
  }

  async selectPlan(plan: SubscriptionPlan) {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/pricing' } });
      return;
    }

    try {
      await this.subscriptionService.trackPricingEvent({
        event: 'upgrade_started',
        planId: plan.id,
        planTier: plan.tier,
        userId: user.uid,
      });

      await this.subscriptionService.upgradePlan(plan.id);
    } catch (error) {
      console.error('Error upgrading plan:', error);
      if (user) {
        await this.subscriptionService.trackPricingEvent({
          event: 'upgrade_failed',
          planId: plan.id,
          planTier: plan.tier,
          userId: user.uid,
          error: error.message,
        });
      }
    }
  }
}
