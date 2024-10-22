import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HeaderComponent, FooterComponent } from '@rizzium/shared/ui/organisms';
import {
  CustomerService,
  BusinessService,
  ErrorHandlerService,
  FirebaseAuthService,
} from '@rizzium/shared/services';
import { Purchase, Promotion } from '@rizzium/shared/interfaces';
import {
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonContent,
  IonButton,
  IonCardTitle,
  IonSpinner,
  IonBadge,
  IonNote,
  IonChip,
} from '@ionic/angular/standalone';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.page.html',
  styleUrl: './customer-dashboard.page.scss',
  standalone: true,
  imports: [
    IonChip,
    CommonModule,
    HeaderComponent,
    FooterComponent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonContent,
    IonSpinner,
    MatProgressBarModule,
    IonNote,
    IonBadge,
  ],
})
export class CustomerDashboardPageComponent implements OnInit {
  businessId: string;
  customerId = '';
  purchases$: Observable<Purchase[]>;
  loyaltyPoints$: Observable<number>;
  promotions$: Observable<Promotion[]>;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private businessService: BusinessService,
    private errorHandler: ErrorHandlerService,
    private authService: FirebaseAuthService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.purchases$ = new Observable<Purchase[]>();
    this.loyaltyPoints$ = new Observable<number>();
    this.promotions$ = new Observable<Promotion[]>();
  }

  ngOnInit() {
    this.loadCustomerData();
  }

  loadCustomerData() {
    const customerData$ = from(this.authService.getCurrentUser()).pipe(
      switchMap((user) => {
        if (user && 'uid' in user) {
          this.customerId = user.uid;
          return combineLatest([
            this.customerService.getCustomerPurchases(
              this.businessId,
              this.customerId
            ),
            this.customerService.getCustomerLoyaltyPoints(
              this.businessId,
              this.customerId
            ),
            this.businessService.getActivePromotions(this.businessId),
          ]);
        } else {
          throw new Error('User not authenticated');
        }
      })
    );

    customerData$.subscribe({
      next: ([purchases, loyaltyPoints, promotions]: [
        Purchase[],
        number,
        Promotion[]
      ]) => {
        this.purchases$ = of(
          purchases.sort(
            (a: Purchase, b: Purchase) => b.date.getTime() - a.date.getTime()
          )
        );
        this.loyaltyPoints$ = of(loyaltyPoints);
        this.promotions$ = of(promotions);
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.errorHandler.handleError(error, 'Error loading customer data');
        this.isLoading = false;
      },
    });
  }
}
