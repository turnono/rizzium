import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import {
  BusinessService,
  CustomerService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import { Observable, catchError, map, of, from } from 'rxjs';
import {
  BusinessData,
  Promotion,
  Transaction,
} from '@rizzpos/shared/interfaces';

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
  businessData$?: Observable<BusinessData>;
  loyaltyPoints$?: Observable<number>;
  recentTransactions$?: Observable<Transaction[]>;
  activePromotions$?: Observable<Promotion[]>;

  constructor(
    private route: ActivatedRoute,
    private businessService: BusinessService,
    private customerService: CustomerService,
    private errorHandler: ErrorHandlerService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.customerId = this.route.snapshot.paramMap.get('customerId') || '';
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.businessData$ = from(
      this.businessService.getBusinessData(this.businessId)
    ).pipe(
      catchError((error) => {
        this.errorHandler.handleError(error, 'Error loading business data');
        return of(null);
      }),
      map((data: BusinessData | null) => {
        if (data === null) {
          return {} as BusinessData;
        }
        return data;
      })
    ) as Observable<BusinessData>;

    this.loyaltyPoints$ = from(
      this.businessService.getLoyaltyPoints(this.businessId, this.customerId)
    ).pipe(
      catchError((error) => {
        this.errorHandler.handleError(error, 'Error loading loyalty points');
        return of(0);
      })
    );

    this.recentTransactions$ = of(
      this.customerService.getRecentTransactions(
        this.businessId,
        this.customerId
      )
    ).pipe(
      catchError((error) => {
        this.errorHandler.handleError(
          error,
          'Error loading recent transactions'
        );
        return of([]);
      })
    ) as Observable<Transaction[]>;

    this.activePromotions$ = from(
      this.businessService.getActivePromotions(this.businessId)
    ).pipe(
      map((promotions: { id: string }[]) =>
        promotions.map(
          (promo) =>
            ({
              ...promo,
              title: '',
              description: '',
              expiryDate: new Date(),
            } as Promotion)
        )
      ),
      catchError((error) => {
        this.errorHandler.handleError(error, 'Error loading active promotions');
        return of([]);
      })
    );
  }
}
