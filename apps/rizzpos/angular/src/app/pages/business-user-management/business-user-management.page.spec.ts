import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { BusinessUserManagementComponent } from './business-user-management.page';
import {
  BusinessService,
  FirebaseAuthService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';

describe('BusinessUserManagementComponent', () => {
  let component: BusinessUserManagementComponent;
  let fixture: ComponentFixture<BusinessUserManagementComponent>;
  let businessServiceSpy: jasmine.SpyObj<BusinessService>;
  let authServiceSpy: jasmine.SpyObj<FirebaseAuthService>;
  let errorHandlerSpy: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(async () => {
    const businessServiceMock = jasmine.createSpyObj('BusinessService', [
      'getBusinessUsers',
      'updateUserRole',
      'removeUserFromBusiness',
    ]);
    const authServiceMock = jasmine.createSpyObj('FirebaseAuthService', [
      'getCurrentUser',
    ]);
    const errorHandlerMock = jasmine.createSpyObj('ErrorHandlerService', [
      'handleError',
      'showSuccess',
    ]);

    await TestBed.configureTestingModule({
      declarations: [
        BusinessUserManagementComponent,
        HeaderComponent,
        FooterComponent,
      ],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'testBusinessId' } } },
        },
        { provide: BusinessService, useValue: businessServiceMock },
        { provide: FirebaseAuthService, useValue: authServiceMock },
        { provide: ErrorHandlerService, useValue: errorHandlerMock },
      ],
    }).compileComponents();

    businessServiceSpy = TestBed.inject(
      BusinessService
    ) as jasmine.SpyObj<BusinessService>;
    authServiceSpy = TestBed.inject(
      FirebaseAuthService
    ) as jasmine.SpyObj<FirebaseAuthService>;
    errorHandlerSpy = TestBed.inject(
      ErrorHandlerService
    ) as jasmine.SpyObj<ErrorHandlerService>;

    fixture = TestBed.createComponent(BusinessUserManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load business users on init', async () => {
    const mockUsers = [
      { id: '1', name: 'User 1', email: 'user1@example.com', role: 'cashier' },
    ];
    businessServiceSpy.getBusinessUsers.and.returnValue(
      Promise.resolve(mockUsers)
    );
    authServiceSpy.getCurrentUser.and.returnValue(
      Promise.resolve({ uid: 'currentUser' })
    );

    await component.ngOnInit();

    expect(component.businessUsers).toEqual(mockUsers);
    expect(component.loading).toBeFalse();
    expect(component.currentUserId).toBe('currentUser');
  });

  it('should update user role', async () => {
    businessServiceSpy.updateUserRole.and.returnValue(Promise.resolve());
    businessServiceSpy.getBusinessUsers.and.returnValue(Promise.resolve([]));

    await component.updateUserRole('userId', 'manager');

    expect(businessServiceSpy.updateUserRole).toHaveBeenCalledWith(
      'testBusinessId',
      'userId',
      'manager'
    );
    expect(errorHandlerSpy.showSuccess).toHaveBeenCalled();
    expect(businessServiceSpy.getBusinessUsers).toHaveBeenCalled();
  });

  it('should remove user', async () => {
    businessServiceSpy.removeUserFromBusiness.and.returnValue(
      Promise.resolve()
    );
    businessServiceSpy.getBusinessUsers.and.returnValue(Promise.resolve([]));
    component.currentUserId = 'currentUser';

    await component.removeUser('otherUser');

    expect(businessServiceSpy.removeUserFromBusiness).toHaveBeenCalledWith(
      'testBusinessId',
      'otherUser'
    );
    expect(errorHandlerSpy.showSuccess).toHaveBeenCalled();
    expect(businessServiceSpy.getBusinessUsers).toHaveBeenCalled();
  });

  it('should not remove current user', async () => {
    component.currentUserId = 'currentUser';

    await component.removeUser('currentUser');

    expect(businessServiceSpy.removeUserFromBusiness).not.toHaveBeenCalled();
    expect(errorHandlerSpy.handleError).toHaveBeenCalled();
  });
});
