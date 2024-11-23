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
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable({
  providedIn: 'root',
})
export class SwarmAgentsService {
  private _agents = signal<Agent[]>([]);
  private _tasks = signal<TaskDefinition[]>([]);
  private client: OpenAI | null = null;
  private tavilyApiKey: string | undefined;

  constructor() {
    const openAiKey = process.env['OPENAI_API_KEY'];
    this.tavilyApiKey = process.env['TAVILY_API_KEY'];

    if (openAiKey) {
      this.client = new OpenAI({ apiKey: openAiKey });
    }
  }

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

      // If the task requires research, use Tavily first
      if (requiredCapabilities.includes('research')) {
        const researchResult = await this.performResearch(task.description);
        task.description = `${task.description}\n\nResearch findings:\n${JSON.stringify(researchResult, null, 2)}`;
      }

      const result = await this.executeTask(agent, task);

      this.updateTaskStatus(task.id, TaskStatus.COMPLETED, result);
      this.updateAgentStatus(agent.id, AgentStatus.IDLE);

      return result;
    } catch (error) {
      const result = { success: false, output: '', error: error instanceof Error ? error.message : 'Unknown error' };
      this.updateTaskStatus(task.id, TaskStatus.FAILED, result);
      this.updateAgentStatus(agent.id, AgentStatus.IDLE);
      return result;
    }
  }

  private async performResearch(query: string): Promise<TavilySearchResult> {
    if (!this.tavilyApiKey) {
      throw new Error('Tavily API key not found. Please check your environment variables.');
    }

    const params: TavilySearchParams = {
      query,
      search_depth: 'advanced',
      include_answer: true,
      include_raw_content: false,
      max_results: 5,
      api_key: this.tavilyApiKey,
    };

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.tavilyApiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    return response.json();
  }

  private findSuitableAgent(requiredCapabilities: AgentCapability[]) {
    return this._agents().find(
      (agent) =>
        agent.status === AgentStatus.IDLE && requiredCapabilities.every((cap) => agent.capabilities.includes(cap))
    );
  }

  private async executeTask(agent: Agent, task: TaskDefinition): Promise<TaskResult> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please check your API key.');
    }

    const completion = await this.client.chat.completions.create({
      model: agent.model,
      messages: [
        { role: 'system', content: agent.instructions },
        { role: 'user', content: task.description },
      ],
    });

    return {
      success: true,
      output: completion.choices[0].message.content || '',
    };
  }

  private updateTaskStatus(taskId: string, status: TaskStatus, result?: TaskResult) {
    this._tasks.update((tasks) => tasks.map((task) => (task.id === taskId ? { ...task, status, result } : task)));
  }

  private updateAgentStatus(agentId: string, status: AgentStatus) {
    this._agents.update((agents) => agents.map((agent) => (agent.id === agentId ? { ...agent, status } : agent)));
  }
}
