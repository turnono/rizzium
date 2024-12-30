import { Timestamp } from '@angular/fire/firestore';

export interface UsageData {
  scansUsed: number;
  scansLimit: number;
  storageUsed: number;
  storageLimit: number;
  retentionDays: number;
  lastResetDate: Timestamp;
}
