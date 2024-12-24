import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AnalysisService, FirebaseAuthService } from '@rizzium/shared/services';
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
  AlertController,
  IonSegment,
  IonSegmentButton,
  IonSearchbar,
  IonButtons,
  IonBackButton,
  IonToast,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  timeOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  hourglassOutline,
  searchOutline,
  filterOutline,
  arrowForward,
  informationCircle,
  analyticsOutline,
} from 'ionicons/icons';
import { Firestore, Timestamp, updateDoc, doc } from '@angular/fire/firestore';
import { getFunctions, httpsCallable } from '@angular/fire/functions';
import { firstValueFrom } from 'rxjs';

// Add interface for the analysis response
interface AnalysisResponse {
  data: {
    text?: string;
    riskLevel?: 'high' | 'medium' | 'low';
    summary: {
      riskLevel: 'high' | 'medium' | 'low';
      description: string;
      recommendations: string[];
    };
    flags: Array<{
      start: number;
      end: number;
      reason: string;
      riskLevel: 'high' | 'medium' | 'low';
    }>;
  };
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonSegment,
    IonSegmentButton,
    IonSearchbar,
    IonButtons,
    IonBackButton,
    IonToast,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Analysis Reports</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showFilters = !showFilters">
            <ion-icon name="filter-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      @if (showFilters) {
      <ion-toolbar>
        <div class="analysis-filters">
          <ion-segment [(ngModel)]="statusFilter" (ionChange)="applyFilters()">
            <ion-segment-button value="all">All</ion-segment-button>
            <ion-segment-button value="completed">Completed</ion-segment-button>
            <ion-segment-button value="processing">Processing</ion-segment-button>
          </ion-segment>

          <ion-searchbar
            [(ngModel)]="searchTerm"
            (ionInput)="applyFilters()"
            placeholder="Search documents..."
            [debounce]="300"
          ></ion-searchbar>
        </div>
      </ion-toolbar>
      }
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
      <!-- <ion-toast
        [isOpen]="true"
        message="Analysis failed. Please try again."
        color="danger"
        position="bottom"
        [icon]="'alert-circle-outline'"
      ></ion-toast> -->
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

      .analysis-filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;

        ion-segment {
          flex: 1;
          min-width: 200px;
        }
      }

      .analysis-list {
        ion-item {
          --padding-start: 1rem;
          --inner-padding-end: 1rem;
          margin-bottom: 0.5rem;
          border-radius: 8px;
          --background: var(--ion-color-light);

          &.selected {
            --background: var(--ion-color-primary-tint);
          }

          ion-label {
            h2 {
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }

            p {
              margin-top: 0.5rem;
              color: var(--ion-color-medium);
            }
          }

          ion-badge {
            margin-left: auto;
            font-size: 0.8rem;
            padding: 4px 8px;
          }
        }
      }

      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        background: var(--ion-color-light);
        border-radius: 8px;
        margin: 1rem;

        ion-icon {
          font-size: 4rem;
          color: var(--ion-color-medium);
          margin-bottom: 1rem;
        }

        h2 {
          color: var(--ion-color-dark);
          margin-bottom: 0.5rem;
        }

        p {
          color: var(--ion-color-medium);
          margin-bottom: 1.5rem;
        }
      }

      .analysis-results {
        margin-top: 1rem;
        padding: 1rem;
        background: var(--ion-color-light);
        border-radius: 8px;

        .risk-level {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;

          ion-badge {
            font-size: 1rem;
            padding: 4px 12px;
          }
        }

        .flags-section {
          margin-top: 1rem;

          .flag-item {
            background: var(--ion-color-warning-tint);
            padding: 0.5rem;
            border-radius: 4px;
            margin-bottom: 0.5rem;

            h4 {
              margin: 0;
              color: var(--ion-color-warning-shade);
            }

            p {
              margin: 0.5rem 0 0;
              font-size: 0.9rem;
            }
          }
        }
      }

      @media (max-width: 576px) {
        .analysis-filters {
          flex-direction: column;

          ion-segment {
            width: 100%;
          }
        }
      }
    `,
  ],
})
export class ReportsPage implements OnInit {
  private firestore = inject(Firestore);
  private alertController = inject(AlertController);
  private functions = getFunctions();
  private authService = inject(FirebaseAuthService);

  analyses: Analysis[] = [];
  selectedAnalysis: Analysis | null = null;
  loading = true;
  showFilters = false;
  statusFilter = 'all';
  searchTerm = '';

  constructor(private analysisService: AnalysisService) {
    addIcons({
      documentTextOutline,
      timeOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      hourglassOutline,
      searchOutline,
      filterOutline,
      arrowForward,
      informationCircle,
      analyticsOutline,
    });
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
    try {
      if (!analysis.fileUrl) {
        throw new Error('No file URL available for analysis');
      }

      // Update status to processing
      await this.updateAnalysisStatus(analysis.id, 'processing');

      const analyzeDocument = httpsCallable<{ imageUrl: string; analysisType: string }, AnalysisResponse>(
        this.functions,
        'analyzeDocument'
      );

      // Add error handling and timeout
      const response = (await Promise.race([
        analyzeDocument({
          imageUrl: analysis.fileUrl,
          analysisType: 'general',
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Analysis timeout')), 30000)),
      ])) as AnalysisResponse;

      if (!response.data) {
        throw new Error('No analysis results received');
      }

      // Update the analysis with results
      await this.updateAnalysisResults(analysis.id, response.data);
    } catch (error) {
      console.error('Error starting analysis:', error);

      // Show error alert to user
      const alert = await this.alertController.create({
        header: 'Analysis Failed',
        message: 'There was an error analyzing your document. Please try again later.',
        buttons: ['OK'],
      });
      await alert.present();

      // Revert status to pending if analysis fails
      await this.updateAnalysisStatus(analysis.id, 'failed');

      // Add error details to analysis document
      const errorDetails = error instanceof Error ? error.message : 'Unknown error';
      await this.updateAnalysisError(analysis.id, errorDetails);
    }
  }

  private async updateAnalysisStatus(analysisId: string, status: AnalysisStatus) {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) throw new Error('No authenticated user');

    const docRef = doc(this.firestore, `users/${user.uid}/analyses/${analysisId}`);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  }

  private async updateAnalysisResults(analysisId: string, results: any) {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) throw new Error('No authenticated user');

    const docRef = doc(this.firestore, `users/${user.uid}/analyses/${analysisId}`);
    await updateDoc(docRef, {
      status: 'completed',
      results,
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
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

  applyFilters() {
    // Implement filtering logic here
  }

  private async updateAnalysisError(analysisId: string, errorDetails: string) {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) throw new Error('No authenticated user');

    const docRef = doc(this.firestore, `users/${user.uid}/analyses/${analysisId}`);
    await updateDoc(docRef, {
      error: errorDetails,
      updatedAt: Timestamp.now(),
    });
  }
}
