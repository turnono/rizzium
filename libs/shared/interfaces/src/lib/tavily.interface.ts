export interface TavilySearchParams {
  query: string;
  search_depth?: 'basic' | 'advanced';
  include_answer?: boolean;
  include_raw_content?: boolean;
  max_results?: number;
  api_key: string;
}

export interface TavilySearchResult {
  query: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
  }>;
  answer?: string;
}
