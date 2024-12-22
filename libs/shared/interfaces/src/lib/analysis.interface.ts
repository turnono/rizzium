import { Timestamp } from '@angular/fire/firestore';

export type AnalysisStatus = 'uploaded' | 'processing' | 'completed' | 'failed' | 'pending';

export interface Analysis {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  status: AnalysisStatus;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  results?: {
    text: string;
    riskLevel: 'high' | 'medium' | 'low';
    summary: {
      riskLevel: 'high' | 'medium' | 'low';
      description: string;
      recommendations: string[];
    };
    flags: {
      start: number;
      end: number;
      reason: string;
      riskLevel: 'high' | 'medium' | 'low';
    }[];
    recommendations: string[];
  };
}
