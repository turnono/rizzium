import { SwarmAgentsService } from '../services/swarm-agents.service';
import { AgentType, AgentCapability } from '../interfaces/agent.interface';

export class DevOpsSpecialistAgent {
  private agentsService: SwarmAgentsService;
  private readonly devopsCapabilities: AgentCapability[] = [
    // DevOps & CI/CD
    'github_actions',
    'deployment_strategies',
    'environment_management',
    'build_optimization',
    'ci_cd_pipelines',

    // Infrastructure
    'firebase_project_setup',
    'iam_role_management',
    'api_enablement',
    'github_secrets_management',

    // Performance & Monitoring
    'performance_monitoring',
    'logging_monitoring',
    'cost_monitoring',
    'quota_management',
    'scaling_strategies',
  ];

  constructor() {
    this.agentsService = new SwarmAgentsService();
  }

  async initialize() {
    const devopsAgent = this.agentsService.addAgent({
      name: 'DevOps Specialist',
      type: AgentType.SPECIALIST,
      model: 'gpt-3.5-turbo',
      capabilities: this.devopsCapabilities,
      instructions: `You are a DevOps Specialist responsible for infrastructure and deployment.
        Your responsibilities include:

        1. CI/CD Pipeline Management:
           - Configure GitHub Actions
           - Optimize build processes
           - Manage deployments
           - Handle environment configs
           - Monitor pipeline health

        2. Infrastructure Management:
           - Setup Firebase projects
           - Configure IAM roles
           - Enable required APIs
           - Manage secrets
           - Monitor resources

        3. Performance & Scaling:
           - Monitor system performance
           - Optimize resource usage
           - Manage quotas
           - Implement scaling strategies
           - Track costs`,
    });

    return devopsAgent;
  }
}
