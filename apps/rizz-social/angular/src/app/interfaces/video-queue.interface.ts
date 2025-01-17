export type VideoSegmentStatus = 'pending' | 'in-progress' | 'completed' | 'error';

export interface VideoSegment {
  segmentId: string;
  scriptText: string;
  status: VideoSegmentStatus;
  videoUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  scriptId: string;
  userId: string;
  segmentIndex: number;
}

export interface FinalVideo {
  scriptId: string;
  userId: string;
  status: 'processing' | 'completed' | 'error';
  totalSegments: number;
  completedSegments: number;
  videoUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
