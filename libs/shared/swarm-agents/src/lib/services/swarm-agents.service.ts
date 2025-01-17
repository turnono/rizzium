import { Injectable, signal } from '@angular/core';
import {
  Agent,
  AgentStatus,
  TaskDefinition,
  TaskResult,
  TaskStatus,
  AgentCapability,
} from '../interfaces/agent.interface';
import { TavilySearchParams, TavilySearchResult } from '../interfaces/tavily.interface';
import { Functions, httpsCallable } from '@angular/fire/functions';

@Injectable({
  providedIn: 'root',
})
export class SwarmAgentsService {
  private _agents = signal<Agent[]>([]);
  private _tasks = signal<TaskDefinition[]>([]);

  constructor(private functions: Functions) {}

  get agents() {
    return this._agents.asReadonly();
  }

  get tasks() {
    return this._tasks.asReadonly();
  }

  addAgent(agentConfig: Partial<Agent>): Agent {
    const newAgent: Agent = {
      id: crypto.randomUUID(),
      name: agentConfig.name || 'Unnamed Agent',
      type: agentConfig.type!,
      status: AgentStatus.IDLE,
      instructions: agentConfig.instructions || '',
      capabilities: agentConfig.capabilities || [],
      model: agentConfig.model || 'gpt-3.5-turbo',
    };

    this._agents.update((agents) => [...agents, newAgent]);
    return newAgent;
  }

  async submitTask(taskDescription: string, requiredCapabilities: AgentCapability[]): Promise<TaskResult> {
    const task: TaskDefinition = {
      id: crypto.randomUUID(),
      description: taskDescription,
      requiredCapabilities,
      status: TaskStatus.PENDING,
    };

    this._tasks.update((tasks) => [...tasks, task]);

    const agent = this.findSuitableAgent(requiredCapabilities);
    if (!agent) {
      this.updateTaskStatus(task.id, TaskStatus.FAILED);
      return { success: false, output: 'No suitable agent found for the task' };
    }

    try {
      this.updateTaskStatus(task.id, TaskStatus.IN_PROGRESS);
      this.updateAgentStatus(agent.id, AgentStatus.BUSY);

      // If the task requires research, use the research function
      if (requiredCapabilities.includes('research')) {
        const performResearch = httpsCallable<TavilySearchParams, TavilySearchResult>(
          this.functions,
          'performResearch'
        );
        const researchResult = await performResearch({ query: task.description });
        task.description = `${task.description}\n\nResearch findings:\n${JSON.stringify(researchResult.data, null, 2)}`;
      }

      // Execute the task using the execute-agent-task function
      const executeAgentTask = httpsCallable<{ agent: Agent; task: TaskDefinition }, TaskResult>(
        this.functions,
        'executeAgentTask'
      );
      const result = await executeAgentTask({ agent, task });

      this.updateTaskStatus(task.id, TaskStatus.COMPLETED, result.data);
      this.updateAgentStatus(agent.id, AgentStatus.IDLE);

      return result.data;
    } catch (error) {
      const result = { success: false, output: '', error: error instanceof Error ? error.message : 'Unknown error' };
      this.updateTaskStatus(task.id, TaskStatus.FAILED, result);
      this.updateAgentStatus(agent.id, AgentStatus.IDLE);
      return result;
    }
  }

  private findSuitableAgent(requiredCapabilities: AgentCapability[]) {
    return this._agents().find(
      (agent) =>
        agent.status === AgentStatus.IDLE && requiredCapabilities.every((cap) => agent.capabilities.includes(cap))
    );
  }

  private updateTaskStatus(taskId: string, status: TaskStatus, result?: TaskResult) {
    this._tasks.update((tasks) => tasks.map((task) => (task.id === taskId ? { ...task, status, result } : task)));
  }

  private updateAgentStatus(agentId: string, status: AgentStatus) {
    this._agents.update((agents) => agents.map((agent) => (agent.id === agentId ? { ...agent, status } : agent)));
  }
}
