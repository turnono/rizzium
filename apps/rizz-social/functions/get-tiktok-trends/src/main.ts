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
  category: 'dance' | 'music' | 'challenge' | 'comedy' | 'lifestyle' | 'business' | 'education';
  trending_score: number;
  examples?: string[];
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
  },
];

export const getTikTokTrends = onRequest({ cors: true }, async (request, response) => {
  try {
    const { category, limit = '10' } = request.query;
    const limitNum = parseInt(limit as string, 10);

    let trends = [...MOCK_TRENDS];

    // Filter by category if provided
    if (category) {
      trends = trends.filter((trend) => trend.category === category);
    }

    // Sort by trending score
    trends.sort((a, b) => b.trending_score - a.trending_score);

    // Apply limit
    if (limitNum > 0) {
      trends = trends.slice(0, limitNum);
    }

    logger.info('Trends fetched successfully', {
      trendCount: trends.length,
      category: category || 'all',
      limit: limitNum,
    });

    response.status(200).json({
      success: true,
      trends,
      timestamp: new Date().toISOString(),
      meta: {
        total: trends.length,
        category: category || 'all',
        limit: limitNum,
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
