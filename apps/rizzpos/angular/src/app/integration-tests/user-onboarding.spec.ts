import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { JoinComponent } from '../pages/join/join.component';
import {
  AuthService,
  BusinessService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';

describe('User Onboarding Integration Test', () => {
  let component: JoinComponent;
  let fixture: ComponentFixture<JoinComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let businessServiceSpy: jasmine.SpyObj<BusinessService>;
  let errorHandlerSpy: jasmine.SpyObj<ErrorHandlerService>;
  let router: Router;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const businessSpy = jasmine.createSpyObj('BusinessService', [
      'addUserToBusiness',
    ]);
    const errorSpy = jasmine.createSpyObj('ErrorHandlerService', [
      'handleError',
      'showSuccess',
    ]);

    await TestBed.configureTestingModule({
      declarations: [JoinComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (param: string) =>
                  param === 'businessId' ? 'testBusinessId' : 'cashier',
              },
            },
          },
        },
        { provide: AuthService, useValue: authSpy },
        { provide: BusinessService, useValue: businessSpy },
        { provide: ErrorHandlerService, useValue: errorSpy },
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate') },
        },
      ],
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    businessServiceSpy = TestBed.inject(
      BusinessService
    ) as jasmine.SpyObj<BusinessService>;
    errorHandlerSpy = TestBed.inject(
      ErrorHandlerService
    ) as jasmine.SpyObj<ErrorHandlerService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinComponent);
    component = fixture.componentInstance;
  });

  it('should handle join for authenticated cashier', fakeAsync(() => {
    authServiceSpy.getCurrentUser.and.returnValue(
      Promise.resolve({ uid: 'testUserId' })
    );
    businessServiceSpy.addUserToBusiness.and.returnValue(Promise.resolve());

    component.ngOnInit();
    tick();

    expect(businessServiceSpy.addUserToBusiness).toHaveBeenCalledWith(
      'testBusinessId',
      'testUserId',
      'cashier'
    );
    expect(router.navigate).toHaveBeenCalledWith([
      '/business',
      'testBusinessId',
      'cashier-dashboard',
    ]);
  }));

  it('should handle join for authenticated manager', fakeAsync(() => {
    component.role = 'manager';
    authServiceSpy.getCurrentUser.and.returnValue(
      Promise.resolve({ uid: 'testUserId' })
    );
    businessServiceSpy.addUserToBusiness.and.returnValue(Promise.resolve());

    component.ngOnInit();
    tick();

    expect(businessServiceSpy.addUserToBusiness).toHaveBeenCalledWith(
      'testBusinessId',
      'testUserId',
      'manager'
    );
    expect(router.navigate).toHaveBeenCalledWith([
      '/business',
      'testBusinessId',
      'manager-dashboard',
    ]);
  }));

  it('should redirect to customer dashboard for users without a role', fakeAsync(() => {
    component.role = null;
    authServiceSpy.getCurrentUser.and.returnValue(
      Promise.resolve({ uid: 'customerId' })
    );
    businessServiceSpy.addUserToBusiness.and.returnValue(Promise.resolve());

    component.ngOnInit();
    tick();

    expect(businessServiceSpy.addUserToBusiness).toHaveBeenCalledWith(
      'testBusinessId',
      'customerId',
      'customer'
    );
    expect(router.navigate).toHaveBeenCalledWith([
      '/business',
      'testBusinessId',
      'customer-dashboard',
    ]);
  }));
});
