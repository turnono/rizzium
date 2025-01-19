import { Injectable } from '@angular/core';
import { SwarmAgentsService } from '../services/swarm-agents.service';
import { AgentType, AgentCapability } from '../interfaces/agent.interface';
import type { WorkflowState, WorkflowTransition } from '../../../../interfaces/src/lib/workflow.interface';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Firestore, collection, doc, setDoc, updateDoc, getDoc, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CoordinatorAgent {
  private readonly workflowsCollection = 'AgentWorkflows';
  private workflowTransitions: Map<string, WorkflowTransition[]> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second
  private activeSubscriptions = new Map<string, () => void>();

  constructor(private swarmAgents: SwarmAgentsService, private functions: Functions, private firestore: Firestore) {
    this.initializeAgent();
    this.setupWorkflowTransitions();
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    context: Record<string, unknown>
  ): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed: ${errorMessage}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Update workflow state to indicate retry
        if (context['workflowId']) {
          await this.updateWorkflowError(context['workflowId'] as string, {
            message: errorMessage,
            attempt: attempt + 1,
            nextRetry: new Date(Date.now() + delay),
          });
        }
      }
    }
    throw lastError || new Error(`Failed after ${this.MAX_RETRIES} attempts: ${errorMessage}`);
  }

  private async updateWorkflowError(workflowId: string, error: { message: string; attempt: number; nextRetry: Date }) {
    const workflowRef = doc(collection(this.firestore, this.workflowsCollection), workflowId);
    await updateDoc(workflowRef, {
      lastError: error,
      updatedAt: new Date(),
    });
  }

  private async initializeAgent() {
    return this.swarmAgents.addAgent({
      name: 'Workflow Coordinator',
      type: AgentType.MANAGER,
      model: 'gpt-4',
      capabilities: ['coordination' as AgentCapability],
      instructions: `You are a workflow coordinator responsible for:
        1. Managing the flow between specialized AI agents
        2. Maintaining context and state across agent interactions
        3. Ensuring smooth transitions and data handoffs
        4. Providing guidance and next steps to users
        5. Handling errors and providing fallback options`,
    });
  }

  private setupWorkflowTransitions() {
    // Define the standard content creation workflow
    this.workflowTransitions.set('content_creation', [
      {
        fromStep: 'start',
        toStep: 'research',
        transform: async (context) => {
          const topic = context['topic'] as string;
          const result = await this.swarmAgents.submitTask(
            `Research trending topics and insights related to: ${topic}`,
            ['research']
          );
          return { ...context, researchResults: result.output };
        },
      },
      {
        fromStep: 'research',
        toStep: 'ideation',
        condition: (context) => Boolean(context['researchResults']),
        transform: async (context) => {
          const result = await this.swarmAgents.submitTask(
            `Generate content ideas based on research: ${context['researchResults']}`,
            ['optimization']
          );
          return { ...context, contentIdeas: result.output };
        },
      },
      {
        fromStep: 'ideation',
        toStep: 'script',
        condition: (context) => Boolean(context['contentIdeas']),
        transform: async (context) => {
          const selectedIdea = (context['selectedIdea'] as string) || (context['contentIdeas'] as string);
          const scriptAgent = await firstValueFrom(
            this.swarmAgents.createScriptAgent(`Create a detailed TikTok script for: ${selectedIdea}`)
          );
          return { ...context, script: scriptAgent.input };
        },
      },
      {
        fromStep: 'script',
        toStep: 'optimization',
        condition: (context) => Boolean(context['script']),
        transform: async (context) => {
          const result = await this.swarmAgents.submitTask(
            `Optimize the following TikTok script for maximum engagement: ${context['script']}`,
            ['optimization']
          );
          return { ...context, optimizedContent: result.output };
        },
      },
      {
        fromStep: 'optimization',
        toStep: 'scheduling',
        condition: (context) => Boolean(context['optimizedContent']),
        transform: async (context) => {
          // Call the social media scheduling function
          const scheduleContent = httpsCallable<{ content: unknown }, { success: boolean }>(
            this.functions,
            'scheduleContent'
          );
          const result = await scheduleContent({
            content: context['optimizedContent'] as unknown as Record<string, unknown>,
          });
          return { ...context, scheduled: result.data.success };
        },
      },
    ]);

    // Add more workflow types here as needed
  }

  async startWorkflow(userId: string, workflowType: string, initialContext: Record<string, unknown>): Promise<string> {
    const workflowState: WorkflowState = {
      id: crypto.randomUUID(),
      userId,
      currentStep: 'start',
      completedSteps: [],
      context: initialContext,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    };

    const workflowRef = doc(collection(this.firestore, this.workflowsCollection), workflowState.id);
    await setDoc(workflowRef, workflowState);

    return workflowState.id;
  }

  async progressWorkflow(workflowId: string): Promise<WorkflowState> {
    const workflowRef = doc(collection(this.firestore, this.workflowsCollection), workflowId);

    return this.retryWithBackoff(
      async () => {
        const workflowDoc = await getDoc(workflowRef);
        if (!workflowDoc.exists()) {
          throw new Error('Workflow not found');
        }

        const workflowState = workflowDoc.data() as WorkflowState;
        const transitions = this.workflowTransitions.get('content_creation') || [];
        const currentTransition = transitions.find((t) => t.fromStep === workflowState.currentStep);

        if (!currentTransition) {
          workflowState.status = 'completed';
          await updateDoc(workflowRef, { ...workflowState });
          return workflowState;
        }

        if (currentTransition.condition && !currentTransition.condition(workflowState.context)) {
          throw new Error(`Condition not met for transition from ${currentTransition.fromStep}`);
        }

        try {
          if (currentTransition.transform) {
            workflowState.context = await this.retryWithBackoff(
              () => currentTransition.transform!(workflowState.context),
              `Failed to execute transform for step ${currentTransition.fromStep}`,
              { workflowId }
            );
          }

          workflowState.completedSteps.push(workflowState.currentStep);
          workflowState.currentStep = currentTransition.toStep;
          workflowState.updatedAt = new Date();
          workflowState.lastError = null; // Clear any previous errors

          await updateDoc(workflowRef, { ...workflowState });
          return workflowState;
        } catch (error) {
          workflowState.status = 'failed';
          workflowState.lastError = {
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date(),
            step: currentTransition.fromStep,
          };
          await updateDoc(workflowRef, { ...workflowState });
          throw error;
        }
      },
      'Failed to progress workflow',
      { workflowId }
    );
  }

  async getWorkflowState(workflowId: string): Promise<WorkflowState> {
    const workflowRef = doc(collection(this.firestore, this.workflowsCollection), workflowId);
    const workflowDoc = await getDoc(workflowRef);

    if (!workflowDoc.exists()) {
      throw new Error('Workflow not found');
    }

    return workflowDoc.data() as WorkflowState;
  }

  watchWorkflowState(workflowId: string): Observable<WorkflowState> {
    return new Observable<WorkflowState>((subscriber) => {
      const workflowRef = doc(collection(this.firestore, this.workflowsCollection), workflowId);

      // Unsubscribe from any existing subscription for this workflow
      this.unsubscribeFromWorkflow(workflowId);

      // Create new subscription
      const unsubscribe = onSnapshot(
        workflowRef,
        (snapshot) => {
          if (snapshot.exists()) {
            subscriber.next(snapshot.data() as WorkflowState);
          } else {
            subscriber.error(new Error('Workflow not found'));
          }
        },
        (error) => {
          subscriber.error(error);
        }
      );

      // Store the unsubscribe function
      this.activeSubscriptions.set(workflowId, unsubscribe);

      // Return cleanup function
      return () => {
        this.unsubscribeFromWorkflow(workflowId);
      };
    });
  }

  private unsubscribeFromWorkflow(workflowId: string) {
    const unsubscribe = this.activeSubscriptions.get(workflowId);
    if (unsubscribe) {
      unsubscribe();
      this.activeSubscriptions.delete(workflowId);
    }
  }

  // Clean up subscriptions when the service is destroyed
  ngOnDestroy() {
    Array.from(this.activeSubscriptions.keys()).forEach((workflowId) => {
      this.unsubscribeFromWorkflow(workflowId);
    });
  }
}
