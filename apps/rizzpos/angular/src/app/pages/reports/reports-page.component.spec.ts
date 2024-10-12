import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { ReportsPageComponent } from './reports-page.component';
import {
  TransactionService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';

describe('ReportsPageComponent', () => {
  let component: ReportsPageComponent;
  let fixture: ComponentFixture<ReportsPageComponent>;
  let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
  let errorHandlerSpy: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(async () => {
    const transactionSpy = jasmine.createSpyObj('TransactionService', [
      'getTransactions',
    ]);
    const errorSpy = jasmine.createSpyObj('ErrorHandlerService', [
      'handleError',
    ]);

    await TestBed.configureTestingModule({
      declarations: [ReportsPageComponent, HeaderComponent, FooterComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'testBusinessId' } } },
        },
        { provide: TransactionService, useValue: transactionSpy },
        { provide: ErrorHandlerService, useValue: errorSpy },
      ],
    }).compileComponents();

    transactionServiceSpy = TestBed.inject(
      TransactionService
    ) as jasmine.SpyObj<TransactionService>;
    errorHandlerSpy = TestBed.inject(
      ErrorHandlerService
    ) as jasmine.SpyObj<ErrorHandlerService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load transactions and prepare sales data', () => {
    const mockTransactions = [
      { id: '1', total: 100, date: new Date('2023-05-01') },
      { id: '2', total: 200, date: new Date('2023-05-02') },
    ];
    transactionServiceSpy.getTransactions.and.returnValue(of(mockTransactions));

    fixture.detectChanges();

    expect(component.transactions$).toBeTruthy();
    expect(component.dailySalesData).toBeTruthy();
    expect(component.monthlySalesData).toBeTruthy();
  });

  it('should handle errors when loading transactions', () => {
    const error = new Error('Test error');
    transactionServiceSpy.getTransactions.and.throwError(error);

    fixture.detectChanges();

    expect(errorHandlerSpy.handleError).toHaveBeenCalledWith(
      error,
      'Error loading business users'
    );
  });
});
