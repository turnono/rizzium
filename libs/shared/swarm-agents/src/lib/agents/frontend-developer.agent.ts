import { SwarmAgentsService } from '../services/swarm-agents.service';
import { AgentType, AgentCapability, TaskDefinition, TaskResult } from '../interfaces/agent.interface';

export class FrontendDeveloperAgent {
  private agentsService: SwarmAgentsService;
  private readonly frontendCapabilities: AgentCapability[] = [
    // Keep existing capabilities...
    'code_implementation',
    'component_implementation',
    'file_system_operations',
    'angular_architecture',
    'standalone_components',
    'angular_material',
    'ionic_components',
    'ui_component_library',
    'scss_styling',
  ];

  constructor() {
    this.agentsService = new SwarmAgentsService();
  }

  async initialize() {
    const frontendAgent = await this.agentsService.addAgent({
      name: 'Frontend Developer',
      type: AgentType.WORKER,
      model: 'gpt-4', // Using GPT-4 for better code generation
      capabilities: this.frontendCapabilities,
      instructions: `You are a senior frontend developer specializing in Angular 18+ and modern web development practices.
        Your responsibilities include:

        1. Code Implementation:
           - Create and modify Angular components
           - Implement Firebase integration
           - Set up routing and navigation
           - Create and style UI components
           - Follow file system structure

        2. File System Operations:
           When implementing features, you MUST use these exact formats:

           CREATE FILE: <file_path>
           <file_content>
           END FILE

           UPDATE FILE: <file_path>
           <file_content>
           END FILE

           UPDATE ROUTE: <route_path>
           <route_content>
           END ROUTE

        3. Implementation Requirements:
           - Always implement code after analysis
           - Use standalone components
           - Follow Atomic Design principles
           - Include proper typing
           - Add error handling
           - Include complete file content
           - Add data-cy attributes for testing
           - Implement responsive design
           - Follow Angular best practices

        4. Response Format:
           Your response must include:
           1. Brief analysis
           2. Actual code implementation using file system operations
           3. Verification steps
           4. Next steps

        IMPORTANT: You must always generate actual code after analysis.`,
    });

    return frontendAgent;
  }

  async executeTask(task: TaskDefinition): Promise<TaskResult> {
    try {
      const result = await this.agentsService.executeTask({
        ...task,
        requiredCapabilities: [...task.requiredCapabilities, 'code_implementation', 'file_system_operations'],
      });

      // Validate that code was actually implemented
      if (!result.output.includes('CREATE FILE:') && !result.output.includes('UPDATE FILE:')) {
        throw new Error('No code implementation found in agent response');
      }

      return {
        success: true,
        output: result.output,
        taskId: task.id,
      };
    } catch (error) {
      console.error('Frontend Developer agent failed:', error);
      return {
        success: false,
        output: error instanceof Error ? error.message : 'Unknown error occurred',
        taskId: task.id,
      };
    }
  }
}
