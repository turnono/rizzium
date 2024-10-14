import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { CustomerDashboardComponent } from './customer-dashboard.page';
import {
  CustomerService,
  BusinessService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';

describe('CustomerDashboardComponent', () => {
  let component: CustomerDashboardComponent;
  let fixture: ComponentFixture<CustomerDashboardComponent>;
  let customerServiceSpy: jasmine.SpyObj<CustomerService>;
  let businessServiceSpy: jasmine.SpyObj<BusinessService>;
  let errorHandlerSpy: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(async () => {
    const customerSpy = jasmine.createSpyObj('CustomerService', [
      'getCustomerPurchases',
      'getCustomerLoyaltyPoints',
    ]);
    const businessSpy = jasmine.createSpyObj('BusinessService', [
      'getActivePromotions',
    ]);
    const errorSpy = jasmine.createSpyObj('ErrorHandlerService', [
      'handleError',
    ]);

    await TestBed.configureTestingModule({
      declarations: [
        CustomerDashboardComponent,
        HeaderComponent,
        FooterComponent,
      ],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'testBusinessId' } } },
        },
        { provide: CustomerService, useValue: customerSpy },
        { provide: BusinessService, useValue: businessSpy },
        { provide: ErrorHandlerService, useValue: errorSpy },
      ],
    }).compileComponents();

    customerServiceSpy = TestBed.inject(
      CustomerService
    ) as jasmine.SpyObj<CustomerService>;
    businessServiceSpy = TestBed.inject(
      BusinessService
    ) as jasmine.SpyObj<BusinessService>;
    errorHandlerSpy = TestBed.inject(
      ErrorHandlerService
    ) as jasmine.SpyObj<ErrorHandlerService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load customer data on init', () => {
    const mockPurchases = [{ id: '1', total: 100, date: new Date() }];
    const mockLoyaltyPoints = 50;
    const mockPromotions = [{ id: '1', name: 'Test Promotion', discount: 10 }];

    customerServiceSpy.getCustomerPurchases.and.returnValue(of(mockPurchases));
    customerServiceSpy.getCustomerLoyaltyPoints.and.returnValue(
      of(mockLoyaltyPoints)
    );
    businessServiceSpy.getActivePromotions.and.returnValue(of(mockPromotions));

    fixture.detectChanges();

    expect(component.purchases$).toBeTruthy();
    expect(component.loyaltyPoints$).toBeTruthy();
    expect(component.promotions$).toBeTruthy();
  });

  it('should handle errors when loading data', () => {
    const error = new Error('Test error');
    customerServiceSpy.getCustomerPurchases.and.returnValue(of([]));
    customerServiceSpy.getCustomerLoyaltyPoints.and.returnValue(of(0));
    businessServiceSpy.getActivePromotions.and.throwError(error);

    fixture.detectChanges();

    expect(errorHandlerSpy.handleError).toHaveBeenCalledWith(
      error,
      'Error loading customer data'
    );
  });
});
