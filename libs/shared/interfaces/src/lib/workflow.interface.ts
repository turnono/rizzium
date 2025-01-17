export interface WorkflowState {
  id: string;
  userId: string;
  currentStep: string;
  completedSteps: string[];
  context: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed' | 'failed';
  lastError?: {
    message: string;
    timestamp: Date;
    step: string;
    attempt?: number;
    nextRetry?: Date;
  };
}

export interface WorkflowTransition {
  fromStep: string;
  toStep: string;
  condition?: (context: Record<string, unknown>) => boolean;
  transform?: (context: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export interface WorkflowUpdate {
  workflowId: string;
  status?: 'active' | 'completed' | 'failed';
  currentStep?: string;
  context?: Record<string, unknown>;
}
