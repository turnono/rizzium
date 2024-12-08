import { Injectable, computed, effect, inject } from '@angular/core';
import { signal } from '@angular/core';
import { SwarmAgentsService } from './swarm-agents.service';
import { Agent, AgentStatus, TaskStatus } from '../interfaces/agent.interface';
import { SwarmMetrics } from '../interfaces/swarm.interface';

@Injectable({
  providedIn: 'root',
})
export class SwarmMonitorService {
  private swarmService = inject(SwarmAgentsService);
  private metricsHistory = signal<SwarmMetrics[]>([]);
  private updateInterval = 5000; // 5 seconds
  private startTime = Date.now();

  private metrics = signal<SwarmMetrics>({
    activeAgents: 0,
    taskCompletion: 0,
    errorRate: 0,
    responseTime: 0,
    agentUtilization: {},
    taskDistribution: {},
    averageTaskDuration: 0,
    memoryUsage: 0,
    totalTasks: 0,
    failedTasks: 0,
  });

  readonly currentMetrics = computed(() => this.metrics());

  constructor() {
    // Set up periodic metrics collection
    setInterval(() => this.collectMetrics(), this.updateInterval);

    // Track agent status changes
    effect(() => {
      const agents = this.swarmService.agents();
      this.updateAgentMetrics(agents);
    });
  }

  private updateAgentMetrics(agents: Agent[]) {
    const activeCount = agents.filter((a) => a.status === AgentStatus.BUSY).length;
    const utilization = agents.reduce((acc, agent) => {
      acc[agent.id] = agent.status === AgentStatus.BUSY ? 1 : 0;
      return acc;
    }, {} as Record<string, number>);

    this.metrics.update((m) => ({
      ...m,
      activeAgents: activeCount,
      agentUtilization: utilization,
    }));
  }

  private collectMetrics() {
    const tasks = this.swarmService.tasks();
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
    const failedTasks = tasks.filter((t) => t.status === TaskStatus.FAILED);

    this.metrics.update((m) => ({
      ...m,
      taskCompletion: completedTasks.length / Math.max(tasks.length, 1),
      errorRate: failedTasks.length / Math.max(tasks.length, 1),
      totalTasks: tasks.length,
      failedTasks: failedTasks.length,
    }));

    // Store metrics history
    this.metricsHistory.update((history) => [...history, this.metrics()]);
  }

  getMetricsHistory(): SwarmMetrics[] {
    return this.metricsHistory();
  }

  getAgentUtilization(agentId: string): number {
    return this.metrics().agentUtilization[agentId] || 0;
  }

  getSystemUptime(): number {
    return Date.now() - this.startTime;
  }
}
