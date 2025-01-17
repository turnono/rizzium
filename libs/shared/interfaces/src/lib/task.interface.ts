export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface TaskDefinition {
  id: string;
  description: string;
  requiredCapabilities: string[];
  status: TaskStatus;
  result?: TaskResult;
}

export interface TaskResult {
  success: boolean;
  output: string;
  error?: string;
}
