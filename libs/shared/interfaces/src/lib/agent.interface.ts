export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'working' | 'completed' | 'error';
  type: 'script' | 'video' | 'audio' | 'post' | 'task' | 'manager';
  progress: number;
  result?: AgentResult;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  capabilities?: string[];
  model?: string;
  instructions?: string;
}

export interface ScriptAgent extends Agent {
  type: 'script';
  input: string;
  segments: string[];
}

export interface VideoAgent extends Agent {
  type: 'video';
  scriptSegment: string;
  videoUrl?: string;
}

export interface AudioAgent extends Agent {
  type: 'audio';
  scriptSegment: string;
  audioUrl?: string;
}

export interface PostAgent extends Agent {
  type: 'post';
  videoUrl: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  postStatus: 'pending' | 'scheduled' | 'posted' | 'failed';
}
