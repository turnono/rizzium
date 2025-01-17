export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
}

export enum AgentType {
  SPECIALIST = 'specialist',
  GENERALIST = 'generalist',
}

export type AgentCapability = 'research' | 'firebase_project_setup' | 'iam_role_management';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  instructions: string;
  capabilities: AgentCapability[];
  model: string;
}
