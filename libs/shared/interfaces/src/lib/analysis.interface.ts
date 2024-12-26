import { Timestamp } from '@angular/fire/firestore';

export type AnalysisStatus = 'pending' | 'uploaded' | 'processing' | 'completed' | 'failed';

export interface UserSettings {
  region: string;
  locale: string;
  timezone: string;
  dateFormat: string;
  currencyCode: string;
}

export interface Analysis {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  status: AnalysisStatus;
  metadata?: {
    uploadedAt: string;
    contentType: string;
    size: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  results?: {
    analysis: {
      flags: Array<{
        start: number;
        end: number;
        reason: string;
        riskLevel: string;
      }>;
      riskLevel: string;
      summary: {
        recommendations: string[];
        description: string;
        riskLevel: string;
      };
    };
    success: boolean;
  };
  error?: string;
}
