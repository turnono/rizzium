import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { SalesPageComponent } from '../pages/sales/sales-page.component';
import {
  ProductService,
  TransactionService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { Product } from '@rizzpos/shared/interfaces';

describe('Transactions Integration Test', () => {
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
      declarations: [SalesPageComponent],
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

  it('should process a transaction with multiple products', fakeAsync(() => {
    const mockProducts: Product[] = [
      { id: '1', name: 'Product 1', price: 10, stockQuantity: 100 },
      { id: '2', name: 'Product 2', price: 20, stockQuantity: 50 },
    ];
    productServiceSpy.getProducts.and.returnValue(of(mockProducts));
    transactionServiceSpy.createTransaction.and.returnValue(of({}));

    fixture.detectChanges();
    tick();

    component.addToCart(mockProducts[0]);
    component.addToCart(mockProducts[0]);
    component.addToCart(mockProducts[1]);

    component.processTransaction();
    tick();

    expect(transactionServiceSpy.createTransaction).toHaveBeenCalledWith({
      businessId: 'testBusinessId',
      items: [
        { productId: '1', quantity: 2, price: 10 },
        { productId: '2', quantity: 1, price: 20 },
      ],
      total: 40,
      date: jasmine.any(Date),
    });

    expect(errorHandlerSpy.showSuccess).toHaveBeenCalledWith(
      'Transaction processed successfully'
    );
    expect(component.cart.length).toBe(0);
  }));

  it('should handle transaction errors', fakeAsync(() => {
    const mockProducts: Product[] = [
      { id: '1', name: 'Product 1', price: 10, stockQuantity: 100 },
    ];
    productServiceSpy.getProducts.and.returnValue(of(mockProducts));
    const error = new Error('Transaction failed');
    transactionServiceSpy.createTransaction.and.returnValue(of(error));

    fixture.detectChanges();
    tick();

    component.addToCart(mockProducts[0]);
    component.processTransaction();
    tick();

    expect(errorHandlerSpy.handleError).toHaveBeenCalledWith(
      error,
      'Error processing transaction'
    );
    expect(component.cart.length).toBe(1); // Cart should not be cleared on error
  }));
});
