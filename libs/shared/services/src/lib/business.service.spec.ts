import { TestBed } from '@angular/core/testing';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from '@angular/fire/firestore';
import { BusinessService } from './business.service';
import { FirebaseAuthService } from './firebase-auth.service';

describe('BusinessService', () => {
  let service: BusinessService;
  let firestoreSpy: jasmine.SpyObj<Firestore>;
  let authServiceSpy: jasmine.SpyObj<FirebaseAuthService>;

  beforeEach(() => {
    const firestoreMock = jasmine.createSpyObj('Firestore', [
      'collection',
      'doc',
    ]);
    const authServiceMock = jasmine.createSpyObj('FirebaseAuthService', [
      'getCurrentUser',
    ]);

    TestBed.configureTestingModule({
      providers: [
        BusinessService,
        { provide: Firestore, useValue: firestoreMock },
        { provide: FirebaseAuthService, useValue: authServiceMock },
      ],
    });

    service = TestBed.inject(BusinessService);
    firestoreSpy = TestBed.inject(Firestore) as jasmine.SpyObj<Firestore>;
    authServiceSpy = TestBed.inject(
      FirebaseAuthService
    ) as jasmine.SpyObj<FirebaseAuthService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get business users', async () => {
    const mockUsers = [
      {
        id: '1',
        data: () => ({
          name: 'User 1',
          email: 'user1@example.com',
          role: 'cashier',
        }),
      },
      {
        id: '2',
        data: () => ({
          name: 'User 2',
          email: 'user2@example.com',
          role: 'manager',
        }),
      },
    ];
    const mockQuerySnapshot = { docs: mockUsers };
    const mockCollection = jasmine.createSpyObj('collection', ['get']);
    mockCollection.get.and.returnValue(Promise.resolve(mockQuerySnapshot));
    firestoreSpy.collection.and.returnValue(mockCollection);

    const result = await service.getBusinessUsers('testBusinessId');

    expect(result.length).toBe(2);
    expect(result[0].name).toBe('User 1');
    expect(result[1].role).toBe('manager');
  });

  it('should update user role', async () => {
    const mockDoc = jasmine.createSpyObj('doc', ['update']);
    mockDoc.update.and.returnValue(Promise.resolve());
    firestoreSpy.doc.and.returnValue(mockDoc);

    await service.updateUserRole('testBusinessId', 'userId', 'manager');

    expect(mockDoc.update).toHaveBeenCalledWith({ role: 'manager' });
  });

  it('should remove user from business', async () => {
    const mockDoc = jasmine.createSpyObj('doc', ['delete', 'get']);
    mockDoc.delete.and.returnValue(Promise.resolve());
    mockDoc.get.and.returnValue(
      Promise.resolve({
        exists: true,
        data: () => ({ businesses: ['testBusinessId', 'otherBusinessId'] }),
      })
    );
    firestoreSpy.doc.and.returnValue(mockDoc);

    await service.removeUserFromBusiness('testBusinessId', 'userId');

    expect(mockDoc.delete).toHaveBeenCalled();
    expect(mockDoc.get).toHaveBeenCalled();
  });
});
