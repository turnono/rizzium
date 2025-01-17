import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { WorkflowState } from '../../../../../interfaces/src/lib/workflow.interface';

@Component({
  selector: 'lib-workflow-progress',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="workflow-progress">
      <ion-progress-bar [value]="progress()"></ion-progress-bar>

      <ion-list>
        <ion-item *ngFor="let step of workflowSteps" [class.active]="step === currentStep()">
          <ion-icon slot="start" [name]="getStepIcon(step)" [color]="getStepColor(step)"></ion-icon>

          <ion-label>
            <h3>{{ formatStepName(step) }}</h3>
            <p *ngIf="step === currentStep() && lastError()?.step === step" class="error-message">
              {{ lastError()?.message }}
              <span *ngIf="lastError()?.nextRetry"> Retrying in {{ getRetryTimeLeft(lastError()?.nextRetry) }}s </span>
            </p>
          </ion-label>

          <ion-badge slot="end" [color]="getStepColor(step)">
            {{ getStepStatus(step) }}
          </ion-badge>
        </ion-item>
      </ion-list>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .workflow-progress {
        padding: 1rem;
      }

      ion-progress-bar {
        margin-bottom: 1rem;
      }

      .error-message {
        color: var(--ion-color-danger);
        font-size: 0.875rem;
      }

      ion-item.active {
        --background: var(--ion-color-light);
      }
    `,
  ],
})
export class WorkflowProgressComponent {
  @Input({ required: true }) set state(value: WorkflowState) {
    this._state.set(value);
  }

  private readonly _state = signal<WorkflowState | null>(null);

  protected readonly workflowSteps = ['start', 'research', 'ideation', 'script', 'optimization', 'scheduling'];

  protected readonly currentStep = computed(() => this._state()?.currentStep || 'start');
  protected readonly completedSteps = computed(() => this._state()?.completedSteps || []);
  protected readonly lastError = computed(() => this._state()?.lastError);

  protected readonly progress = computed(() => {
    const current = this.workflowSteps.indexOf(this.currentStep());
    return (current + 1) / this.workflowSteps.length;
  });

  protected getStepIcon(step: string): string {
    if (this.completedSteps().includes(step)) {
      return 'checkmark-circle';
    }
    if (step === this.currentStep()) {
      return this.lastError()?.step === step ? 'alert-circle' : 'hourglass';
    }
    return 'ellipse-outline';
  }

  protected getStepColor(step: string): string {
    if (this.completedSteps().includes(step)) {
      return 'success';
    }
    if (step === this.currentStep()) {
      return this.lastError()?.step === step ? 'danger' : 'primary';
    }
    return 'medium';
  }

  protected getStepStatus(step: string): string {
    if (this.completedSteps().includes(step)) {
      return 'Completed';
    }
    if (step === this.currentStep()) {
      return this.lastError()?.step === step ? 'Failed' : 'In Progress';
    }
    return 'Pending';
  }

  protected formatStepName(step: string): string {
    return step.charAt(0).toUpperCase() + step.slice(1);
  }

  protected getRetryTimeLeft(retryDate: Date | undefined): number {
    if (!retryDate) return 0;
    const timeLeft = Math.max(0, Math.floor((retryDate.getTime() - Date.now()) / 1000));
    return timeLeft;
  }
}
