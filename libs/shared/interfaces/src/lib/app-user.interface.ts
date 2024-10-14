import { User } from '@angular/fire/auth';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'client' | 'anon';

export interface AppUser extends User {
  role: UserRole;
  businessId?: string;
}
