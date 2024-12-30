import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AnalysisService, FirebaseAuthService } from '@rizzium/shared/services';
import { Analysis, AnalysisStatus } from '@rizzium/shared/interfaces';
import { AnalysisResultsComponent } from '@rizzium/shared/ui/molecules';
import { FooterComponent } from '@rizzium/shared/ui/organisms';
import { ModalController } from '@ionic/angular/standalone';
import { AnalysisModalComponent } from '@rizzium/shared/ui/molecules';

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
  IonGrid,
  IonRow,
  IonCol,
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
  playOutline,
  refreshOutline,
  trashOutline,
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

interface AnalysisResult {
  text: string;
  flags: Array<{
    start: number;
    end: number;
    reason: string;
    riskLevel: 'high' | 'medium' | 'low';
  }>;
  summary: {
    riskLevel: 'high' | 'medium' | 'low';
    description: string;
    recommendations: string[];
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
    IonGrid,
    IonRow,
    IonCol,
    AnalysisModalComponent,
    FooterComponent,
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
      <ion-grid>
        <ion-row>
          <ion-col size="12">
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
                  <ion-badge [color]="getRiskColor(analysis.results?.analysis?.summary?.riskLevel)">
                    {{ analysis.results?.analysis?.summary?.riskLevel | uppercase }}
                  </ion-badge>
                  }
                </ion-label>
                <ion-button slot="end" fill="clear" color="danger" (click)="deleteAnalysis($event, analysis)">
                  <ion-icon name="trash-outline"></ion-icon>
                </ion-button>
              </ion-item>
              }
            </ion-list>
            }
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
    <rizzium-footer [appName]="'finescan'"></rizzium-footer>
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

      .processing-state {
        text-align: center;
        padding: 2rem;

        ion-spinner {
          margin-bottom: 1rem;
        }

        h3 {
          margin: 0;
          color: var(--ion-color-dark);
        }

        p {
          margin: 0.5rem 0 0;
          color: var(--ion-color-medium);
        }
      }

      .retry-button {
        margin-top: 1rem;
      }

      @media (min-width: 768px) {
        ion-grid {
          height: 100%;
        }

        ion-row {
          height: 100%;
        }

        ion-col {
          height: 100%;
          overflow-y: auto;
        }
      }

      .selected {
        --background: var(--ion-color-light-shade);
      }
    `,
  ],
})
export class ReportsPageComponent implements OnInit {
  private firestore = inject(Firestore);
  private alertController = inject(AlertController);
  private functions = getFunctions();
  private authService = inject(FirebaseAuthService);
  private modalCtrl = inject(ModalController);
  private analysisService = inject(AnalysisService);

  analyses: Analysis[] = [];
  selectedAnalysis: Analysis | null = null;
  loading = true;
  showFilters = false;
  statusFilter = 'all';
  searchTerm = '';

  constructor() {
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
      playOutline,
      refreshOutline,
      trashOutline,
    });
  }

  ngOnInit() {
    this.analysisService.getUserAnalyses().subscribe(
      (analyses) => {
        this.analyses = analyses;
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching analyses:', error);
        this.loading = false;
      }
    );
  }

  async deleteAnalysis(event: Event, analysis: Analysis) {
    event.stopPropagation(); // Prevent item click when clicking delete button

    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete the analysis for "${analysis.fileName}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await this.analysisService.deleteAnalysis(analysis.id);
            } catch (error) {
              console.error('Error deleting analysis:', error);
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message: 'Failed to delete the analysis. Please try again.',
                buttons: ['OK'],
              });
              await errorAlert.present();
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async selectAnalysis(analysis: Analysis) {
    if (analysis.status === 'completed' || analysis.status === 'failed') {
      const modal = await this.modalCtrl.create({
        component: AnalysisModalComponent,
        componentProps: {
          analysis,
        },
        breakpoints: [0, 0.5, 0.75, 1],
        initialBreakpoint: 0.75,
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();
      if (data?.retry) {
        this.startAnalysis(analysis);
      }
      return;
    }

    this.selectedAnalysis = analysis;

    if (analysis.status === 'pending' || analysis.status === 'uploaded') {
      const alert = await this.alertController.create({
        header: 'Start Analysis',
        message: 'Would you like to start analyzing this document?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Start',
            handler: () => {
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

      // Check usage limits and increment usage
      const canProceed = await this.analysisService.startAnalysis(analysis.id);
      if (!canProceed) {
        console.log('Analysis blocked: Usage limit reached');
        return;
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

  private async updateAnalysisResults(analysisId: string, results: AnalysisResponse['data']) {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) throw new Error('No authenticated user');

    const docRef = doc(this.firestore, `users/${user.uid}/analyses/${analysisId}`);
    await updateDoc(docRef, {
      status: 'completed',
      results: {
        analysis: results,
      },
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

  getRiskColor(risk: string | undefined): string {
    switch (risk?.toLowerCase()) {
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

  getAnalysisResults(analysis: Analysis): AnalysisResult | null {
    if (!analysis?.results?.analysis) return null;

    return {
      text: analysis.fileName,
      flags: (analysis.results.analysis.flags || []).map((flag) => ({
        ...flag,
        riskLevel: flag.riskLevel.toLowerCase() as 'high' | 'medium' | 'low',
      })),
      summary: {
        riskLevel: analysis.results.analysis.summary.riskLevel.toLowerCase() as 'high' | 'medium' | 'low',
        description: analysis.results.analysis.summary.description,
        recommendations: analysis.results.analysis.summary.recommendations,
      },
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
