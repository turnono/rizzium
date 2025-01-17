/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

interface TikTokTrend {
  id: string;
  title: string;
  description: string;
  viewCount: number;
  videoCount: number;
  hashtag: string;
  category: 'dance' | 'music' | 'challenge' | 'comedy' | 'lifestyle' | 'business' | 'education' | 'tech' | 'fashion';
  trending_score: number;
  examples?: string[];
  insights?: {
    audience: string;
    engagement_rate: number;
    best_posting_times: string[];
    content_tips: string[];
  };
}

// Mock data for now
const MOCK_TRENDS: TikTokTrend[] = [
  {
    id: '1',
    title: 'Business Day in the Life',
    description: 'Entrepreneurs sharing their daily routines and business insights',
    viewCount: 5000000,
    videoCount: 75000,
    hashtag: '#BusinessTikTok',
    category: 'business',
    trending_score: 98,
    examples: [
      'Morning routine + productivity tips',
      'Behind the scenes of meetings',
      'Revenue milestone celebrations',
    ],
    insights: {
      audience: 'Young entrepreneurs, business students, aspiring founders',
      engagement_rate: 8.5,
      best_posting_times: ['8:00 AM', '12:00 PM', '6:00 PM'],
      content_tips: [
        'Start with a hook showing results',
        'Include specific numbers and metrics',
        'End with actionable takeaways',
      ],
    },
  },
  {
    id: '2',
    title: 'Quick Business Tips',
    description: 'Short, actionable business advice in under 30 seconds',
    viewCount: 3000000,
    videoCount: 45000,
    hashtag: '#BusinessTips',
    category: 'business',
    trending_score: 95,
    examples: ['Social media growth hacks', 'Sales techniques', 'Customer service tips'],
    insights: {
      audience: 'Small business owners, marketers, sales professionals',
      engagement_rate: 7.2,
      best_posting_times: ['9:00 AM', '2:00 PM', '7:00 PM'],
      content_tips: ['Use text overlays for key points', 'Keep each tip under 15 seconds', 'Include real examples'],
    },
  },
  {
    id: '3',
    title: 'Business Transformation',
    description: 'Before and after success stories of business growth',
    viewCount: 4200000,
    videoCount: 28000,
    hashtag: '#BusinessGrowth',
    category: 'business',
    trending_score: 94,
    examples: ['Revenue increases', 'Store renovations', 'Team expansion stories'],
    insights: {
      audience: 'Business owners, entrepreneurs, startup founders',
      engagement_rate: 9.1,
      best_posting_times: ['10:00 AM', '3:00 PM', '8:00 PM'],
      content_tips: [
        'Show clear before/after comparisons',
        'Share specific strategies used',
        'Include emotional journey elements',
      ],
    },
  },
  {
    id: '4',
    title: 'Educational Quick Tips',
    description: 'Bite-sized learning content for business owners',
    viewCount: 2800000,
    videoCount: 35000,
    hashtag: '#LearnOnTikTok',
    category: 'education',
    trending_score: 92,
    examples: ['Marketing basics', 'Financial literacy', 'Business strategy'],
    insights: {
      audience: 'Students, professionals, lifelong learners',
      engagement_rate: 6.8,
      best_posting_times: ['11:00 AM', '4:00 PM', '9:00 PM'],
      content_tips: [
        'Use visual aids and graphics',
        'Break complex topics into steps',
        'Include real-world applications',
      ],
    },
  },
  {
    id: '5',
    title: 'Behind the Business',
    description: 'Authentic looks into business operations and challenges',
    viewCount: 3500000,
    videoCount: 42000,
    hashtag: '#SmallBusiness',
    category: 'business',
    trending_score: 93,
    examples: ['Inventory management', 'Customer interactions', 'Problem-solving moments'],
    insights: {
      audience: 'Small business owners, entrepreneurs, business students',
      engagement_rate: 8.3,
      best_posting_times: ['9:30 AM', '1:30 PM', '6:30 PM'],
      content_tips: [
        'Show authentic behind-the-scenes',
        'Share both successes and challenges',
        'Include day-in-the-life elements',
      ],
    },
  },
];

export const getTikTokTrends = onRequest({ cors: true }, async (request, response) => {
  try {
    const { category, limit = '10', minEngagementRate, includeInsights = 'true' } = request.query;
    const limitNum = parseInt(limit as string, 10);
    const minEngagement = minEngagementRate ? parseFloat(minEngagementRate as string) : 0;
    const shouldIncludeInsights = includeInsights === 'true';

    let trends = [...MOCK_TRENDS];

    // Filter by category if provided
    if (category) {
      trends = trends.filter((trend) => trend.category === category);
    }

    // Filter by minimum engagement rate if provided
    if (minEngagement > 0) {
      trends = trends.filter((trend) => (trend.insights?.engagement_rate || 0) >= minEngagement);
    }

    // Sort by trending score
    trends.sort((a, b) => b.trending_score - a.trending_score);

    // Apply limit
    if (limitNum > 0) {
      trends = trends.slice(0, limitNum);
    }

    // Remove insights if not requested
    if (!shouldIncludeInsights) {
      trends = trends.map(
        (trend) =>
          Object.fromEntries(Object.entries(trend).filter(([key]) => key !== 'insights')) as Omit<
            TikTokTrend,
            'insights'
          >
      );
    }

    logger.info('Trends fetched successfully', {
      trendCount: trends.length,
      category: category || 'all',
      limit: limitNum,
      minEngagementRate: minEngagement,
      includeInsights: shouldIncludeInsights,
    });

    response.status(200).json({
      success: true,
      trends,
      timestamp: new Date().toISOString(),
      meta: {
        total: trends.length,
        category: category || 'all',
        limit: limitNum,
        filters: {
          minEngagementRate: minEngagement,
          includeInsights: shouldIncludeInsights,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching trends', error);
    response.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});
