import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { TaskDefinition } from '../interfaces/agent.interface';

export class StorageService {
  private readonly storageDir = '.rizzium';
  private readonly tasksFile = 'tasks.json';

  constructor() {
    this.ensureStorageExists();
  }

  private ensureStorageExists() {
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir);
    }
  }

  private getTasksFilePath(): string {
    return join(this.storageDir, this.tasksFile);
  }

  saveTasks(tasks: TaskDefinition[]): void {
    try {
      writeFileSync(this.getTasksFilePath(), JSON.stringify(tasks, null, 2));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }

  loadTasks(): TaskDefinition[] {
    try {
      if (existsSync(this.getTasksFilePath())) {
        const data = readFileSync(this.getTasksFilePath(), 'utf8');
        const tasks = JSON.parse(data);
        // Convert date strings back to Date objects
        return tasks.map((task: any) => ({
          ...task,
          startTime: task.startTime ? new Date(task.startTime) : undefined,
          completionTime: task.completionTime ? new Date(task.completionTime) : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
    return [];
  }
}
