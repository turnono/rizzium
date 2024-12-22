import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalysisService } from '@rizzium/shared/services';
import { Analysis, AnalysisStatus } from '@rizzium/shared/interfaces';
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
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonAlert,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  timeOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  hourglassOutline,
} from 'ionicons/icons';
import { Firestore, Timestamp, updateDoc, doc } from '@angular/fire/firestore';
import { getFunctions, httpsCallable } from '@angular/fire/functions';

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
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
  ],
  providers: [AnalysisService],
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
          (click)="selectAnalysis(analysis)"
          [class.selected]="selectedAnalysis?.id === analysis.id"
          [attr.data-cy]="'analysis-item-' + analysis.id"
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

      @if (selectedAnalysis) { @if (selectedAnalysis.status === 'pending' || selectedAnalysis.status === 'uploaded') {
      <ion-card class="ion-margin-top">
        <ion-card-content class="ion-text-center">
          <ion-button (click)="startAnalysis(selectedAnalysis)">
            {{ selectedAnalysis.status === 'pending' ? 'Start Analysis' : 'Process Document' }}
          </ion-button>
        </ion-card-content>
      </ion-card>
      } @else if (selectedAnalysis.status === 'processing') {
      <ion-card class="ion-margin-top">
        <ion-card-content class="ion-text-center">
          <ion-spinner></ion-spinner>
          <p>Analyzing document...</p>
        </ion-card-content>
      </ion-card>
      } @else if (selectedAnalysis.status === 'failed') {
      <ion-card class="ion-margin-top" color="danger">
        <ion-card-content class="ion-text-center">
          <ion-icon name="alert-circle" size="large"></ion-icon>
          <p>Analysis failed. Please try again.</p>
          <ion-button (click)="retryAnalysis(selectedAnalysis)"> Retry Analysis </ion-button>
        </ion-card-content>
      </ion-card>
      } @else if (selectedAnalysis.status === 'completed' && selectedAnalysis.results) {
      <ui-analysis-results
        [analysis]="getAnalysisResults(selectedAnalysis)"
        class="ion-margin-top"
      ></ui-analysis-results>
      } } }
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
  private firestore = inject(Firestore);
  private alertController = inject(AlertController);
  private functions = getFunctions();
  analyses: Analysis[] = [];
  selectedAnalysis: Analysis | null = null;
  loading = true;

  constructor(private analysisService: AnalysisService) {
    addIcons({ documentTextOutline, timeOutline, alertCircleOutline, checkmarkCircleOutline, hourglassOutline });
  }

  ngOnInit() {
    this.analysisService.getUserAnalyses().subscribe({
      next: (analyses) => {
        this.analyses = analyses;
        this.loading = false;

        if (this.selectedAnalysis) {
          const updatedAnalysis = analyses.find((a) => a.id === this.selectedAnalysis?.id);
          if (updatedAnalysis) {
            this.selectedAnalysis = updatedAnalysis;
          }
        }
      },
      error: (error) => {
        console.error('Error loading analyses:', error);
        this.analyses = [];
        this.loading = false;
      },
    });
  }

  async selectAnalysis(analysis: Analysis) {
    console.log('selectAnalysis called with:', analysis);
    this.selectedAnalysis = analysis;

    if (analysis.status === 'pending' || analysis.status === 'uploaded') {
      console.log('Creating alert for analysis');
      const alert = await this.alertController.create({
        header: 'Start Analysis',
        message: 'Would you like to start analyzing this document?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              console.log('Analysis cancelled');
            },
          },
          {
            text: 'Start',
            handler: () => {
              console.log('Starting analysis from alert');
              this.startAnalysis(analysis);
            },
          },
        ],
      });

      await alert.present();
    }
  }

  async startAnalysis(analysis: Analysis) {
    console.log('startAnalysis called with:', analysis);

    if (!analysis.id || !analysis.userId) {
      console.error('Missing analysis id or userId:', analysis);
      return;
    }

    try {
      console.log('Getting analysis reference for:', analysis.id);
      const analysisRef = doc(this.firestore, `users/${analysis.userId}/analyses/${analysis.id}`);

      console.log('Updating status to processing');
      await updateDoc(analysisRef, {
        status: 'processing' as AnalysisStatus,
        updatedAt: Timestamp.now(),
      });

      this.selectedAnalysis = {
        ...analysis,
        status: 'processing',
      };

      // Call the Cloud Function
      const analyzeDocument = httpsCallable(this.functions, 'analyzeDocument');
      await analyzeDocument({
        documentUrl: analysis.fileUrl,
        analysisType: 'general', // or get this from user input
      });

      // The function will update the document status and results
      // Our real-time subscription will update the UI
    } catch (error) {
      console.error('Error starting analysis:', error);
      const analysisRef = doc(this.firestore, `users/${analysis.userId}/analyses/${analysis.id}`);
      await updateDoc(analysisRef, {
        status: 'failed' as AnalysisStatus,
        updatedAt: Timestamp.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      this.selectedAnalysis = {
        ...analysis,
        status: 'failed',
      };
    }
  }

  async retryAnalysis(analysis: Analysis) {
    if (analysis.status === 'failed') {
      await this.startAnalysis(analysis);
    }
  }

  getStatusIcon(status: AnalysisStatus): string {
    switch (status) {
      case 'completed':
        return 'checkmark-circle-outline';
      case 'failed':
        return 'alert-circle-outline';
      case 'processing':
        return 'hourglass-outline';
      case 'pending':
      case 'uploaded':
        return 'document-outline';
      default:
        return 'document-outline';
    }
  }

  getStatusColor(status: AnalysisStatus): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'processing':
        return 'warning';
      case 'pending':
      case 'uploaded':
        return 'medium';
      default:
        return 'medium';
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

  getAnalysisResults(analysis: Analysis) {
    if (!analysis.results) return null;
    return {
      text: analysis.results.text || analysis.fileName,
      riskLevel: analysis.results.riskLevel,
      summary: {
        riskLevel: analysis.results.summary.riskLevel,
        description: analysis.results.summary.description,
        recommendations: analysis.results.summary.recommendations,
      },
      flags: analysis.results.flags,
      recommendations: analysis.results.recommendations,
    };
  }
}
