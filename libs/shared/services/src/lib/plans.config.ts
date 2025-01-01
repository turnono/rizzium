import { PlanTier } from './subscription.service';

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  planCode: string;
  price: number;
  features: string[];
  scanLimit: number;
  storageLimit: number;
  aiModel: 'gpt-3.5-turbo' | 'gpt-4';
  retentionDays: number;
  description: string;
  isPopular?: boolean;
}

export const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'pro-monthly',
    name: 'Pro',
    tier: 'pro',
    planCode: 'PLN_27dwn4l33x4e8on',
    price: 150,
    features: [
      '200 scans per month',
      '5GB storage',
      'GPT-4 model',
      '30 days retention',
      'Advanced document analysis',
      'Priority support',
      'Detailed risk assessment',
      'Batch processing',
    ],
    scanLimit: 200,
    storageLimit: 5 * 1024 * 1024 * 1024, // 5GB in bytes
    aiModel: 'gpt-4',
    retentionDays: 30,
    description: 'Professional document analysis solution',
    isPopular: true,
  },
  {
    id: 'free',
    name: 'Free',
    tier: 'free',
    planCode: 'PLN_free',
    price: 0,
    features: [
      '3 scans per month',
      '100MB storage',
      'GPT-3.5 Turbo model',
      '7 days retention',
      'Basic document analysis',
      'Risk assessment',
    ],
    scanLimit: 3,
    storageLimit: 100 * 1024 * 1024, // 100MB in bytes
    aiModel: 'gpt-3.5-turbo',
    retentionDays: 7,
    description: 'Try our document analysis features',
  },
];
