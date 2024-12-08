export interface SwarmMetrics {
  activeAgents: number;
  taskCompletion: number;
  errorRate: number;
  responseTime: number;
  agentUtilization: Record<string, number>;
  taskDistribution: Record<string, number>;
  averageTaskDuration: number;
  memoryUsage: number;
  totalTasks: number;
  failedTasks: number;
}

export interface SwarmMessage {
  id: string;
  from: string;
  to: string;
  content: unknown;
  timestamp: Date;
  type: 'task' | 'result' | 'error' | 'status';
  metadata?: Record<string, unknown>;
}

export interface SwarmPerformanceMetrics {
  successRate: number;
  avgResponseTime: number;
  taskTypes: Record<string, number>;
  lastUpdated: Date;
}
