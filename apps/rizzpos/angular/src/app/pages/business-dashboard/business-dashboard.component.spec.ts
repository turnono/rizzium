import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { BusinessDashboardComponent } from './business-dashboard.component';
import { BusinessService, ProductService } from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';

describe('BusinessDashboardComponent', () => {
  let component: BusinessDashboardComponent;
  let fixture: ComponentFixture<BusinessDashboardComponent>;
  let businessServiceSpy: jasmine.SpyObj<BusinessService>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;

  beforeEach(async () => {
    const businessSpy = jasmine.createSpyObj('BusinessService', [
      'getBusinessData',
    ]);
    const productSpy = jasmine.createSpyObj('ProductService', [
      'getLowStockProducts',
    ]);

    await TestBed.configureTestingModule({
      declarations: [BusinessDashboardComponent],
      imports: [IonicModule.forRoot(), HeaderComponent, FooterComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '123' } } },
        },
        { provide: BusinessService, useValue: businessSpy },
        { provide: ProductService, useValue: productSpy },
      ],
    }).compileComponents();

    businessServiceSpy = TestBed.inject(
      BusinessService
    ) as jasmine.SpyObj<BusinessService>;
    productServiceSpy = TestBed.inject(
      ProductService
    ) as jasmine.SpyObj<ProductService>;

    fixture = TestBed.createComponent(BusinessDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load business data on init', async () => {
    const mockBusinessData = { id: '123', businessName: 'Test Business' };
    businessServiceSpy.getBusinessData.and.returnValue(
      Promise.resolve(mockBusinessData)
    );
    productServiceSpy.getLowStockProducts.and.returnValue(of([]));

    await component.ngOnInit();

    expect(businessServiceSpy.getBusinessData).toHaveBeenCalledWith('123');
    expect(component.businessData).toEqual(mockBusinessData);
  });

  // Add more tests as needed
});
