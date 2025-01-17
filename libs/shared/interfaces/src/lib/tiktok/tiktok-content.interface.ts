export interface TikTokContent {
  id?: string;
  title: string;
  description: string;
  scheduledDate: Date;
  tags: string[];
  status: 'draft' | 'scheduled' | 'published';
  metrics?: TikTokMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface TikTokMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
}

export interface TikTokContentCalendar {
  date: Date;
  contents: TikTokContent[];
}
