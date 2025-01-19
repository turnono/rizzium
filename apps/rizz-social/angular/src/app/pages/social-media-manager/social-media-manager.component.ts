import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SwarmAgentsService } from '@rizzium/shared/swarm-agents';
import { Agent } from '@rizzium/shared/interfaces';
import { Observable, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-social-media-manager',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content>
      <ion-grid>
        <ion-row>
          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Create TikTok Video</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-textarea
                  [(ngModel)]="scriptInput"
                  placeholder="Enter your video script here..."
                  rows="6"
                  data-cy="script-input"
                ></ion-textarea>
                <ion-button
                  expand="block"
                  (click)="startVideoCreation()"
                  [disabled]="!scriptInput || isLoading()"
                  data-cy="generate-video-btn"
                >
                  <ion-spinner *ngIf="isLoading()"></ion-spinner>
                  <span *ngIf="!isLoading()">Generate Video</span>
                </ion-button>
              </ion-card-content>
            </ion-card>

            <ion-card *ngIf="errorMessage()">
              <ion-card-content>
                <ion-text color="danger">{{ errorMessage() }}</ion-text>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>

        <ion-row>
          <ion-col size="12">
            <ion-list>
              <ion-item *ngFor="let agent of agents$ | async" data-cy="agent-item">
                <ion-label>
                  <h2>{{ agent.name }}</h2>
                  <p>{{ agent.description }}</p>
                  <ion-progress-bar [value]="agent.progress / 100"></ion-progress-bar>
                </ion-label>
                <ion-note slot="end">{{ agent.status }}</ion-note>
              </ion-item>
            </ion-list>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  `,
})
export class SocialMediaManagerComponent {
  private swarmAgents = inject(SwarmAgentsService);

  scriptInput = '';
  agents$: Observable<Agent[]> = this.swarmAgents.getAgentsByType('script');
  isLoading = signal(false);
  errorMessage = signal('');

  async startVideoCreation(): Promise<void> {
    if (!this.scriptInput.trim() || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      console.log('Creating script agent...');
      const scriptAgent = await firstValueFrom(this.swarmAgents.createScriptAgent(this.scriptInput));
      console.log('Script agent created:', scriptAgent);

      // Simulate script segmentation (replace with actual AI processing)
      const segments = this.scriptInput.split('.').filter((s) => s.trim());
      console.log('Created segments:', segments);

      await firstValueFrom(
        this.swarmAgents.updateAgentStatus<{ segments: string[] }>(scriptAgent.id, 'completed', 100, {
          success: true,
          data: { segments },
        })
      );
      console.log('Updated script agent status');

      // Create and process video agents for each segment
      for (const segment of segments) {
        const videoAgent = await firstValueFrom(this.swarmAgents.createVideoAgent(segment));
        console.log('Created video agent:', videoAgent);

        // Start video generation
        firstValueFrom(this.swarmAgents.generateVideo(videoAgent)).catch((error) => {
          console.error('Error generating video for segment:', segment, error);
        });
      }
    } catch (error) {
      console.error('Error in video creation workflow:', error);
      this.errorMessage.set(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      this.isLoading.set(false);
    }
  }
}
