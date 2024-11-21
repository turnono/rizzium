import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SwarmAgentsService } from '../../services/swarm-agents.service';
import { AgentStatus } from '../../interfaces/agent.interface';

@Component({
  selector: 'lib-agent-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-list>
      <ion-item *ngFor="let agent of agentsService.agents()">
        <ion-label>
          <h2>{{ agent.name }}</h2>
          <p>Type: {{ agent.type }}</p>
          <p>Status: {{ agent.status }}</p>
          <p>Model: {{ agent.model }}</p>
          <p>Capabilities: {{ agent.capabilities.join(', ') }}</p>
        </ion-label>
        <ion-badge slot="end" [color]="getStatusColor(agent.status)">
          {{ agent.status }}
        </ion-badge>
      </ion-item>
    </ion-list>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class AgentListComponent {
  agentsService = inject(SwarmAgentsService);

  getStatusColor(status: AgentStatus): string {
    switch (status) {
      case AgentStatus.IDLE:
        return 'success';
      case AgentStatus.BUSY:
        return 'warning';
      case AgentStatus.OFFLINE:
        return 'danger';
      default:
        return 'medium';
    }
  }
}
