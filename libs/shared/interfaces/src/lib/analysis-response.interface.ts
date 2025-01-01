export interface CloudFunctionResponse {
  success: boolean;
  analysis: {
    riskLevel: string;
    summary: {
      riskLevel: string;
      description: string;
      recommendations: string[];
      containsSensitiveInfo: boolean;
    };
    flags: Array<{
      start: number;
      end: number;
      reason: string;
      riskLevel: string;
    }>;
    text: string | null;
  };
}
