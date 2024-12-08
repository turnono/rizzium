import { Injectable } from '@angular/core';
import { SwarmAgentsService } from './swarm-agents.service';
import { TaskDefinition, Agent, AgentCapability } from '../interfaces/agent.interface';
import { SolutionsExpertAgent } from '../agents/solutions-expert.agent';
import { FrontendDeveloperAgent } from '../agents/frontend-developer.agent';

@Injectable({
  providedIn: 'root',
})
export class TaskOrchestratorService {
  private solutionsExpert: SolutionsExpertAgent;
  private frontendDev: FrontendDeveloperAgent;

  constructor(private swarmService: SwarmAgentsService) {
    this.solutionsExpert = new SolutionsExpertAgent();
    this.frontendDev = new FrontendDeveloperAgent();
  }

  async delegateTask(task: TaskDefinition): Promise<boolean> {
    try {
      if (task.description.toLowerCase().includes('learning platform')) {
        // Phase 1: Design
        const designTask: TaskDefinition = {
          ...task,
          id: `${task.id}-design`,
          description: `Create a comprehensive design for an online learning platform with 4 modules and 30 lessons per module. Include:
            1. Platform structure and navigation
            2. Module and lesson organization
            3. Learning experience features
            4. Progress tracking
            5. User interaction elements`,
          requiredCapabilities: [
            'solution_design',
            'ux_design',
            'ui_design',
            'information_architecture',
            'user_flows',
            'wireframing',
          ] as AgentCapability[],
        };

        const designResult = await this.solutionsExpert.executeTask(designTask);
        if (!designResult.success) {
          throw new Error('Design phase failed');
        }

        // Extract design specs from the result
        const designSpec = this.extractDesignSpec(designResult.output);

        // Phase 2: Implementation
        const implementationTask: TaskDefinition = {
          ...task,
          id: `${task.id}-implementation`,
          description: `Implement design: ${designSpec}`,
          requiredCapabilities: [
            'code_implementation',
            'component_implementation',
            'angular_architecture',
            'standalone_components',
            'state_management',
          ] as AgentCapability[],
        };

        const implementationResult = await this.frontendDev.executeTask(implementationTask);
        return implementationResult.success;
      }

      return this.delegateRegularTask(task);
    } catch (error) {
      console.error('Task delegation failed:', error);
      return false;
    }
  }

  private extractDesignSpec(output: string): string {
    const designMatch = /DESIGN:\n([\s\S]*?)\nEND DESIGN/.exec(output);
    const componentsMatch = /COMPONENTS:\n([\s\S]*?)\nEND COMPONENTS/.exec(output);
    const layoutMatch = /LAYOUT:\n([\s\S]*?)\nEND LAYOUT/.exec(output);
    const userFlowsMatch = /USER FLOWS:\n([\s\S]*?)\nEND USER FLOWS/.exec(output);

    return `
      Design Specifications:
      ${designMatch?.[1] || ''}

      Component Requirements:
      ${componentsMatch?.[1] || ''}

      Layout Requirements:
      ${layoutMatch?.[1] || ''}

      User Flows:
      ${userFlowsMatch?.[1] || ''}
    `.trim();
  }

  private async delegateRegularTask(task: TaskDefinition): Promise<boolean> {
    const agent = await this.findBestAgent(task);
    if (!agent) {
      throw new Error('No suitable agent found for task');
    }
    const result = await this.swarmService.executeTask(task);
    return result.success;
  }

  private async findBestAgent(task: TaskDefinition): Promise<Agent | null> {
    const agents = this.swarmService.agents();

    // Score each agent based on capability match
    const scoredAgents = agents.map((agent) => ({
      agent,
      score: this.calculateCapabilityScore(agent.capabilities, task.requiredCapabilities),
    }));

    // Sort by score and return the best match
    const bestMatch = scoredAgents.sort((a, b) => b.score - a.score)[0];
    return bestMatch?.score > 0 ? bestMatch.agent : null;
  }

  private calculateCapabilityScore(
    agentCapabilities: AgentCapability[],
    requiredCapabilities: AgentCapability[]
  ): number {
    return requiredCapabilities.reduce((score, capability) => {
      return score + (agentCapabilities.includes(capability) ? 1 : 0);
    }, 0);
  }
}
