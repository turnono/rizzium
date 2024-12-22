import { Timestamp } from '@angular/fire/firestore';

export interface Analysis {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
  completedAt?: Timestamp;
  results?: {
    riskLevel: 'high' | 'medium' | 'low';
    summary: string;
    flags: {
      start: number;
      end: number;
      reason: string;
      riskLevel: 'high' | 'medium' | 'low';
    }[];
    recommendations: string[];
  };
}
