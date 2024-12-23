import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadComponent } from '@rizzium/shared/ui/molecules';
import { Storage } from '@angular/fire/storage';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonText,
  IonIcon,
  IonProgressBar,
  IonBackButton,
  IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  checkmarkCircleOutline,
  shieldCheckmarkOutline,
  lockClosedOutline,
  serverOutline,
  timeOutline,
  arrowForwardOutline,
  helpCircleOutline,
  informationCircleOutline,
  arrowForward,
  informationCircle,
} from 'ionicons/icons';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    FileUploadComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonText,
    IonIcon,
    IonProgressBar,
    IonBackButton,
    IonButtons,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Document Upload</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Upload Document</ion-card-title>
          <ion-card-subtitle>Select a document for analysis</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <div class="upload-container" [class.uploading]="isUploading">
            <ui-file-upload
              #fileUploadComponent
              path="finescan-uploads"
              accept=".pdf,.doc,.docx,.txt"
              (progressChange)="onUploadProgress($event)"
              (urlGenerated)="onUrlGenerated($event)"
            ></ui-file-upload>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      ion-content {
        --padding-bottom: 60px; // Adjusted padding for footer
      }

      .upload-container {
        padding: 1rem;

        &.uploading {
          pointer-events: none;
          opacity: 0.7;
        }
      }

      .upload-area {
        border: 2px dashed var(--ion-color-medium);
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--ion-color-primary);
          background: var(--ion-color-light);
        }

        ion-icon {
          font-size: 3rem;
          color: var(--ion-color-medium);
          margin-bottom: 1rem;
        }

        h3 {
          margin: 0;
          color: var(--ion-color-dark);
          font-size: 1.2rem;
          font-weight: 500;
        }

        p {
          margin: 0.5rem 0 0;
          color: var(--ion-color-medium);
          font-size: 0.9rem;
        }
      }

      .upload-progress {
        margin-top: 1rem;

        ion-progress-bar {
          margin-bottom: 0.5rem;
        }

        p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--ion-color-primary);
        }
      }

      .upload-success {
        text-align: center;
        margin-top: 2rem;
        padding: 1rem;
        background: var(--ion-color-success-tint);
        border-radius: 8px;

        ion-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        h4 {
          margin: 0 0 1rem;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 1rem;
        }
      }

      @media (max-width: 576px) {
        .action-buttons {
          flex-direction: column;

          ion-button {
            width: 100%;
          }
        }
      }

      .security-notice {
        margin-bottom: 16px;
        border-left: 4px solid var(--ion-color-success);

        .security-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;

          ion-icon {
            font-size: 24px;
          }

          h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 500;
          }
        }

        .security-points {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .security-point {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;

          ion-icon {
            font-size: 18px;
          }
        }
      }
    `,
  ],
})
export class FileUploadPage {
  @ViewChild('fileUploadComponent') fileUploadComponent!: FileUploadComponent;

  lastUploadedUrl: string | null = null;
  isUploading = false;
  uploadProgress = 0;

  constructor(private storage: Storage, private router: Router, private alertController: AlertController) {
    addIcons({
      cloudUploadOutline,
      checkmarkCircleOutline,
      shieldCheckmarkOutline,
      lockClosedOutline,
      serverOutline,
      timeOutline,
      arrowForwardOutline,
      helpCircleOutline,
      informationCircleOutline,
      arrowForward,
      informationCircle,
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files?.length) {
      const file = files[0];
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (allowedTypes.includes(fileExtension)) {
        this.fileUploadComponent.uploadFile(file);
      }
    }
  }

  onUploadProgress(progress: number) {
    this.isUploading = progress < 1;
    this.uploadProgress = progress;
  }

  onUrlGenerated(url: string) {
    this.lastUploadedUrl = url;
    this.isUploading = false;
    this.uploadProgress = 0;
  }

  viewDocument() {
    if (this.lastUploadedUrl) {
      window.open(this.lastUploadedUrl, '_blank');
    }
  }

  startAnalysis() {
    this.router.navigate(['/reports']);
  }

  triggerFileUpload() {
    if (this.fileUploadComponent) {
      this.fileUploadComponent.openFileDialog(); // Assuming this method exists in FileUploadComponent
    }
  }

  async showPrivacyDetails() {
    const alert = await this.alertController.create({
      header: 'Security & Privacy Details',
      message: `
        <div class="privacy-details">
          <h3>How We Protect Your Data</h3>
          <ul>
            <li>Documents are encrypted during upload and storage</li>
            <li>Access is restricted to your account only</li>
            <li>Data is stored in secure Firebase servers</li>
            <li>Automatic deletion after 30 days</li>
          </ul>

          <h3>Your Rights</h3>
          <ul>
            <li>Request data deletion at any time</li>
            <li>Download your documents</li>
            <li>View access logs</li>
          </ul>
        </div>
      `,
      cssClass: 'privacy-alert',
      buttons: ['Got It'],
    });

    await alert.present();
  }
}
