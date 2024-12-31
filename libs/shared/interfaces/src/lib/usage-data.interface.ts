import { Timestamp } from '@angular/fire/firestore';
import { UserTier } from './app-user.interface';

export interface UsageData {
  scansUsed: number;
  scansLimit: number;
  storageUsed: number;
  storageLimit: number;
  retentionDays: number;
  lastResetDate: Timestamp;
  tier: UserTier;
}
