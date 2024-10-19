import { User } from '@angular/fire/auth';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'customer' | 'anon';

export interface AppUser extends User {
  role: UserRole;
  businesses?: {
    [businessId: string]: UserRole;
  };
}
