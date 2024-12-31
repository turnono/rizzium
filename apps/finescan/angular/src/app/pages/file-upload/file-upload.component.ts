import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonText,
  IonProgressBar,
  IonItem,
  IonLabel,
  IonToolbar,
  IonHeader,
  IonContent,
  IonTitle,
} from '@ionic/angular/standalone';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Firestore, collection, doc, setDoc } from '@angular/fire/firestore';
import { FirebaseAuthService, AnalysisService } from '@rizzium/shared/services';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, documentOutline, alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonIcon,
    IonText,
    IonProgressBar,
    IonItem,
    IonLabel,
    IonToolbar,
    IonHeader,
    IonContent,
    IonTitle,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Upload Document</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title class="ion-text-center">
            <ion-icon name="cloud-upload-outline" size="large"></ion-icon>
            <div>Upload Your Document</div>
          </ion-card-title>
        </ion-card-header>

        <ion-card-content>
          @if (!selectedFile()) {
          <ion-item lines="none" class="ion-text-center">
            <ion-label class="ion-text-wrap">
              <p>Supported formats: PDF, Word documents, and images (PNG, JPG)</p>
              <p>Maximum file size: 10MB</p>
            </ion-label>
          </ion-item>
          } @if (selectedFile()) {
          <ion-item lines="none">
            <ion-icon name="document-outline" slot="start"></ion-icon>
            <ion-label class="ion-text-wrap">
              {{ selectedFile()?.name }}
              <p>{{ (selectedFile()?.size || 0) / 1024 / 1024 | number : '1.0-1' }} MB</p>
            </ion-label>
          </ion-item>
          } @if (uploadProgress() > 0 && uploadProgress() < 100) {
          <ion-progress-bar [value]="uploadProgress() / 100"></ion-progress-bar>
          <ion-text color="medium" class="ion-text-center">
            <p>Uploading... {{ uploadProgress() }}%</p>
          </ion-text>
          } @if (error()) {
          <ion-item lines="none" color="danger">
            <ion-icon name="alert-circle-outline" slot="start"></ion-icon>
            <ion-label class="ion-text-wrap">{{ error() }}</ion-label>
          </ion-item>
          }

          <div class="ion-padding-top ion-text-center">
            <input
              type="file"
              (change)="onFileSelected($event)"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              style="display: none"
              #fileInput
            />

            <ion-button
              size="large"
              (click)="fileInput.click()"
              [disabled]="uploadProgress() > 0 && uploadProgress() < 100"
            >
              <ion-icon name="cloud-upload-outline" slot="start"></ion-icon>
              Choose File
            </ion-button>

            @if (selectedFile()) {
            <ion-button
              size="large"
              color="success"
              (click)="uploadFile()"
              [disabled]="uploadProgress() > 0 && uploadProgress() < 100"
            >
              <ion-icon name="cloud-upload-outline" slot="start"></ion-icon>
              Start Upload
            </ion-button>
            }
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
})
export class FileUploadComponent {
  private storage = inject(Storage);
  private firestore = inject(Firestore);
  private authService = inject(FirebaseAuthService);
  private analysisService = inject(AnalysisService);
  private router = inject(Router);

  selectedFile = signal<File | null>(null);
  uploadProgress = signal<number>(0);
  error = signal<string>('');

  constructor() {
    addIcons({ cloudUploadOutline, documentOutline, alertCircleOutline });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.error.set('File size exceeds 10MB limit');
        return;
      }
      this.selectedFile.set(file);
      this.error.set('');
    }
  }

  async uploadFile() {
    const file = this.selectedFile();
    if (!file) return;

    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        this.error.set('Upload failed: No authenticated user');
        return;
      }

      // Check usage limits before proceeding
      const canProceed = await this.analysisService.startAnalysis(user.uid);
      if (!canProceed) {
        this.error.set('Upload failed: Usage limit reached');
        return;
      }

      // Create a reference to the file location
      const filePath = `users/${user.uid}/finescan-uploads/${Date.now()}_${file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, '')}`;
      const fileRef = ref(this.storage, filePath);

      console.log('Storage reference created');

      // Upload the file with metadata
      const uploadTask = uploadBytesResumable(fileRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: user.uid,
          originalName: file.name,
        },
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Handle progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          this.uploadProgress.set(progress);
          console.log('Upload progress:', progress + '%');
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error('Upload failed:', error);
          this.error.set('Upload failed: ' + error.message);
          this.uploadProgress.set(0);
        },
        async () => {
          console.log('Upload completed, getting download URL...');
          // Handle successful uploads
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('Download URL obtained:', downloadURL);

          console.log('Creating analysis document...');
          // Add document reference to user's analyses collection
          const analysisRef = doc(collection(this.firestore, `users/${user.uid}/analyses`));
          await setDoc(analysisRef, {
            fileName: file.name,
            fileUrl: downloadURL,
            filePath: filePath,
            fileType: file.type,
            fileSize: file.size,
            createdAt: new Date(),
            status: 'pending',
            results: null,
          });

          // Navigate to reports page
          this.router.navigate(['/reports']);
        }
      );
    } catch (error) {
      console.error('Post-upload error:', error);
      this.error.set('Upload failed: ' + (error as Error).message);
      this.uploadProgress.set(0);
    }
  }
}
