import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AnalysisService, FirebaseAuthService, UsageLimitService } from '@rizzium/shared/services';
import { Analysis, AnalysisStatus, CloudFunctionResponse } from '@rizzium/shared/interfaces';
import { AnalysisResultsComponent } from '@rizzium/shared/ui/molecules';
import { FooterComponent } from '@rizzium/shared/ui/organisms';
import { ModalController, ToastController } from '@ionic/angular/standalone';
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
  documentOutline,
} from 'ionicons/icons';
import { Firestore, Timestamp, updateDoc, doc } from '@angular/fire/firestore';
import { getFunctions, httpsCallable } from '@angular/fire/functions';
import { firstValueFrom } from 'rxjs';

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
            <div class="list-hint">
              <ion-item lines="none" color="light">
                <ion-icon name="information-circle" slot="start"></ion-icon>
                <ion-label>Click on any document to view details or start analysis</ion-label>
              </ion-item>
            </div>
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

      ::ng-deep .alert-wrapper {
        border: 2px solid var(--ion-color-primary);
        border-radius: 8px;
      }

      ::ng-deep .alert-wrapper.alert-warning {
        border-color: var(--ion-color-warning);
      }

      ::ng-deep .alert-wrapper.alert-danger {
        border-color: var(--ion-color-danger);
      }

      ::ng-deep .alert-wrapper.alert-success {
        border-color: var(--ion-color-success);
      }

      ::ng-deep .alert-head {
        border-bottom: 1px solid var(--ion-color-light-shade);
        padding-bottom: 8px !important;
      }

      ::ng-deep .alert-message {
        color: var(--ion-color-dark) !important;
      }

      ::ng-deep .alert-button {
        color: var(--ion-color-primary) !important;
      }

      .list-hint {
        margin-bottom: 1rem;

        ion-item {
          --background: var(--ion-color-light);
          border-radius: 8px;

          ion-icon {
            color: var(--ion-color-primary);
          }

          ion-label {
            font-size: 0.9rem;
            color: var(--ion-color-medium);
          }
        }
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
  private usageLimitService = inject(UsageLimitService);

  analyses: Analysis[] = [];
  selectedAnalysis: Analysis | null = null;
  loading = true;
  showFilters = false;
  statusFilter = 'all';
  searchTerm = '';
  router = inject(Router);

  constructor(private toastCtrl: ToastController) {
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
      documentOutline,
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
    event.stopPropagation();

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
                cssClass: 'alert-danger',
              });
              await errorAlert.present();
            }
          },
        },
      ],
      cssClass: 'alert-warning',
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
        cssClass: 'alert-primary',
      });

      await alert.present();
    }
  }

  async startAnalysis(analysis: Analysis) {
    try {
      if (!analysis.fileUrl) {
        throw new Error('No file URL available for analysis');
      }

      // Check if user has reached their limit before showing confirmation
      const usageStatus = await this.usageLimitService.hasReachedLimit();
      if (usageStatus.hasReached) {
        // show toast
        const toast = await this.toastCtrl.create({
          message: 'You have reached your monthly scan limit. Upgrade to continue.',
          duration: 3000,
          color: 'danger',
          buttons: [
            {
              text: 'Upgrade',
              role: 'confirm',
              handler: () => {
                this.router.navigate(['/pricing']);
              },
            },
          ],
        });
        await toast.present();
        return;
      }

      // Show confirmation dialog with usage information
      const alert = await this.alertController.create({
        header: 'Start Analysis',
        message: `This will use one of your monthly scans (${usageStatus.scansUsed}/${usageStatus.scansLimit} used). Do you want to proceed?`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Proceed',
            role: 'confirm',
          },
        ],
        cssClass: 'alert-warning',
      });

      await alert.present();
      const { role } = await alert.onDidDismiss();

      if (role === 'confirm') {
        // Increment scan count only when user confirms analysis
        const success = await this.usageLimitService.incrementScanCount();
        if (!success) {
          return;
        }

        // Update status to processing
        await this.updateAnalysisStatus(analysis.id, 'processing');

        // Get the analyze function
        const analyzeDocument = httpsCallable<{ imageUrl: string }, CloudFunctionResponse>(
          this.functions,
          'analyzeDocument'
        );

        try {
          // Call the analyze function with the correct parameter name
          const result = await analyzeDocument({ imageUrl: analysis.fileUrl });
          console.log('Analysis response:', result);

          // Check the response structure
          if (!result?.data?.analysis) {
            console.error('Invalid response structure:', result);
            throw new Error('No analysis results received');
          }

          // Transform the response to match our interface
          const analysisResults: Analysis['results'] = {
            success: result.data.success,
            analysis: result.data.analysis,
          };

          // Update the analysis with results
          await this.updateAnalysisResults(analysis.id, analysisResults);

          // Update status to completed
          await this.updateAnalysisStatus(analysis.id, 'completed');

          const toast = await this.toastCtrl.create({
            message: 'Analysis completed successfully',
            duration: 2000,
            color: 'success',
          });
          await toast.present();
        } catch (error) {
          console.error('Analysis failed:', error);
          await this.updateAnalysisStatus(analysis.id, 'failed');
          await this.updateAnalysisError(
            analysis.id,
            error instanceof Error ? error.message : 'Unknown error occurred'
          );

          const toast = await this.toastCtrl.create({
            message: 'Analysis failed. Please try again.',
            duration: 3000,
            color: 'danger',
          });
          await toast.present();
        }
      }
    } catch (error) {
      console.error('Error starting analysis:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to start analysis. Please try again.',
        buttons: ['OK'],
        cssClass: 'alert-danger',
      });
      await alert.present();
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

  private async updateAnalysisResults(analysisId: string, results: Analysis['results']) {
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

  getAnalysisResults(analysis: Analysis): Analysis['results'] | null {
    if (!analysis?.results?.analysis) return null;
    return analysis.results;
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
