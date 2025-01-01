import { User } from '@angular/fire/auth';
import { Timestamp } from '@angular/fire/firestore';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'customer' | 'anon';
export type UserTier = 'free' | 'pro';

export interface AppUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tier: UserTier;
  businesses?: {
    [businessId: string]: UserRole;
  };
}

export type AppUser = User & AppUserData;
