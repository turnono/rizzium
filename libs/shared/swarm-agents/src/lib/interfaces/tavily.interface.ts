export interface TavilySearchParams {
  query: string;
  search_depth?: 'basic' | 'advanced';
  include_answer?: boolean;
  include_raw_content?: boolean;
  include_images?: boolean;
  max_results?: number;
  api_key?: string;
}

export interface TavilySearchResult {
  query: string;
  answer?: string;
  results: {
    title: string;
    url: string;
    content: string;
    score: number;
    raw_content?: string;
    images?: string[];
  }[];
}
