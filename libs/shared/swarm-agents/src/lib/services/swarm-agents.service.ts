import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, query, where, orderBy, getDocs } from '@angular/fire/firestore';
import { Agent, ScriptAgent, VideoAgent, AgentResult } from '@rizzium/shared/interfaces';
import { Observable, from, map, catchError, switchMap } from 'rxjs';
import { SoraService } from '@rizzium/shared/services';

interface TaskResult {
  success: boolean;
  output: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SwarmAgentsService {
  private firestore = inject(Firestore);
  private readonly soraService = inject(SoraService);
  private readonly COLLECTION = 'agents';

  createScriptAgent(input: string): Observable<ScriptAgent> {
    const agent: ScriptAgent = {
      id: '',
      name: 'Script Segmentation Agent',
      description: 'Splits script into optimal segments for video generation',
      status: 'working',
      type: 'script',
      progress: 0,
      input,
      segments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return from(addDoc(collection(this.firestore, this.COLLECTION), agent)).pipe(
      map((docRef) => ({ ...agent, id: docRef.id })),
      catchError((error) => {
        console.error('Error creating script agent:', error);
        throw new Error('Failed to create script agent');
      })
    );
  }

  createVideoAgent(scriptSegment: string): Observable<VideoAgent> {
    const agent: VideoAgent = {
      id: '',
      name: 'Video Generation Agent',
      description: 'Generates video using Sora API',
      status: 'working',
      type: 'video',
      progress: 0,
      scriptSegment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return from(addDoc(collection(this.firestore, this.COLLECTION), agent)).pipe(
      map((docRef) => ({ ...agent, id: docRef.id })),
      catchError((error) => {
        console.error('Error creating video agent:', error);
        throw new Error('Failed to create video agent');
      })
    );
  }

  updateAgentStatus<T>(
    agentId: string,
    status: Agent['status'],
    progress: number,
    result?: AgentResult<T>
  ): Observable<void> {
    const agentRef = doc(this.firestore, this.COLLECTION, agentId);
    return from(
      updateDoc(agentRef, {
        status,
        progress,
        result,
        updatedAt: new Date(),
      })
    ).pipe(
      catchError((error) => {
        console.error('Error updating agent status:', error);
        throw new Error('Failed to update agent status');
      })
    );
  }

  getAgentsByType(type: Agent['type']): Observable<Agent[]> {
    const agentsQuery = query(
      collection(this.firestore, this.COLLECTION),
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );

    return from(getDocs(agentsQuery)).pipe(
      map((snapshot) => snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Agent))),
      catchError((error) => {
        console.error('Error getting agents:', error);
        throw new Error('Failed to get agents');
      })
    );
  }

  generateVideo(agent: VideoAgent): Observable<void> {
    return from(new Promise<void>((resolve) => setTimeout(resolve, 2000))).pipe(
      switchMap(() =>
        this.updateAgentStatus<{ videoUrl: string }>(agent.id, 'completed', 100, {
          success: true,
          data: {
            videoUrl: `https://storage.googleapis.com/rizz-social.appspot.com/mock-videos/video-${Date.now()}.mp4`,
          },
        })
      ),
      catchError((error) => {
        console.error('Error generating video:', error);
        return this.updateAgentStatus(agent.id, 'error', 0, {
          success: false,
          error: error.message,
        });
      })
    );
  }

  addAgent(agent: Partial<Agent>): Promise<Agent> {
    const newAgent: Agent = {
      id: '',
      name: agent.name || '',
      description: agent.description || '',
      status: 'idle',
      type: agent.type || 'script',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...agent,
    };

    return addDoc(collection(this.firestore, this.COLLECTION), newAgent).then((docRef) => ({
      ...newAgent,
      id: docRef.id,
    }));
  }

  async submitTask(prompt: string, capabilities: string[]): Promise<TaskResult> {
    await this.addAgent({
      name: 'Task Agent',
      description: prompt,
      type: 'task',
      capabilities,
    });

    // Mock task execution for now
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, output: `Processed: ${prompt}` };
  }
}
