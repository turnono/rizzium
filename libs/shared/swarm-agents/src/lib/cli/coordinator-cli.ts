import { CoordinatorAgent } from '../agents/coordinator.agent';
import { TaskPriority } from '../interfaces/agent.interface';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function promptForInput(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

async function promptForMultilineInput(prompt: string): Promise<string> {
  console.log(prompt);
  console.log('(Type END on a new line when finished)');

  let input = '';
  while (true) {
    const line = await promptForInput('');
    if (line.trim() === 'END') break;
    input += line + '\n';
  }
  return input.trim();
}

async function promptForPriority(): Promise<TaskPriority> {
  const validPriorities = Object.values(TaskPriority);
  while (true) {
    const input = (await promptForInput(`Enter priority (${validPriorities.join('/')}): `)).toLowerCase();
    if (validPriorities.includes(input as TaskPriority)) {
      return input as TaskPriority;
    }
    console.log('❌ Invalid priority. Please try again.');
  }
}

async function viewTaskStatus(coordinator: CoordinatorAgent, taskId: string) {
  const task = coordinator.getTaskById(taskId);
  if (!task) {
    console.log('\n❌ Task not found');
    return;
  }

  const assignedAgent = coordinator.getAssignedAgent(taskId);
  const allTasks = coordinator.getTasks();
  const subtasks = allTasks.filter((t) => t.dependencies?.includes(taskId));

  console.log('\n📊 Task Status:');
  console.log('ID:', task.id);
  console.log('Description:', task.description);
  console.log('Status:', task.status);
  console.log('Priority:', task.priority);
  console.log('Start Time:', task.startTime?.toLocaleString());
  console.log('Completion Time:', task.completionTime?.toLocaleString());
  console.log('Assigned Agent:', assignedAgent?.name || 'Unassigned');

  if (task.acceptanceCriteria?.length) {
    console.log('\nAcceptance Criteria:');
    task.acceptanceCriteria.forEach((criterion, index) => {
      console.log(`${index + 1}. ${criterion}`);
    });
  }

  if (subtasks.length > 0) {
    console.log('\nSubtasks:');
    subtasks.forEach((subtask, index) => {
      const subtaskAgent = coordinator.getAssignedAgent(subtask.id);
      console.log(`\n${index + 1}. ${subtask.description}`);
      console.log(`   Status: ${subtask.status}`);
      console.log(`   Agent: ${subtaskAgent?.name || 'Unassigned'}`);
      if (subtask.result?.error) {
        console.log(`   Error: ${subtask.result.error}`);
      }
    });
  }
}

async function listAllTasks(coordinator: CoordinatorAgent) {
  const tasks = coordinator.getTasks();
  if (tasks.length === 0) {
    console.log('\n📝 No tasks found');
    return;
  }

  console.log('\n📝 All Tasks:');
  tasks.forEach((task, index) => {
    const assignedAgent = coordinator.getAssignedAgent(task.id);
    console.log(`\n${index + 1}. Task ID: ${task.id}`);
    console.log(`   Description: ${task.description}`);
    console.log(`   Status: ${task.status}`);
    console.log(`   Priority: ${task.priority}`);
    console.log(`   Agent: ${assignedAgent?.name || 'Unassigned'}`);
  });
}

async function main() {
  try {
    console.log('🤖 Initializing Rizzium Coordinator...');
    const coordinator = new CoordinatorAgent();
    await coordinator.initialize();

    while (true) {
      console.log('\n📋 Available Commands:');
      console.log('1. Submit Feature Request');
      console.log('2. Submit Bug Fix');
      console.log('3. View Task Status');
      console.log('4. List All Tasks');
      console.log('5. Exit');

      const choice = await promptForInput('\nEnter command number: ');

      switch (choice) {
        case '1': {
          const description = await promptForMultilineInput('\nEnter feature description:');
          const priority = await promptForPriority();

          const task = await coordinator.submitTask(description, priority, [
            'Unit tests passing',
            'E2E tests passing',
            'Code review completed',
            'Documentation updated',
          ]);

          console.log('\n✅ Feature task submitted:', {
            id: task.id,
            priority: task.priority,
            status: task.status,
          });
          break;
        }

        case '2': {
          const description = await promptForMultilineInput('\nEnter bug description:');
          const priority = await promptForPriority();

          const task = await coordinator.submitTask(description, priority, [
            'Root cause identified',
            'Fix implemented',
            'Tests added to prevent regression',
            'Verified in development environment',
          ]);

          console.log('\n✅ Bug fix task submitted:', {
            id: task.id,
            priority: task.priority,
            status: task.status,
          });
          break;
        }

        case '3': {
          const tasks = coordinator.getTasks();
          if (tasks.length === 0) {
            console.log('\nℹ️ No tasks found. Submit a task first.');
            break;
          }

          console.log('\nAll tasks:');
          tasks.forEach((task, index) => {
            console.log(`${index + 1}. ${task.id} - ${task.description.slice(0, 50)}...`);
          });

          const taskId = await promptForInput('\nEnter task ID: ');
          await viewTaskStatus(coordinator, taskId);
          break;
        }

        case '4': {
          await listAllTasks(coordinator);
          break;
        }

        case '5':
          console.log('\n👋 Goodbye!');
          rl.close();
          process.exit(0);
          break;

        default:
          console.log('\n❌ Invalid command. Please try again.');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    rl.close();
    process.exit(1);
  }
}

// Start the CLI
main().catch(console.error);
