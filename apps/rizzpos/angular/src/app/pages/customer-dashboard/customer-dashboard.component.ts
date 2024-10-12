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
import { Observable, catchError, forkJoin, map, of, finalize } from 'rxjs';
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
  businessData$: Observable<BusinessData | null>;
  loyaltyPoints$: Observable<number>;
  recentTransactions$: Observable<Transaction[]>;
  activePromotions$: Observable<Promotion[]>;
  isLoading = true;

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
    this.isLoading = true;
    forkJoin({
      businessData: this.businessService.getBusinessData(this.businessId),
      loyaltyPoints: this.businessService.getLoyaltyPoints(
        this.businessId,
        this.customerId
      ),
      recentTransactions: this.customerService.getRecentTransactions(
        this.businessId,
        this.customerId
      ),
      activePromotions: this.businessService.getActivePromotions(
        this.businessId
      ),
    })
      .pipe(
        catchError((error) => {
          this.errorHandler.handleError(
            error,
            'Error loading customer dashboard data'
          );
          return of({
            businessData: null,
            loyaltyPoints: 0,
            recentTransactions: [],
            activePromotions: [],
          });
        }),
        finalize(() => (this.isLoading = false))
      )
      .subscribe((result) => {
        this.businessData$ = of(result.businessData);
        this.loyaltyPoints$ = of(result.loyaltyPoints);
        this.recentTransactions$ = of(result.recentTransactions);
        this.activePromotions$ = of(result.activePromotions);
      });
  }
}
