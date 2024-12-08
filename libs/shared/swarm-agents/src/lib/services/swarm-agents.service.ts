import { Injectable, signal } from '@angular/core';
import {
  Agent,
  AgentType,
  AgentStatus,
  TaskDefinition,
  TaskResult,
  TaskStatus,
  AgentCapability,
  TaskPriority,
} from '../interfaces/agent.interface';
import { StorageService } from './storage.service';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { SwarmMessage } from '../interfaces/swarm.interface';
import { TaskOrchestratorService } from '../services/task-orchestrator.service';

dotenv.config();

// Simple ID generation function
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

interface ConversationContext {
  history: SwarmMessage[];
  metadata: Record<string, unknown>;
  state: 'active' | 'handoff' | 'completed';
}

interface MessageContent {
  type: 'task' | 'result' | 'error' | 'status';
  payload: unknown;
}

interface AgentMessage {
  from: string;
  to: string;
  content: MessageContent;
}

interface AgentFunction {
  name: string;
  args: unknown[];
}

@Injectable({
  providedIn: 'root',
})
export class SwarmAgentsService {
  private _agents = signal<Agent[]>([]);
  private _tasks = signal<TaskDefinition[]>([]);
  private client: OpenAI | null = null;
  private tavilyApiKey: string | undefined;
  private storageService: StorageService;
  private _messageQueue = signal<AgentMessage[]>([]);
  private _conversationContexts = signal<Map<string, ConversationContext>>(new Map());
  private _agentPerformanceHistory = signal<
    Map<
      string,
      {
        successRate: number;
        avgResponseTime: number;
        taskTypes: Record<string, number>;
      }
    >
  >(new Map());

  constructor() {
    // Try to load environment variables from .env file
    dotenv.config();

    // Try different ways to get the API keys
    const openAiKey = process.env['OPENAI_API_KEY'];
    this.tavilyApiKey = process.env['TAVILY_API_KEY'];
    this.storageService = new StorageService();

    if (!openAiKey) {
      console.warn('OpenAI API key not found. Some functionality will be limited.');
    } else {
      try {
        this.client = new OpenAI({ apiKey: openAiKey });
        console.log('OpenAI client initialized successfully');
      } catch (error) {
        console.error('Failed to initialize OpenAI client:', error);
      }
    }

    // Load saved tasks
    const savedTasks = this.storageService.loadTasks();
    if (savedTasks.length > 0) {
      this._tasks.set(savedTasks);
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
      id: generateId(),
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

  // File System Operations
  async createFile(filePath: string, content: string): Promise<boolean> {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content);
      console.log(`✅ Created file: ${filePath}`);
      return true;
    } catch (error) {
      console.error('Failed to create file:', error);
      return false;
    }
  }

