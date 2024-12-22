import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalysisService } from '@rizzium/shared/services';
import { Analysis } from '@rizzium/shared/interfaces';
import { AnalysisResultsComponent } from '@rizzium/shared/ui/molecules';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSkeletonText,
  IonIcon,
  IonButton,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { documentTextOutline, timeOutline, alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AnalysisResultsComponent,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSkeletonText,
    IonIcon,
    IonButton,
    IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Analysis History</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (loading) {
      <ion-list>
        @for (_ of [1,2,3]; track $index) {
        <ion-item>
          <ion-label>
            <h2><ion-skeleton-text animated style="width: 50%"></ion-skeleton-text></h2>
            <p><ion-skeleton-text animated style="width: 70%"></ion-skeleton-text></p>
          </ion-label>
        </ion-item>
        }
      </ion-list>
      } @else if (analyses.length === 0) {
      <div class="empty-state">
        <ion-icon name="document-text-outline" size="large"></ion-icon>
        <h2>No Analysis History</h2>
        <p>Upload a document to start analyzing</p>
        <ion-button routerLink="/file-upload">Upload Document</ion-button>
      </div>
      } @else {
      <ion-list>
        @for (analysis of analyses; track analysis.id) {
        <ion-item
          [button]="true"
          [detail]="true"
          (click)="selectedAnalysis = analysis"
          [class.selected]="selectedAnalysis?.id === analysis.id"
        >
          <ion-icon
            slot="start"
            [name]="getStatusIcon(analysis.status)"
            [color]="getStatusColor(analysis.status)"
          ></ion-icon>
          <ion-label>
            <h2>{{ analysis.fileName }}</h2>
            <p>
              <ion-icon name="time-outline"></ion-icon>
              {{ analysis.createdAt.toDate() | date : 'medium' }}
            </p>
            @if (analysis.status === 'completed') {
            <ion-badge [color]="getRiskColor(analysis.results?.riskLevel)">
              {{ analysis.results?.riskLevel | uppercase }}
            </ion-badge>
            }
          </ion-label>
        </ion-item>
        }
      </ion-list>

      @if (selectedAnalysis) {
      <ui-analysis-results [analysis]="selectedAnalysis.results" class="ion-margin-top"></ui-analysis-results>
      } }
    </ion-content>
  `,
  styles: [
    `
      .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--ion-color-medium);

        ion-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        h2 {
          margin-bottom: 0.5rem;
        }

        p {
          margin-bottom: 1.5rem;
        }
      }

      ion-item.selected {
        --background: var(--ion-color-light);
      }

      ion-badge {
        margin-top: 0.5rem;
      }

      ion-label {
        h2 {
          font-weight: 500;
        }

        p {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--ion-color-medium);
        }
      }
    `,
  ],
})
export class ReportsPage implements OnInit {
  analyses: Analysis[] = [];
  selectedAnalysis: Analysis | null = null;
  loading = true;

  constructor(private analysisService: AnalysisService) {
    addIcons({ documentTextOutline, timeOutline, alertCircleOutline });
  }

  ngOnInit() {
    this.loadAnalyses();
  }

  private loadAnalyses() {
    this.analysisService.getUserAnalyses().subscribe({
      next: (analyses) => {
        this.analyses = analyses;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading analyses:', error);
        this.loading = false;
      },
    });
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'checkmark-circle-outline';
      case 'failed':
        return 'alert-circle-outline';
      default:
        return 'time-outline';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      default:
        return 'warning';
    }
  }

  getRiskColor(risk: 'high' | 'medium' | 'low' | undefined): string {
    switch (risk) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'medium';
    }
  }
}
