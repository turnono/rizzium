import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FirebaseAuthService, BusinessService } from '@rizzpos/shared/services';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import { Observable, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { BusinessData } from '@rizzpos/shared/interfaces';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    HeaderComponent,
    FooterComponent,
    RouterModule,
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
          return this.businessService.getUserBusinesses$(user.uid);
        } else {
          return [];
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
