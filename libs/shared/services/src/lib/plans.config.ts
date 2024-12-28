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
    id: 'basic-monthly',
    name: 'Basic',
    tier: 'basic',
    planCode: 'PLN_o7hndsk9wcsty3t',
    price: 299,
    features: ['100 scans per month', '5GB storage', 'GPT-3.5 Turbo model', '30 days retention'],
    scanLimit: 100,
    storageLimit: 5 * 1024 * 1024 * 1024, // 5GB in bytes
    aiModel: 'gpt-3.5-turbo',
    retentionDays: 30,
    description: 'Essential document scanning and analysis',
  },
  {
    id: 'pro-monthly',
    name: 'Pro',
    tier: 'pro',
    planCode: 'PLN_gs3go6p4zvpkh7z',
    price: 599,
    features: ['500 scans per month', '20GB storage', 'GPT-4 model', '90 days retention'],
    scanLimit: 500,
    storageLimit: 20 * 1024 * 1024 * 1024, // 20GB in bytes
    aiModel: 'gpt-4',
    retentionDays: 90,
    description: 'Advanced scanning with enhanced AI capabilities',
    isPopular: true,
  },
  {
    id: 'business-monthly',
    name: 'Business',
    tier: 'business',
    planCode: 'PLN_tndzy5p758w62bb',
    price: 1499,
    features: ['2000 scans per month', '100GB storage', 'GPT-4 model', '180 days retention'],
    scanLimit: 2000,
    storageLimit: 100 * 1024 * 1024 * 1024, // 100GB in bytes
    aiModel: 'gpt-4',
    retentionDays: 180,
    description: 'Enterprise-grade document analysis solution',
  },
];
