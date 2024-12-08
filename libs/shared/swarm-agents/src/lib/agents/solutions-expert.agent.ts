import { SwarmAgentsService } from '../services/swarm-agents.service';
import { AgentType, AgentCapability, TaskDefinition, TaskResult } from '../interfaces/agent.interface';

export class SolutionsExpertAgent {
  private agentsService: SwarmAgentsService;
  private readonly solutionsCapabilities: AgentCapability[] = [
    // Architecture & Design
    'solution_design',
    'information_architecture',
    'design_patterns',
    'design_thinking',
    'user_flows',
    'wireframing',
    'prototyping',
    'micro_interactions',
    'interaction_design',
    'user_research',
    'usability_testing',
    'accessibility_design',

    // UX Design
    'ux_design',
    'user_flows',
    'interaction_design',
    'user_research',
    'usability_testing',
    'accessibility',

    // UI Design
    'ui_design',
    'ui_component_library',
    'wireframing',
    'prototyping',
    'micro_interactions',

    // Design Systems
    'design_systems',
    'atomic_design',
    'theme_management',
    'css_architecture',

    // Additional capabilities specific to learning platforms
    'learning_experience_design',
    'educational_content_structure',
    'progress_tracking_design',
    'assessment_design',
  ];

  constructor() {
    this.agentsService = new SwarmAgentsService();
  }

  async initialize() {
    const solutionsAgent = this.agentsService.addAgent({
      name: 'Solutions & Design Expert',
      type: AgentType.SPECIALIST,
      model: 'gpt-4',
      capabilities: this.solutionsCapabilities,
      instructions: `You are a Solutions & Design Expert responsible for creating comprehensive design solutions.
        Your responsibilities include:

        1. System & Solution Design:
           - Create system architecture diagrams
           - Design solution blueprints
           - Define information architecture
           - Implement design patterns
           - Apply design thinking methodology

        2. UX Design:
           - Create user flows and journeys
           - Design interaction patterns
           - Conduct user research
           - Plan usability testing
           - Ensure accessibility compliance

        3. UI Design:
           - Create wireframes and prototypes
           - Design visual components
           - Implement micro-interactions
           - Design animations
           - Create Figma designs`,
    });

    return solutionsAgent;
  }

  async executeTask(task: TaskDefinition): Promise<TaskResult> {
    const agent = await this.initialize();

    const designPrompt = `
    Create a comprehensive design for: ${task.description}

    DESIGN:
    1. Platform Architecture
    - Module structure and organization
    - Lesson progression and prerequisites
    - Content delivery mechanisms
    - Assessment and feedback systems
    - Progress tracking implementation
    - User roles and permissions

    2. User Experience
    - Learning pathways
    - Navigation patterns
    - Interactive elements
    - Progress visualization
    - Achievement tracking
    - Social learning features

    3. Technical Requirements
    - Data models
    - State management
    - Caching strategies
    - Performance considerations
    - Offline capabilities

    Please provide your design solution in the following format:

    DESIGN:
    <detailed design specifications>
    END DESIGN

    COMPONENTS:
    <list of required components following Atomic Design>
    END COMPONENTS

    LAYOUT:
    <responsive layout specifications>
    END LAYOUT

    USER FLOWS:
    <key user journey specifications>
    END USER FLOWS
    `;

    return await this.agentsService.executePrompt(agent, designPrompt);
  }
}
