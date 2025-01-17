import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AgentDashboardService } from '@rizzium/shared/services';
import { AgentCard, AgentActivity } from '@rizzium/shared/interfaces';
import { Observable } from 'rxjs';
import { addIcons } from 'ionicons';
import { analytics, documentText, trendingUp, shareSocial } from 'ionicons/icons';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>AI Agent Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-grid>
        <!-- Agent Cards -->
        <ion-row>
          @for (agent of agents; track agent.id) {
          <ion-col size="12" sizeMd="6" sizeLg="3">
            <ion-card [routerLink]="agent.route" class="agent-card">
              <ion-card-header>
                <ion-icon [name]="agent.icon" size="large"></ion-icon>
                <ion-card-title>{{ agent.name }}</ion-card-title>
                <ion-card-subtitle>{{ agent.description }}</ion-card-subtitle>
              </ion-card-header>

              <!-- Recent Activities -->
              <ion-card-content>
                <ion-list>
                  <ion-list-header>
                    <ion-label>Recent Activities</ion-label>
                  </ion-list-header>

                  @if (agent.recentActivities$ | async; as activities) { @for (activity of activities; track
                  activity.id) {
                  <ion-item lines="none">
                    <ion-label>
                      <h3>{{ activity.title }}</h3>
                      <p>{{ activity.timestamp | date : 'short' }}</p>
                    </ion-label>
                    @if (activity.status) {
                    <ion-badge slot="end" [color]="getStatusColor(activity.status)">
                      {{ activity.status }}
                    </ion-badge>
                    }
                  </ion-item>
                  } @if (!activities.length) {
                  <ion-item lines="none">
                    <ion-label color="medium">
                      <p>No recent activities</p>
                    </ion-label>
                  </ion-item>
                  } }
                </ion-list>
              </ion-card-content>
            </ion-card>
          </ion-col>
          }
        </ion-row>
      </ion-grid>
    </ion-content>
  `,
  styles: [
    `
      .agent-card {
        height: 100%;
        cursor: pointer;
        transition: transform 0.2s ease;

        &:hover {
          transform: translateY(-4px);
        }

        ion-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        ion-card-content {
          padding-top: 0;
        }
      }

      ion-badge {
        text-transform: capitalize;
      }
    `,
  ],
})
export class AgentDashboardComponent {
  private agentService: AgentDashboardService = inject(AgentDashboardService);
  agents: (AgentCard & { recentActivities$: Observable<AgentActivity[]> })[];

  constructor() {
    addIcons({ analytics, documentText, trendingUp, shareSocial });
    this.agents = this.agentService.getAllAgents().map((agent) => ({
      ...agent,
      recentActivities$: this.agentService.getRecentActivities(agent.id, 3),
    }));
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'scheduled':
        return 'primary';
      default:
        return 'medium';
    }
  }
}
