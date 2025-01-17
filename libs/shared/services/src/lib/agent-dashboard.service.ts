import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  orderBy,
  limit,
  where,
  QueryConstraint,
} from '@angular/fire/firestore';
import { AgentCard, AgentActivity } from '@rizzium/shared/interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AgentDashboardService {
  private firestore = inject(Firestore);
  private readonly activityCollection = 'AgentActivities';

  readonly agents: AgentCard[] = [
    {
      id: 'research',
      name: 'Research Agent',
      description: 'Analyze market trends and gather insights',
      icon: 'analytics',
      route: '/research',
    },
    {
      id: 'script',
      name: 'Script Generator',
      description: 'Create engaging content scripts',
      icon: 'document-text',
      route: '/create',
    },
    {
      id: 'optimization',
      name: 'Content Optimization',
      description: 'Optimize content for better engagement',
      icon: 'trending-up',
      route: '/optimize',
    },
    {
      id: 'social',
      name: 'Social Media Manager',
      description: 'Schedule and manage social media content',
      icon: 'share-social',
      route: '/social-media',
    },
  ];

  getRecentActivities(agentId?: string, limit$ = 5): Observable<AgentActivity[]> {
    const activitiesRef = collection(this.firestore, this.activityCollection);
    const queryConstraints: QueryConstraint[] = [orderBy('timestamp', 'desc'), limit(limit$)];

    if (agentId) {
      queryConstraints.push(where('agentId', '==', agentId));
    }

    const q = query(activitiesRef, ...queryConstraints);
    return collectionData(q) as Observable<AgentActivity[]>;
  }

  getAgent(id: string): AgentCard | undefined {
    return this.agents.find((agent) => agent.id === id);
  }

  getAllAgents(): AgentCard[] {
    return this.agents;
  }
}
