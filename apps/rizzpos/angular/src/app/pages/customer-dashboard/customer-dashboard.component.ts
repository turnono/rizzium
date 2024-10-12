import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import {
  CustomerService,
  BusinessService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { Purchase, Promotion } from '@rizzpos/shared/interfaces';

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FooterComponent],
})
export class CustomerDashboardComponent implements OnInit {
  businessId: string;
  customerId: string;
  purchases$: Observable<Purchase[]>;
  loyaltyPoints$: Observable<number>;
  promotions$: Observable<Promotion[]>;

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
    ]).subscribe(
      () => {},
      (error) =>
        this.errorHandler.handleError(error, 'Error loading customer data')
    );
  }
}
