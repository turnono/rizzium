import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { JoinComponent } from '../pages/join/join.component';
import { FirebaseAuthService, BusinessService } from '@rizzpos/shared/services';

describe('User Onboarding Integration Test', () => {
  let component: JoinComponent;
  let authServiceSpy: jasmine.SpyObj<FirebaseAuthService>;
  let businessServiceSpy: jasmine.SpyObj<BusinessService>;
  let router: Router;

  beforeEach(async () => {
    const authServiceMock = jasmine.createSpyObj('FirebaseAuthService', [
      'getCurrentUser',
      'signIn',
    ]);
    const businessServiceMock = jasmine.createSpyObj('BusinessService', [
      'addUserToBusiness',
    ]);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      declarations: [JoinComponent],
      providers: [
        { provide: FirebaseAuthService, useValue: authServiceMock },
        { provide: BusinessService, useValue: businessServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ businessId: 'testBusinessId', role: 'cashier' }),
          },
        },
      ],
    }).compileComponents();

    authServiceSpy = TestBed.inject(
      FirebaseAuthService
    ) as jasmine.SpyObj<FirebaseAuthService>;
    businessServiceSpy = TestBed.inject(
      BusinessService
    ) as jasmine.SpyObj<BusinessService>;
    router = TestBed.inject(Router);

    const fixture = TestBed.createComponent(JoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should handle join process for new user', fakeAsync(() => {
    authServiceSpy.getCurrentUser.and.returnValue(Promise.resolve(null));
    authServiceSpy.signIn.and.returnValue(
      Promise.resolve({ uid: 'newUserId' })
    );
    businessServiceSpy.addUserToBusiness.and.returnValue(Promise.resolve());

    const navigateSpy = spyOn(router, 'navigate');

    component.handleJoin();
    tick();

    expect(authServiceSpy.signIn).toHaveBeenCalled();
    expect(businessServiceSpy.addUserToBusiness).toHaveBeenCalledWith(
      'testBusinessId',
      'newUserId',
      'cashier'
    );
    expect(navigateSpy).toHaveBeenCalledWith([
      '/business',
      'testBusinessId',
      'dashboard',
    ]);
  }));

  it('should handle join process for existing user', fakeAsync(() => {
    authServiceSpy.getCurrentUser.and.returnValue(
      Promise.resolve({ uid: 'existingUserId' })
    );
    businessServiceSpy.addUserToBusiness.and.returnValue(Promise.resolve());

    const navigateSpy = spyOn(router, 'navigate');

    component.handleJoin();
    tick();

    expect(authServiceSpy.signIn).not.toHaveBeenCalled();
    expect(businessServiceSpy.addUserToBusiness).toHaveBeenCalledWith(
      'testBusinessId',
      'existingUserId',
      'cashier'
    );
    expect(navigateSpy).toHaveBeenCalledWith([
      '/business',
      'testBusinessId',
      'dashboard',
    ]);
  }));

  it('should redirect to customer dashboard for users without a role', fakeAsync(() => {
    component.role = null;
    authServiceSpy.getCurrentUser.and.returnValue(
      Promise.resolve({ uid: 'customerId' })
    );
    businessServiceSpy.addUserToBusiness.and.returnValue(Promise.resolve());

    const navigateSpy = spyOn(router, 'navigate');

    component.handleJoin();
    tick();

    expect(businessServiceSpy.addUserToBusiness).toHaveBeenCalledWith(
      'testBusinessId',
      'customerId',
      'customer'
    );
    expect(navigateSpy).toHaveBeenCalledWith([
      '/business',
      'testBusinessId',
      'customer-dashboard',
    ]);
  }));
});
