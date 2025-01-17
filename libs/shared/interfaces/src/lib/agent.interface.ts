export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
}

export enum AgentType {
  SPECIALIST = 'specialist',
  GENERALIST = 'generalist',
  MANAGER = 'manager',
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  instructions: string;
  capabilities: AgentCapability[];
  model: string;
}

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
  | 'research'
  | 'coordination';
