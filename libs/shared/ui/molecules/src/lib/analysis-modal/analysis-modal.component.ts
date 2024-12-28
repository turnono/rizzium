import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  ModalController,
  AlertController,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { AnalysisResultsComponent } from '../analysis-results/analysis-results.component';
import { Analysis } from '@rizzium/shared/interfaces';
import { addIcons } from 'ionicons';
import { closeOutline, alertCircleOutline, refreshOutline } from 'ionicons/icons';

@Component({
  selector: 'ui-analysis-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    AnalysisResultsComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Analysis Details</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (analysis.status === 'failed') {
      <ion-card color="danger">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="alert-circle-outline"></ion-icon>
            Analysis Failed
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>{{ analysis.error || 'An error occurred during analysis' }}</p>
          <ion-button expand="block" (click)="retryAnalysis()" class="retry-button">
            <ion-icon name="refresh-outline" slot="start"></ion-icon>
            Retry Analysis
          </ion-button>
        </ion-card-content>
      </ion-card>
      } @else if (!this.analysis?.results?.analysis) {
      <ion-card color="warning">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="alert-circle-outline"></ion-icon>
            Unable to Analyze Image
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>We were unable to analyze this image. This could be because:</p>
          <ul>
            <li>The image format is not supported</li>
            <li>The image quality is too low</li>
            <li>The content is not what we expected</li>
          </ul>
          <p>File name: {{ analysis.fileName }}</p>
          <ion-button expand="block" (click)="retryAnalysis()" class="retry-button">
            <ion-icon name="refresh-outline" slot="start"></ion-icon>
            Try Again
          </ion-button>
        </ion-card-content>
      </ion-card>
      } @else {
      <ui-analysis-results [analysis]="analysisResults"></ui-analysis-results>
      }
    </ion-content>
  `,
  styles: [
    `
      :host {
        height: 100%;
      }

      ion-card {
        margin: 16px;
      }

      ion-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .retry-button {
        margin-top: 16px;
      }
    `,
  ],
})
export class AnalysisModalComponent {
  @Input() analysis!: Analysis;

  constructor(private modalCtrl: ModalController, private alertController: AlertController) {
    addIcons({
      closeOutline,
      alertCircleOutline,
      refreshOutline,
    });
  }

  get analysisResults() {
    if (!this.analysis?.results?.analysis) return null;

    return {
      text: this.analysis.fileName,
      flags: (this.analysis.results.analysis.flags || []).map((flag) => ({
        ...flag,
        riskLevel: (flag.riskLevel || 'low').toLowerCase() as 'high' | 'medium' | 'low',
      })),
      summary: {
        riskLevel: (this.analysis.results.analysis.summary?.riskLevel || 'low').toLowerCase() as
          | 'high'
          | 'medium'
          | 'low',
        description: this.analysis.results.analysis.summary?.description || 'No description available',
        recommendations: this.analysis.results.analysis.summary?.recommendations || [],
      },
    };
  }

  async retryAnalysis() {
    const alert = await this.alertController.create({
      header: 'Retry Analysis',
      message: 'Would you like to try analyzing this document again?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Retry',
          handler: () => {
            this.modalCtrl.dismiss({ retry: true });
          },
        },
      ],
    });

    await alert.present();
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
