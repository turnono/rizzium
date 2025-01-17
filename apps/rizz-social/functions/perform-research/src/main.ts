/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { TavilySearchParams, TavilySearchResult } from '@rizzium/shared/interfaces';

export const performResearch = onCall<TavilySearchParams, Promise<TavilySearchResult>>(async (request) => {
  try {
    const {
      query,
      search_depth = 'advanced',
      include_answer = true,
      include_raw_content = false,
      max_results = 5,
    } = request.data;
    const tavilyApiKey = process.env.TAVILY_API_KEY;

    if (!tavilyApiKey) {
      throw new Error('Tavily API key not found');
    }

    const params: TavilySearchParams = {
      query,
      search_depth,
      include_answer,
      include_raw_content,
      max_results,
      api_key: tavilyApiKey,
    };

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tavilyApiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    const result = await response.json();
    logger.info('Research completed successfully', { query });
    return result;
  } catch (error) {
    logger.error('Research failed', { error });
    throw new Error(error instanceof Error ? error.message : 'Unknown error');
  }
});
