import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import {
  CustomerService,
  BusinessService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { Purchase, Promotion } from '@rizzpos/shared/interfaces';
import { IonCard } from '@ionic/angular/standalone';
import { IonCardHeader } from '@ionic/angular/standalone';
import { IonCardContent } from '@ionic/angular/standalone';
import { IonList } from '@ionic/angular/standalone';
import { IonItem } from '@ionic/angular/standalone';
import { IonLabel } from '@ionic/angular/standalone';
import { IonGrid } from '@ionic/angular/standalone';
import { IonRow } from '@ionic/angular/standalone';
import { IonCol } from '@ionic/angular/standalone';
import { IonContent } from '@ionic/angular/standalone';
import { IonButton } from '@ionic/angular/standalone';
import { IonCardTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.page.html',
  styleUrl: './customer-dashboard.page.scss',
  standalone: true,
  imports: [
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
  ],
})
export class CustomerDashboardComponent implements OnInit {
  businessId: string;
  customerId: string;
  purchases$?: Observable<Purchase[]>;
  loyaltyPoints$?: Observable<number>;
  promotions$?: Observable<Promotion[]>;

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private businessService: BusinessService,
    private errorHandler: ErrorHandlerService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.customerId = this.route.snapshot.paramMap.get('customerId') || '';
  }

  ngOnInit() {
    this.loadCustomerData();
  }

  loadCustomerData() {
    this.purchases$ = this.customerService
      .getCustomerPurchases(this.businessId, this.customerId)
      .pipe(
        map((purchases) =>
          purchases.sort((a, b) => b.date.getTime() - a.date.getTime())
        )
      );

    this.loyaltyPoints$ = this.customerService.getCustomerLoyaltyPoints(
      this.businessId,
      this.customerId
    );

    this.promotions$ = this.businessService.getActivePromotions(
      this.businessId
    );

    combineLatest([
      this.purchases$,
      this.loyaltyPoints$,
      this.promotions$,
    ]).subscribe({
      next: () => {
        console.log('Data loaded successfully');
      },
      error: (error: unknown) =>
        this.errorHandler.handleError(error, 'Error loading customer data'),
    });
  }
}
