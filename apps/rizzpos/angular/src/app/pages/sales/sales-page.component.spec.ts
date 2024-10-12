import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { SalesPageComponent } from './sales-page.component';
import {
  ProductService,
  TransactionService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';

describe('SalesPageComponent', () => {
  let component: SalesPageComponent;
  let fixture: ComponentFixture<SalesPageComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
  let errorHandlerSpy: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(async () => {
    const productSpy = jasmine.createSpyObj('ProductService', ['getProducts']);
    const transactionSpy = jasmine.createSpyObj('TransactionService', [
      'createTransaction',
    ]);
    const errorSpy = jasmine.createSpyObj('ErrorHandlerService', [
      'handleError',
      'showSuccess',
    ]);

    await TestBed.configureTestingModule({
      declarations: [SalesPageComponent, HeaderComponent, FooterComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'testBusinessId' } } },
        },
        { provide: ProductService, useValue: productSpy },
        { provide: TransactionService, useValue: transactionSpy },
        { provide: ErrorHandlerService, useValue: errorSpy },
      ],
    }).compileComponents();

    productServiceSpy = TestBed.inject(
      ProductService
    ) as jasmine.SpyObj<ProductService>;
    transactionServiceSpy = TestBed.inject(
      TransactionService
    ) as jasmine.SpyObj<TransactionService>;
    errorHandlerSpy = TestBed.inject(
      ErrorHandlerService
    ) as jasmine.SpyObj<ErrorHandlerService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SalesPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    const mockProducts = [{ id: '1', name: 'Test Product', price: 10 }];
    productServiceSpy.getProducts.and.returnValue(of(mockProducts));

    fixture.detectChanges();

    expect(component.products$).toBeTruthy();
  });

  it('should add product to cart', () => {
    const product = { id: '1', name: 'Test Product', price: 10 };
    component.addToCart(product);
    expect(component.cart.length).toBe(1);
    expect(component.cart[0].product).toEqual(product);
    expect(component.cart[0].quantity).toBe(1);
  });

  it('should remove product from cart', () => {
    const product = { id: '1', name: 'Test Product', price: 10 };
    component.addToCart(product);
    component.removeFromCart(product);
    expect(component.cart.length).toBe(0);
  });

  it('should process transaction', () => {
    const product = { id: '1', name: 'Test Product', price: 10 };
    component.addToCart(product);
    transactionServiceSpy.createTransaction.and.returnValue(of({}));

    component.processTransaction();

    expect(transactionServiceSpy.createTransaction).toHaveBeenCalled();
    expect(errorHandlerSpy.showSuccess).toHaveBeenCalledWith(
      'Transaction processed successfully'
    );
    expect(component.cart.length).toBe(0);
  });
});
