export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  instructions: string;
  capabilities: AgentCapability[];
  currentTask?: TaskDefinition;
  model: AgentModel;
}

export interface TaskDefinition {
  id: string;
  description: string;
  requiredCapabilities: AgentCapability[];
  status: TaskStatus;
  result?: TaskResult;
}

export interface TaskResult {
  success: boolean;
  output: string;
  error?: string;
}

export enum AgentType {
  WORKER = 'worker',
  MANAGER = 'manager',
  SPECIALIST = 'specialist',
}

export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export type AgentModel = 'gpt-4' | 'gpt-3.5-turbo';

export type AgentCapability =
  | 'firebase_project_setup'
  | 'iam_role_management'
  | 'api_enablement'
  | 'github_secrets_management'
  | 'workspace_navigation'
  | 'dependency_management'
  | 'library_organization'
  | 'component_placement'
  | 'code_review'
  | 'testing'
  | 'documentation'
  | 'debugging'
  | 'optimization'
  | 'research';
