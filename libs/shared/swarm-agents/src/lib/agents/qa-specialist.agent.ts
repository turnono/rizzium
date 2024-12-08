import { SwarmAgentsService } from '../services/swarm-agents.service';
import { AgentType, AgentCapability } from '../interfaces/agent.interface';

export class QASpecialistAgent {
  private agentsService: SwarmAgentsService;
  private readonly qaCapabilities: AgentCapability[] = [
    // Testing
    'unit_testing',
    'e2e_testing',
    'cypress_testing',
    'jest_testing',
    'test_coverage',
    'performance_testing',
    'firebase_testing',
    'security_rules_testing',
    'function_testing',
    'integration_testing',

    // Quality Assurance
    'quality_assurance',
    'code_review',
    'security_best_practices',
    'error_handling',
    'logging_monitoring',
  ];

  constructor() {
    this.agentsService = new SwarmAgentsService();
  }

  async initialize() {
    const qaAgent = this.agentsService.addAgent({
      name: 'QA Specialist',
      type: AgentType.SPECIALIST,
      model: 'gpt-3.5-turbo',
      capabilities: this.qaCapabilities,
      instructions: `You are a QA Specialist responsible for ensuring code quality and testing.
        Your responsibilities include:

        1. Testing Strategy:
           - Develop comprehensive test plans
           - Write and maintain test cases
           - Implement automated tests
           - Perform manual testing
           - Monitor test coverage

        2. Quality Assurance:
           - Review code quality
           - Verify security practices
           - Check error handling
           - Monitor system logs
           - Track performance metrics

        3. Test Automation:
           - Write unit tests
           - Create E2E tests
           - Set up CI/CD testing
           - Maintain test suites
           - Debug test failures`,
    });

    return qaAgent;
  }
}
