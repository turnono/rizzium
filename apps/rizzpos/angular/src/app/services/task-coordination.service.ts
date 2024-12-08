import { Injectable } from '@angular/core';
import { CoordinatorAgent } from '@rizzium/shared/swarm-agents';
import { TaskPriority } from '@rizzium/shared/swarm-agents';

@Injectable({
  providedIn: 'root',
})
export class TaskCoordinationService {
  private coordinator: CoordinatorAgent;

  constructor() {
    this.coordinator = new CoordinatorAgent();
    this.initialize();
  }

  private async initialize() {
    await this.coordinator.initialize();
  }

  async submitFeatureRequest(description: string, priority: TaskPriority = TaskPriority.MEDIUM) {
    const acceptanceCriteria = [
      'Unit tests passing',
      'E2E tests passing',
      'Code review completed',
      'Documentation updated',
    ];

    const task = await this.coordinator.submitTask(description, priority, acceptanceCriteria);

    // Start monitoring progress
    this.monitorTaskProgress(task.id);

    return task;
  }

  async submitBugFix(description: string) {
    const acceptanceCriteria = [
      'Root cause identified',
      'Fix implemented',
      'Tests added to prevent regression',
      'Verified in development environment',
    ];

    const task = await this.coordinator.submitTask(description, TaskPriority.HIGH, acceptanceCriteria);

    this.monitorTaskProgress(task.id);

    return task;
  }

  private async monitorTaskProgress(taskId: string) {
    // Set up periodic monitoring
    const interval = setInterval(async () => {
      await this.coordinator.monitorProgress(taskId);
    }, 5000); // Check every 5 seconds

    // Clean up interval after 1 hour (adjust as needed)
    setTimeout(() => clearInterval(interval), 3600000);
  }
}
