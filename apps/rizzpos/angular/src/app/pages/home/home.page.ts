import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FirebaseAuthService, BusinessService } from '@rizzpos/shared/services';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import { Observable, Subscription, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { BusinessData } from '@rizzpos/shared/interfaces';
import {
  IonBackButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule,
    IonIcon,
    IonContent,
  ],
})
export class HomePageComponent implements OnInit, OnDestroy {
  businesses$: Observable<BusinessData[]>;
  loading = true;
  error: string | null = null;
  private subscription?: Subscription;

  constructor(
    private authService: FirebaseAuthService,
    private businessService: BusinessService,
    private router: Router
  ) {
    this.businesses$ = this.authService.user$.pipe(
      switchMap((user) => {
        if (user) {
          return this.businessService.getUserBusinesses$(user.uid).pipe(
            catchError((error) => {
              console.error('Error loading businesses:', error);
              this.error = 'Failed to load businesses. Please try again.';
              return of([]);
            })
          );
        } else {
          return of([]);
        }
      })
    );
  }

  ngOnInit() {
    this.subscription = this.businesses$.subscribe({
      next: () => {
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading businesses:', err);
        this.error = 'Failed to load businesses. Please try again.';
        this.loading = false;
      },
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  goToBusiness(businessId: string) {
    this.router.navigate(['/business', businessId]);
  }

  createNewBusiness() {
    this.router.navigate(['/business-setup']);
  }
}
