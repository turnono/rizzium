export interface ContentOptimizationResponse {
  caption: string;
  hashtags: string[];
  suggestions: string[];
}

export interface OptimizationRequest {
  script: string;
}