  async updateFile(filePath: string, content: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated file: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update file:', error);
      return false;
    }
  }

  async readFile(filePath: string): Promise<string | null> {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
      }
      return null;
    } catch (error) {
      console.error('Failed to read file:', error);
      return null;
    }
  }

  async updateRoutes(routePath: string, newRoute: string): Promise<boolean> {
    try {
      const content = await this.readFile(routePath);
      if (!content) return false;

      // Parse routes and add new route
      const updatedContent = content.replace(
        /export const appRoutes: Route\[\] = \[/,
        `export const appRoutes: Route[] = [\n  ${newRoute},`
      );

      return await this.updateFile(routePath, updatedContent);
    } catch (error) {
      console.error('Failed to update routes:', error);
      return false;
    }
  }

  // Enhanced task execution with implementation capabilities
  async executeTask(task: TaskDefinition): Promise<TaskResult> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please check your API key.');
    }

    try {
      const isDesignTask = task.requiredCapabilities.includes('solution_design');
      const isImplementation = task.requiredCapabilities.some((cap) =>
        ['code_implementation', 'component_implementation'].includes(cap)
      );

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: isDesignTask ? this.getDesignPrompt() : this.getImplementationPrompt(task),
        },
        {
          role: 'user',
          content: task.description,
        },
      ];

      const completion = await this.client.chat.completions.create({
        model: isImplementation ? 'gpt-4' : 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      });

      const output = completion.choices[0].message.content || '';
      console.log('✅ Task execution complete:', task.id);

      // If this is an implementation task, parse the output and execute file operations
      if (isImplementation) {
        console.log('🔨 Implementing code changes...');
        await this.executeImplementation(output);
      }

      return {
        success: true,
        output,
      };
    } catch (error) {
      console.error('❌ Task execution failed:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async executeImplementation(output: string): Promise<void> {
    const lines = output.split('\n');
    let currentOp: { type: 'create' | 'update' | 'route'; path: string; content: string[] } | null = null;

    for (const line of lines) {
      if (line.startsWith('CREATE FILE:')) {
        if (currentOp) {
          await this.executeFileOperation(currentOp);
        }
        currentOp = { type: 'create', path: line.replace('CREATE FILE:', '').trim(), content: [] };
      } else if (line.startsWith('UPDATE FILE:')) {
        if (currentOp) {
          await this.executeFileOperation(currentOp);
        }
        currentOp = { type: 'update', path: line.replace('UPDATE FILE:', '').trim(), content: [] };
      } else if (line.startsWith('UPDATE ROUTE:')) {
        if (currentOp) {
          await this.executeFileOperation(currentOp);
        }
        currentOp = { type: 'route', path: line.replace('UPDATE ROUTE:', '').trim(), content: [] };
      } else if (line === 'END FILE' || line === 'END ROUTE') {
        if (currentOp) {
          await this.executeFileOperation(currentOp);
          currentOp = null;
        }
      } else if (currentOp) {
        currentOp.content.push(line);
      }
    }

    if (currentOp) {
      await this.executeFileOperation(currentOp);
    }
  }

  private async executeFileOperation(op: { type: 'create' | 'update' | 'route'; path: string; content: string[] }) {
    const content = op.content.join('\n');

    // Validate file path
    if (!this.isValidFilePath(op.path)) {
      console.error(`Invalid file path: ${op.path}`);
      return;
    }

    // Remove any markdown code block syntax
    const cleanContent = this.cleanCodeBlockSyntax(content);

    switch (op.type) {
      case 'create':
        await this.createFile(op.path, cleanContent);
        break;
      case 'update':
        await this.updateFile(op.path, cleanContent);
        break;
      case 'route':
        await this.updateRoutes(op.path, cleanContent);
        break;
    }
  }

  private isValidFilePath(path: string): boolean {
    // Only allow paths in apps/rizztrade or libs/shared/ui
    const validPaths = ['apps/rizztrade/', 'libs/shared/ui/'];

    // Don't allow image or PDF files
    const invalidExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.svg'];

    return (
      validPaths.some((validPath) => path.startsWith(validPath)) &&
      !invalidExtensions.some((ext) => path.toLowerCase().endsWith(ext))
    );
  }

  private cleanCodeBlockSyntax(content: string): string {
    // Remove markdown code block syntax
    return content
      .replace(/^```[\w-]*\n/gm, '') // Remove opening code blocks
      .replace(/\n```$/gm, '') // Remove closing code blocks
      .trim();
  }

  private requiresGPT4(task: TaskDefinition): boolean {
    const description = task.description.toLowerCase();
    const capabilities = task.requiredCapabilities;

    // Complex architectural decisions
    if (capabilities.includes('angular_architecture') || capabilities.includes('solution_design')) {
      return true;
    }

    // Complex performance optimizations
    if (
      capabilities.includes('performance_optimization') &&
      (description.includes('complex') || description.includes('critical'))
    ) {
      return true;
    }

    // Security-critical tasks
    if (capabilities.includes('security_best_practices') && description.includes('security')) {
      return true;
    }

    // Complex state management
    if (capabilities.includes('state_management') && description.includes('complex')) {
      return true;
    }

    // Default to agent's configured model
    return false;
  }

  private updateTaskStatus(taskId: string, status: TaskStatus, result?: TaskResult) {
    this._tasks.update((tasks) => {
      const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, status, result } : task));
      this.storageService.saveTasks(updatedTasks);
      return updatedTasks;
    });
  }

  private updateAgentStatus(agentId: string, status: AgentStatus) {
    this._agents.update((agents) => agents.map((agent) => (agent.id === agentId ? { ...agent, status } : agent)));
  }

  // Add message routing
  async routeMessage(fromAgent: string, toAgent: string, message: MessageContent) {
    const targetAgent = this._agents().find((a) => a.id === toAgent);
    if (!targetAgent) {
      throw new Error(`Target agent ${toAgent} not found`);
    }

    // Add message to queue
    this._messageQueue.update((queue) => [
      ...queue,
      {
        from: fromAgent,
        to: toAgent,
        content: message,
      },
    ]);
  }

  // Add function calling capability
  async invokeFunction(agent: string, functionName: string, args: unknown[]) {
    const targetAgent = this._agents().find((a) => a.id === agent);
    if (!targetAgent?.capabilities.includes(functionName as AgentCapability)) {
      throw new Error(`Function ${functionName} not available for agent ${agent}`);
    }

    return await targetAgent[functionName](...args);
  }

  async scaleAgentPool(agentType: string, count: number) {
    const currentAgents = this._agents().filter((a) => a.type === agentType);
    const delta = count - currentAgents.length;

    if (delta > 0) {
      // Scale up
      for (let i = 0; i < delta; i++) {
        await this.createAgent(agentType);
      }
    } else if (delta < 0) {
      // Scale down
      const agentsToRemove = currentAgents.slice(delta);
      await this.removeAgents(agentsToRemove.map((a) => a.id));
    }
  }

  async updateAgentPerformance(agentId: string, taskResult: TaskResult) {
    this._agentPerformanceHistory.update((history) => {
      const current = history.get(agentId) || {
        successRate: 0,
        avgResponseTime: 0,
        taskTypes: {},
      };
      return history.set(agentId, {
        ...current,
        successRate: taskResult.success ? current.successRate + 1 : current.successRate,
      });
    });
  }

  private getDesignPrompt(): string {
    return `You are a Solutions & Design Expert responsible for creating landing page designs.

    For the landing page design, provide:
    1. Wireframe description in text format
    2. Component breakdown following Atomic Design principles
    3. Layout specifications including:
       - Header section
       - Hero section
       - Feature sections
       - Call-to-action areas
       - Footer section
    4. Responsive design considerations
    5. Key UI components needed

    Format your response as:
    DESIGN:
    <detailed design specifications>
    END DESIGN

    COMPONENTS:
    <list of components needed>
    END COMPONENTS

    LAYOUT:
    <responsive layout specifications>
    END LAYOUT`;
  }

  private getImplementationPrompt(task: TaskDefinition): string {
    return `You are implementing a landing page based on the following design:
      ${task.description}

    You MUST use these exact formats for file operations:

    CREATE FILE: apps/rizztrade/angular/src/app/pages/landing/landing.page.ts
    import { Component } from '@angular/core';
    ...content...
    END FILE

    CREATE FILE: apps/rizztrade/angular/src/app/pages/landing/landing.page.html
    <div>...content...</div>
    END FILE

    Do not use markdown code blocks (\`\`\`). Instead use the exact format above.
    Do not describe the files, just create them using the format above.

    Required files:
    1. Landing page component (apps/rizztrade/angular/src/app/pages/landing/landing.page.ts)
    2. Template (apps/rizztrade/angular/src/app/pages/landing/landing.page.html)
    3. Styles (apps/rizztrade/angular/src/app/pages/landing/landing.page.scss)
    4. Any shared UI components in libs/shared/ui/

    Follow these rules:
    - Use Ionic components with Angular Material when needed
    - Implement responsive design
    - Add data-cy attributes for testing
    - Follow Angular best practices`;
  }

  async createLearningPlatformDesign() {
    const task: TaskDefinition = {
      id: 'learning-platform-design',
      description: 'learning platform design task',
      priority: TaskPriority.HIGH,
      requiredCapabilities: [
        'solution_design',
        'ux_design',
        'ui_design',
        'information_architecture',
        'user_flows',
        'wireframing',
      ],
      metadata: {
        type: 'design',
        platform: 'web',
        target: 'learning-platform',
      },
    };

    const orchestrator = new TaskOrchestratorService(this);
    const result = await orchestrator.delegateTask(task);

    if (!result) {
      throw new Error('Failed to generate learning platform design');
    }

    return result;
  }

  private async createAgent(agentType: string): Promise<Agent> {
    const newAgent: Agent = {
      id: generateId(),
      name: `${agentType}-${generateId()}`,
      type: agentType as AgentType,
      status: AgentStatus.IDLE,
      instructions: '',
      capabilities: [],
      model: 'gpt-3.5-turbo',
    };

    this._agents.update((agents) => [...agents, newAgent]);
    return newAgent;
  }

  private async removeAgents(agentIds: string[]): Promise<void> {
    this._agents.update((agents) => agents.filter((a) => !agentIds.includes(a.id)));
  }

  async executePrompt(agent: Agent, prompt: string): Promise<TaskResult> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const completion = await this.client.chat.completions.create({
      model: agent.model,
      messages: [
        { role: 'system', content: agent.instructions },
        { role: 'user', content: prompt },
      ],
    });

    return {
      success: true,
      output: completion.choices[0].message.content || '',
    };
  }
}
