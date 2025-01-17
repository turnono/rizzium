export interface AgentCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  recentActivities?: AgentActivity[];
}

export interface AgentActivity {
  id: string;
  agentId: string;
  type: 'script' | 'research' | 'optimization' | 'social';
  title: string;
  description: string;
  timestamp: Date;
  status?: 'completed' | 'pending' | 'scheduled';
}
