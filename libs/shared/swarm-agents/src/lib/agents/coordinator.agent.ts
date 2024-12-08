import { SwarmAgentsService } from '../services/swarm-agents.service';
import { AgentType, TaskPriority, TaskStatus, TaskDefinition, AgentCapability } from '../interfaces/agent.interface';
import { StorageService } from '../services/storage.service';

// Simple ID generation function
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export class CoordinatorAgent {
  private agentsService: SwarmAgentsService;
  private storageService: StorageService;
  private readonly coordinatorCapabilities: AgentCapability[] = [
    'task_management',
    'task_delegation',
    'progress_tracking',
    'stakeholder_communication',
    'quality_assurance',
    'research',
  ];

  constructor() {
    this.agentsService = new SwarmAgentsService();
    this.storageService = new StorageService();
  }

  async initialize() {
    // Initialize coordinator (keeps GPT-4 as it needs to make complex decisions)
    const coordinator = this.agentsService.addAgent({
      name: 'Rizzium Coordinator',
      type: AgentType.COORDINATOR,
      model: 'gpt-4',
      capabilities: this.coordinatorCapabilities,
      instructions: `You are the Rizzium Coordinator AI Agent responsible for:
        1. Task Management: Monitor and prioritize tasks
        2. Delegation: Assign tasks to specialized agents
        3. Progress Tracking: Monitor task status and handle handoffs
        4. Communication: Update stakeholders on progress
        5. Quality Assurance: Verify task completion against criteria`,
    });

    // Initialize worker agents
    this.agentsService.addAgent({
      name: 'Frontend Developer',
      type: AgentType.WORKER,
      model: 'gpt-4',
      capabilities: [
        // Implementation
        'code_implementation',
        'file_system_operations',
        'route_management',
        'component_implementation',
        'firebase_implementation',
        'style_implementation',

        // Angular Core
        'angular_architecture',
        'angular_signals',
        'standalone_components',
        'dependency_injection',
        'change_detection',
        'angular_routing',
        'guards_interceptors',
        'angular_forms',
        'angular_animations',
        'angular_schematics',
        'angular_testing',
        'angular_pwa',

        // State & Data Management
        'state_management',
        'rxjs_observables',
        'ngrx_signals',
        'data_persistence',
        'caching_strategies',

        // UI Frameworks & Design
        'angular_material',
        'ionic_components',
        'ui_component_library',
        'scss_styling',
        'responsive_design',
        'accessibility',
        'atomic_design',
        'design_systems',
        'css_architecture',
        'theme_management',
        'i18n_l10n',

        // Development Tools & Documentation
        'storybook_development',
        'component_placement',
        'code_review',
        'documentation',

        // Performance & Optimization
        'performance_optimization',
        'bundle_optimization',
        'lazy_loading',
        'web_vitals',
        'memory_management',
        'angular_upgrades',

        // Monorepo & Architecture
        'nx_workspace',
        'library_architecture',
        'module_federation',
        'shared_libraries',
        'dependency_graph',
        'project_structure',

        // Testing
        'unit_testing',
        'e2e_testing',
        'cypress_testing',
        'jest_testing',
        'test_coverage',
        'performance_testing',

        // DevOps & Deployment
        'github_actions',
        'deployment_strategies',
        'environment_management',
        'build_optimization',

        // Security & Best Practices
        'security_best_practices',
        'error_handling',
        'logging_monitoring',
      ],
      instructions: `You are a senior frontend developer specializing in Angular 18+ and modern web development practices.
        Your responsibilities include:
        1. Code Implementation:
           - Create and modify Angular components
           - Implement Firebase integration
           - Set up routing and navigation
           - Create and style UI components
           - Follow file system structure
        2. Implementing features using Angular's latest standards:
           - Standalone Components and Signals
           - Dependency Injection and Change Detection optimization
           - Routing, Guards, and Interceptors
           - Forms and Animations
        3. State Management and Data Flow:
           - Signal-based state management
           - RxJS and Observable patterns
           - Data persistence and caching strategies
        4. UI Development and Design Systems:
           - Building reusable components following Atomic Design
           - Implementing responsive and accessible designs
           - Managing themes and internationalization
           - Creating Storybook documentation
        5. Performance and Optimization:
           - Bundle size optimization
           - Lazy loading implementation
           - Memory management
           - Web Vitals optimization
        6. Monorepo Architecture:
           - Nx workspace management
           - Library architecture
           - Module federation
           - Dependency management
        7. Testing and Quality:
           - Unit testing with Jest
           - E2E testing with Cypress
           - Performance testing
           - Test coverage maintenance
        8. DevOps and Deployment:
           - GitHub Actions workflows
           - Build optimization
           - Environment management
        9. Security and Best Practices:
           - Following Angular security best practices
           - Implementing proper error handling
           - Setting up logging and monitoring`,
    });

    this.agentsService.addAgent({
      name: 'Firebase Specialist',
      type: AgentType.SPECIALIST,
      model: 'gpt-3.5-turbo',
      capabilities: [
        // Firebase Core Services
        'firebase_project_setup',
        'firebase_hosting',
        'firebase_authentication',
        'firestore_database',
        'realtime_database',
        'cloud_storage',
        'cloud_functions',
        'cloud_messaging',

        // Security & Rules
        'iam_role_management',
        'security_rules',
        'authentication_flows',
        'authorization_strategies',
        'data_validation',

        // Performance & Optimization
        'database_optimization',
        'query_optimization',
        'caching_strategies',
        'offline_persistence',
        'performance_monitoring',

        // Infrastructure & DevOps
        'api_enablement',
        'environment_management',
        'ci_cd_pipelines',
        'github_actions',
        'deployment_strategies',

        // Development & Integration
        'firebase_emulators',
        'firebase_sdk_integration',
        'debugging',
        'error_handling',
        'logging_monitoring',

        // Data Management
        'data_modeling',
        'data_migration',
        'backup_recovery',
        'data_indexing',
        'data_security',

        // Testing
        'firebase_testing',
        'security_rules_testing',
        'function_testing',
        'integration_testing',

        // Cost & Resource Management
        'resource_optimization',
        'cost_monitoring',
        'quota_management',
        'scaling_strategies',
      ],
      instructions: `You are a Firebase/Cloud specialist responsible for backend infrastructure and security.
        Your responsibilities include:

        1. Firebase Project Setup & Management:
           - Project initialization and configuration
           - Service enablement and API setup
           - Environment management (dev/staging/prod)
           - Resource optimization and cost monitoring

        2. Security & Authentication:
           - IAM role configuration
           - Security rules implementation
           - Authentication flows setup
           - Authorization strategies
           - Data access control

        3. Database & Storage:
           - Data modeling and schema design
           - Query optimization
           - Indexing strategies
           - Backup and recovery procedures
           - Migration planning

        4. Cloud Functions:
           - Serverless function development
           - Event-driven architectures
           - Function optimization
           - Error handling and monitoring
           - Cold start optimization

        5. Performance & Optimization:
           - Database query optimization
           - Caching implementation
           - Offline persistence setup
           - Performance monitoring
           - Resource usage optimization

        6. DevOps & CI/CD:
           - GitHub Actions setup
           - Deployment automation
           - Environment configuration
           - Emulator setup
           - Testing infrastructure

        7. Monitoring & Maintenance:
           - Logging implementation
           - Performance monitoring
           - Cost tracking
           - Quota management
           - Scaling strategies

        8. Integration & Testing:
           - SDK integration support
           - Security rules testing
           - Function testing
           - Integration testing
           - Load testing`,
    });

    this.agentsService.addAgent({
      name: 'Solutions & Design Expert',
      type: AgentType.SPECIALIST,
      model: 'gpt-4',
      capabilities: [
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

        // Responsive & Mobile
        'responsive_design',
        'mobile_first_design',
        'responsive_design',

        // Integration & Standards
        'atomic_design',
        'theme_management',
        'i18n_l10n',
        'accessibility',

        // Documentation & Collaboration
        'documentation',
        'stakeholder_communication',
      ],
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
           - Create Figma designs

        4. Design Systems:
           - Develop comprehensive design systems
           - Define design tokens
           - Plan atomic design structure
           - Create design documentation
           - Manage design handoff process

        5. Responsive Design:
           - Implement mobile-first approach
           - Define responsive patterns
           - Create adaptive layouts
           - Design for multiple devices
           - Ensure consistent experience

        6. Standards & Guidelines:
           - Maintain design consistency
           - Implement accessibility standards
           - Support internationalization
           - Define theme management
           - Document design guidelines

        7. Collaboration:
           - Work with frontend developers
           - Guide implementation
           - Review design adherence
           - Communicate with stakeholders
           - Maintain design documentation

        8. Quality & Innovation:
           - Ensure design quality
           - Research new trends
           - Propose improvements
           - Monitor implementation
           - Gather feedback`,
    });

    this.agentsService.addAgent({
      name: 'QA Engineer',
      type: AgentType.WORKER,
      model: 'gpt-3.5-turbo',
      capabilities: [
        // Code Quality & Review
        'code_review',
        'coding_standards',
        'typescript_standards',
        'angular_standards',
        'security_best_practices',
        'error_handling',

        // Angular-Specific Testing
        'angular_testing',
        'unit_testing',
        'e2e_testing',
        'integration_testing',

        // UI/UX Testing
        'accessibility',
        'responsive_design',
        'usability_testing',
        'i18n_l10n',

        // Documentation & Standards
        'documentation',
        'coding_standards',
        'typescript_standards',
        'angular_standards',
        'firebase_standards',

        // Quality Processes
        'quality_assurance',
        'debugging',
        'logging_monitoring',
        'testing',
      ],
      instructions: `You are a senior QA engineer specializing in code quality and testing.
        Your responsibilities include:

        1. Code Review:
           - Review code against established standards
           - Verify TypeScript/Angular best practices
           - Check for security vulnerabilities
           - Ensure proper error handling
           - Validate performance considerations
           - Review test coverage and quality

        2. Testing Strategy:
           - Define comprehensive test plans
           - Implement automated testing
           - Verify component integration
           - Validate business logic
           - Test error scenarios
           - Monitor test coverage

        3. Quality Standards:
           - Enforce coding standards
           - Verify documentation quality
           - Check accessibility compliance
           - Review internationalization
           - Validate responsive design
           - Ensure security best practices

        4. Performance & Security:
           - Review performance metrics
           - Check security implementations
           - Validate error handling
           - Test edge cases
           - Monitor resource usage
           - Verify data protection

        5. Documentation Review:
           - Verify API documentation
           - Review code comments
           - Check test documentation
           - Validate user guides
           - Review architecture docs
           - Ensure maintenance guides

        6. Process Enforcement:
           - Monitor pull request quality
           - Enforce review guidelines
           - Track issue resolution
           - Maintain quality metrics
           - Report on code health
           - Guide improvements`,
    });

    // Add DevOps & Infrastructure Specialist
    this.agentsService.addAgent({
      name: 'DevOps & Infrastructure Specialist',
      type: AgentType.SPECIALIST,
      model: 'gpt-3.5-turbo',
      capabilities: [
        // CI/CD & Automation
        'github_actions',
        'deployment_strategies',
        'ci_cd_pipelines',
        'release_management',
        'environment_management',

        // Infrastructure Management
        'cloud_infrastructure',
        'containerization',
        'kubernetes_deployment',
        'docker_configuration',
        'infrastructure_as_code',

        // Monitoring & Observability
        'logging_monitoring',
        'performance_monitoring',
        'error_tracking',
        'analytics_integration',
        'alerting_systems',

        // Security & Compliance
        'security_scanning',
        'vulnerability_assessment',
        'compliance_monitoring',
        'secret_management',
        'access_control',

        // Optimization
        'build_optimization',
        'deployment_optimization',
        'resource_optimization',
        'cost_optimization',
        'cache_optimization',
      ],
      instructions: `You are a DevOps & Infrastructure specialist responsible for deployment and infrastructure.
        Your responsibilities include:
        1. CI/CD Pipeline Management:
           - Configure and maintain GitHub Actions
           - Optimize build and deployment processes
           - Manage release strategies
           - Handle environment configurations

        2. Infrastructure Management:
           - Set up cloud infrastructure
           - Configure containerization
           - Manage Kubernetes deployments
           - Implement infrastructure as code

        3. Monitoring & Observability:
           - Set up logging and monitoring
           - Configure alerting systems
           - Implement analytics tracking
           - Monitor system health

        4. Security & Compliance:
           - Implement security scanning
           - Manage secrets and access control
           - Monitor compliance requirements
           - Handle vulnerability assessments

        5. Optimization & Performance:
           - Optimize build processes
           - Manage resource utilization
           - Implement caching strategies
           - Monitor and reduce costs`,
    });

    // Add Technical Documentation Specialist
    this.agentsService.addAgent({
      name: 'Technical Documentation Specialist',
      type: AgentType.SPECIALIST,
      model: 'gpt-3.5-turbo',
      capabilities: [
        // Documentation Types
        'api_documentation',
        'technical_writing',
        'system_documentation',
        'architecture_documentation',

        // Documentation Tools
        'markdown_documentation',
        'swagger_documentation',
        'jsdoc_documentation',
        'compodoc_documentation',

        // Process Documentation
        'workflow_documentation',
        'deployment_documentation',
        'setup_guides',
        'troubleshooting_guides',
        'maintenance_guides',

        // Standards & Best Practices
        'documentation_standards',
        'documentation_review',
        'coding_standards',
        'typescript_standards',
        'angular_standards',
      ],
      instructions: `You are a Technical Documentation specialist responsible for comprehensive documentation.
        Your responsibilities include:
        1. API & System Documentation:
           - Create API documentation
           - Document system architecture
           - Maintain technical specifications
           - Create integration guides

        2. Process Documentation:
           - Write setup guides
           - Create troubleshooting guides
           - Document workflows
           - Maintain deployment guides

        3. Code Documentation:
           - Review code comments
           - Maintain JSDoc documentation
           - Create TypeScript documentation
           - Document Angular components

        4. Standards & Guidelines:
           - Enforce documentation standards
           - Review documentation quality
           - Maintain style guides
           - Update documentation templates`,
    });

    // Add Performance & Optimization Specialist
    this.agentsService.addAgent({
      name: 'Performance & Optimization Specialist',
      type: AgentType.SPECIALIST,
      model: 'gpt-4',
      capabilities: [
        // Frontend Performance
        'runtime_performance',
        'code_splitting',
        'lazy_loading',
        'web_vitals',
        'perceived_performance',

        // Backend Performance
        'server_optimization',
        'function_optimization',
        'database_optimization',
        'query_optimization',

        // Resource Optimization
        'cpu_optimization',
        'memory_management',
        'network_optimization',
        'storage_optimization',

        // Analysis & Monitoring
        'performance_profiling',
        'bottleneck_analysis',
        'metrics_analysis',
        'performance_testing',

        // User Experience
        'loading_strategies',
        'offline_capabilities',
        'progressive_enhancement',
        'responsive_optimization',
      ],
      instructions: `You are a Performance & Optimization specialist responsible for system performance.
        Your responsibilities include:
        1. Frontend Optimization:
           - Optimize bundle sizes
           - Implement code splitting
           - Optimize loading strategies
           - Monitor Web Vitals

        2. Backend Optimization:
           - Optimize server performance
           - Tune database queries
           - Optimize cloud functions
           - Manage caching strategies

        3. Resource Management:
           - Monitor resource usage
           - Optimize memory usage
           - Improve network efficiency
           - Optimize storage usage

        4. Analysis & Testing:
           - Profile performance
           - Identify bottlenecks
           - Conduct load testing
           - Monitor metrics

        5. User Experience:
           - Improve perceived performance
           - Implement offline capabilities
           - Optimize responsiveness
           - Enhance progressive loading`,
    });

    return coordinator;
  }

  async submitTask(
    taskDescription: string,
    priority: TaskPriority = TaskPriority.MEDIUM,
    acceptanceCriteria?: string[]
  ): Promise<TaskDefinition> {
    console.log('📋 Analyzing task requirements...');
    const requiredCapabilities = await this.analyzeTaskRequirements(taskDescription);

    // Create main task
    const mainTask: TaskDefinition = {
      id: generateId(),
      description: taskDescription,
      status: TaskStatus.PENDING,
      priority,
      acceptanceCriteria,
      startTime: new Date(),
      requiredCapabilities,
    };

    // Save the main task
    const tasks = this.storageService.loadTasks();
    this.storageService.saveTasks([...tasks, mainTask]);
    console.log('✅ Main task created:', mainTask.id);

    // Get task execution plan from GPT-4
    const planResult = await this.agentsService.executeTask({
      id: generateId(),
      description: `Analyze this task and create a detailed execution plan:
      Task: ${taskDescription}
      Required Capabilities: ${requiredCapabilities.join(', ')}

      IMPORTANT: Provide your response in plain text only, without any markdown formatting or code blocks.

      Include in your response:
      1. Task breakdown into phases
      2. Required capabilities for each phase
      3. Dependencies between phases
      4. Estimated complexity
      5. Potential challenges
      6. Success criteria`,
      requiredCapabilities: ['task_management', 'solution_design'],
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      startTime: new Date(),
    });

    if (!planResult.success) {
      console.error('❌ Failed to create execution plan:', planResult.error);
      return mainTask;
    }

    console.log('📋 Execution plan created');
    const executionPlan = planResult.output;

    // Parse the execution plan and create phases
    const phases = await this.createPhasesFromPlan(executionPlan);
    console.log('🔄 Creating task phases...');

    // Create and process subtasks for each phase
    for (const phase of phases) {
      const subtask: TaskDefinition = {
        id: generateId(),
        description: `${phase.name} for: ${mainTask.description}\n\nContext:\n${phase.context}`,
        requiredCapabilities: phase.capabilities,
        status: TaskStatus.PENDING,
        priority: mainTask.priority,
        dependencies: [mainTask.id, ...(phase.dependencies || [])],
        acceptanceCriteria: phase.acceptanceCriteria,
        startTime: new Date(),
      };

      // Find suitable agent for this phase
      const agent = this.agentsService.agents().find((a) => {
        // Agent must be idle
        if (a.status !== 'idle') return false;

        // Agent must have at least one of the required capabilities
        const hasRequiredCapability = phase.capabilities.some((cap) => a.capabilities.includes(cap));

        return hasRequiredCapability;
      });

      if (agent) {
        console.log(`✅ Found agent ${agent.name} for phase ${phase.name}`);
        subtask.assignedAgentId = agent.id;
      } else {
        console.log(`⚠️ No suitable agent found for phase ${phase.name}`);
      }

      // Save the subtask
      const currentTasks = this.storageService.loadTasks();
      this.storageService.saveTasks([...currentTasks, subtask]);
      console.log(`✅ Created subtask for ${phase.name}:`, subtask.id);

      // Submit to agent if one was found
      if (subtask.assignedAgentId) {
        try {
          const result = await this.agentsService.executeTask(subtask);
          console.log(`✅ Completed ${phase.name}:`, result.output);

          // Update task status
          subtask.status = result.success ? TaskStatus.COMPLETED : TaskStatus.FAILED;
          subtask.result = result;
          subtask.completionTime = new Date();

          // Save updated task
          const tasks = this.storageService.loadTasks();
          this.storageService.saveTasks(tasks.map((t) => (t.id === subtask.id ? subtask : t)));

          // If phase failed, stop processing
          if (!result.success) {
            console.error(`❌ Phase ${phase.name} failed:`, result.error);
            break;
          }
        } catch (error) {
          console.error(`❌ Failed to execute ${phase.name}:`, error);
          subtask.status = TaskStatus.FAILED;
          subtask.result = {
            success: false,
            output: '',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          const tasks = this.storageService.loadTasks();
          this.storageService.saveTasks(tasks.map((t) => (t.id === subtask.id ? subtask : t)));
          break;
        }
      }
    }

    console.log('✅ Task submission complete');
    return mainTask;
  }

  private async createPhasesFromPlan(executionPlan: string): Promise<
    Array<{
      name: string;
      capabilities: AgentCapability[];
      dependencies?: string[];
      context: string;
      acceptanceCriteria: string[];
    }>
  > {
    // Return fixed phases with customized descriptions based on the task
    return [
      {
        name: 'Planning & Design',
        capabilities: ['solution_design', 'ux_design', 'ui_design', 'user_flows', 'wireframing'] as AgentCapability[],
        context: `Design phase for: ${executionPlan}`,
        acceptanceCriteria: [
          'Design documents created',
          'Architecture approved',
          'User flows documented',
          'Component structure defined',
        ],
      },
      {
        name: 'Frontend Development',
        capabilities: [
          'angular_architecture',
          'standalone_components',
          'ui_component_library',
          'angular_material',
          'ionic_components',
        ] as AgentCapability[],
        context: `Frontend implementation for: ${executionPlan}`,
        acceptanceCriteria: ['Components implemented', 'Tests passing', 'Styles applied', 'Responsive design verified'],
      },
      {
        name: 'Backend Integration',
        capabilities: ['firebase_project_setup', 'firebase_hosting', 'firestore_database'] as AgentCapability[],
        context: `Backend integration for: ${executionPlan}`,
        acceptanceCriteria: [
          'Firebase configured',
          'Data models implemented',
          'Security rules defined',
          'API endpoints tested',
        ],
      },
      {
        name: 'Testing & QA',
        capabilities: ['testing', 'quality_assurance', 'unit_testing', 'e2e_testing'] as AgentCapability[],
        context: `Testing and QA for: ${executionPlan}`,
        acceptanceCriteria: ['All tests passing', 'QA review complete', 'Performance verified', 'Cross-browser tested'],
      },
    ];
  }

  private async analyzeTaskRequirements(description: string): Promise<AgentCapability[]> {
    const capabilities: AgentCapability[] = [];
    const desc = description.toLowerCase();

    // Always include basic capabilities for any task
    capabilities.push('solution_design', 'task_management', 'progress_tracking');

    // Design & Architecture Phase
    if (
      desc.includes('design') ||
      desc.includes('layout') ||
      desc.includes('ui') ||
      desc.includes('ux') ||
      desc.includes('page')
    ) {
      capabilities.push('ux_design', 'ui_design', 'wireframing', 'design_systems');

      // If it's a new feature or component
      if (desc.includes('feature') || desc.includes('component') || desc.includes('page')) {
        capabilities.push('solution_architecture', 'information_architecture', 'user_flows', 'atomic_design');
      }
    }

    // Frontend Development Phase
    if (
      desc.includes('implement') ||
      desc.includes('develop') ||
      desc.includes('build') ||
      desc.includes('create') ||
      desc.includes('page')
    ) {
      capabilities.push('angular_architecture', 'angular_signals', 'standalone_components');

      // UI Components
      if (desc.includes('component') || desc.includes('ui') || desc.includes('interface') || desc.includes('page')) {
        capabilities.push('angular_material', 'ionic_components', 'ui_component_library', 'scss_styling');
      }
    }

    // Testing & Quality Phase
    capabilities.push('testing', 'quality_assurance', 'unit_testing', 'e2e_testing');

    return [...new Set(capabilities)]; // Remove duplicates
  }

  private async createTaskDependencies(task: TaskDefinition): Promise<void> {
    const phases = this.determineTaskPhases(task);
    const subtasks: TaskDefinition[] = [];

    for (const phase of phases) {
      const subtask: TaskDefinition = {
        id: generateId(),
        description: `${phase.name} for: ${task.description}`,
        requiredCapabilities: phase.capabilities,
        status: TaskStatus.PENDING,
        priority: task.priority,
        dependencies: phase.dependsOn ? [subtasks[phase.dependsOn].id] : [],
        acceptanceCriteria: phase.acceptanceCriteria,
        startTime: new Date(),
      };
      subtasks.push(subtask);
    }

    // Update original task with subtask dependencies
    task.dependencies = subtasks.map((st) => st.id);
  }

  private determineTaskPhases(task: TaskDefinition): Array<{
    name: string;
    capabilities: AgentCapability[];
    dependsOn?: number;
    acceptanceCriteria: string[];
  }> {
    const hasDesign = task.requiredCapabilities.some(
      (cap) => cap.includes('design') || cap.includes('ux') || cap.includes('ui')
    );
    const hasFrontend = task.requiredCapabilities.some((cap) => cap.includes('angular') || cap.includes('component'));
    const hasBackend = task.requiredCapabilities.some((cap) => cap.includes('firebase') || cap.includes('cloud'));
    const hasQA = task.requiredCapabilities.some((cap) => cap.includes('test') || cap.includes('quality'));
    const hasDevOps = task.requiredCapabilities.some(
      (cap) => cap.includes('deployment') || cap.includes('infrastructure')
    );
    const hasDocumentation = task.requiredCapabilities.some(
      (cap) => cap.includes('documentation') || cap.includes('guide')
    );
    const hasPerformance = task.requiredCapabilities.some(
      (cap) => cap.includes('performance') || cap.includes('optimization')
    );

    const phases = [];

    // Initial Documentation Phase
    if (hasDocumentation) {
      phases.push({
        name: 'Initial Documentation & Planning',
        capabilities: ['technical_writing', 'system_documentation', 'architecture_documentation'],
        acceptanceCriteria: [
          'System requirements documented',
          'Architecture diagrams created',
          'Technical specifications written',
          'Implementation plan documented',
        ],
      });
    }

    // Design Phase
    if (hasDesign) {
      phases.push({
        name: 'Design & Planning',
        capabilities: ['solution_design', 'ux_design', 'ui_design'],
        acceptanceCriteria: [
          'Design mockups created',
          'User flows documented',
          'Design system compliance verified',
          'Architecture review completed',
        ],
      });
    }

    // Backend Phase
    if (hasBackend) {
      phases.push({
        name: 'Backend Implementation',
        capabilities: ['firebase_project_setup', 'data_modeling', 'security_rules'],
        acceptanceCriteria: [
          'Database schema implemented',
          'Security rules configured',
          'API endpoints created',
          'Code review completed',
          'Security review passed',
        ],
      });
    }

    // Frontend Phase
    if (hasFrontend) {
      phases.push({
        name: 'Frontend Implementation',
        capabilities: ['angular_architecture', 'ui_component_library'],
        dependsOn: hasDesign ? 0 : undefined,
        acceptanceCriteria: [
          'Components implemented',
          'Unit tests passing',
          'Design requirements met',
          'Code review completed',
          'Performance review passed',
        ],
      });
    }

    // Infrastructure Setup Phase
    if (hasDevOps) {
      phases.push({
        name: 'Infrastructure & Environment Setup',
        capabilities: ['cloud_infrastructure', 'environment_management', 'ci_cd_pipelines', 'secret_management'],
        acceptanceCriteria: [
          'Environments configured',
          'CI/CD pipelines setup',
          'Security measures implemented',
          'Monitoring configured',
        ],
      });
    }

    // Performance Optimization Phase
    if (hasPerformance) {
      phases.push({
        name: 'Performance Optimization',
        capabilities: ['performance_profiling', 'bottleneck_analysis', 'runtime_performance', 'loading_strategies'],
        dependsOn: phases.length - 1,
        acceptanceCriteria: [
          'Performance benchmarks established',
          'Optimizations implemented',
          'Load testing completed',
          'Metrics within targets',
        ],
      });
    }

    // Code Review Phase (always included)
    phases.push({
      name: 'Code Review & Quality Check',
      capabilities: [
        'code_review',
        'static_analysis',
        'best_practices',
        'security_best_practices',
        'typescript_standards',
        'angular_standards',
      ],
      dependsOn: phases.length - 1,
      acceptanceCriteria: [
        'Code meets style guidelines',
        'Best practices followed',
        'Security standards met',
        'Documentation complete',
        'Test coverage adequate',
        'Performance standards met',
      ],
    });

    // Testing Phase
    if (hasQA) {
      phases.push({
        name: 'Testing & Quality Assurance',
        capabilities: ['e2e_testing', 'performance_testing'],
        dependsOn: phases.length - 1,
        acceptanceCriteria: [
          'E2E tests passing',
          'Performance benchmarks met',
          'Accessibility verified',
          'Cross-browser tested',
          'Security tested',
          'Final review completed',
        ],
      });
    }

    // Final Documentation Phase
    if (hasDocumentation) {
      phases.push({
        name: 'Final Documentation',
        capabilities: ['api_documentation', 'user_guides', 'deployment_documentation', 'maintenance_guides'],
        dependsOn: phases.length - 1,
        acceptanceCriteria: [
          'API documentation complete',
          'User guides updated',
          'Deployment guides created',
          'Maintenance procedures documented',
        ],
      });
    }

    // Deployment Phase
    if (hasDevOps) {
      phases.push({
        name: 'Deployment & Monitoring Setup',
        capabilities: ['deployment_strategies', 'monitoring_setup', 'alerting_systems', 'analytics_integration'],
        dependsOn: phases.length - 1,
        acceptanceCriteria: [
          'Deployment completed',
          'Monitoring active',
          'Alerts configured',
          'Analytics tracking verified',
        ],
      });
    }

    return phases;
  }

  async monitorProgress(taskId: string): Promise<void> {
    const task = this.getTaskById(taskId);
    if (!task) return;

    // Monitor task status and handle state transitions
    switch (task.status) {
      case TaskStatus.IN_PROGRESS:
        await this.checkProgressAndNotify(task);
        break;
      case TaskStatus.COMPLETED:
        await this.verifyCompletion(task);
        break;
      case TaskStatus.FAILED:
        await this.handleFailure(task);
        break;
    }
  }

  private async checkProgressAndNotify(task: TaskDefinition): Promise<void> {
    // Check progress with assigned agent
    const agent = this.agentsService.agents().find((a) => a.id === task.assignedAgentId);
    if (!agent) return;

    // Notify stakeholders of progress
    if (task.stakeholders) {
      // Implementation for stakeholder notification
      console.log(`Task ${task.id} progress update for stakeholders:`, {
        status: task.status,
        assignedTo: agent.name,
        startTime: task.startTime,
      });
    }
  }

  private async verifyCompletion(task: TaskDefinition): Promise<void> {
    if (!task.acceptanceCriteria) return;

    // Verify each acceptance criterion
    const verificationResults = task.acceptanceCriteria.map((criterion) => {
      // Implementation for verification logic
      return { criterion, passed: true }; // Placeholder
    });

    // Update task status based on verification
    const allCriteriaMet = verificationResults.every((r) => r.passed);
    if (allCriteriaMet) {
      task.completionTime = new Date();
      // Update task status to verified
      console.log(`Task ${task.id} completed and verified`);
    } else {
      // Reopen task if criteria not met
      console.log(`Task ${task.id} requires additional work`);
    }
  }

  private async handleFailure(task: TaskDefinition): Promise<void> {
    // Analyze failure and determine recovery action
    const recoveryAction = await this.determineRecoveryAction(task);

    // Implement recovery strategy
    switch (recoveryAction) {
      case 'reassign':
        await this.reassignTask(task);
        break;
      case 'split':
        await this.splitTask(task);
        break;
      case 'escalate':
        await this.escalateTask(task);
        break;
    }
  }

  private async determineRecoveryAction(task: TaskDefinition): Promise<'reassign' | 'split' | 'escalate'> {
    // Logic to determine best recovery action based on task context
    return 'reassign'; // Placeholder
  }

  private async reassignTask(task: TaskDefinition): Promise<void> {
    // Find another suitable agent
    const newAgent = this.agentsService
      .agents()
      .find((a) => a.status === 'idle' && task.requiredCapabilities.every((cap) => a.capabilities.includes(cap)));

    if (newAgent) {
      task.assignedAgentId = newAgent.id;
      task.status = TaskStatus.PENDING;
      console.log(`Task ${task.id} reassigned to ${newAgent.name}`);
    }
  }

  private async splitTask(task: TaskDefinition): Promise<void> {
    // Implementation for breaking down complex tasks
    console.log(`Task ${task.id} will be split into smaller subtasks`);
  }

  private async escalateTask(task: TaskDefinition): Promise<void> {
    // Implementation for task escalation
    console.log(`Task ${task.id} escalated to human intervention`);
  }

  // Add public methods to access task data
  getTasks(): TaskDefinition[] {
    return this.storageService.loadTasks();
  }

  getAgents() {
    return this.agentsService.agents();
  }

  getTaskById(taskId: string): TaskDefinition | undefined {
    const tasks = this.storageService.loadTasks();
    return tasks.find((task) => task.id === taskId);
  }

  getAssignedAgent(taskId: string) {
    const task = this.getTaskById(taskId);
    if (!task?.assignedAgentId) return undefined;

    return this.agentsService.agents().find((agent) => agent.id === task.assignedAgentId);
  }
}
