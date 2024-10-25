import { User } from '@angular/fire/auth';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'customer' | 'anon';

export interface AppUser extends User {
  uid: string;
  email: string;
  displayName: string;
  businesses: {
    [businessId: string]: UserRole;
  };
}
