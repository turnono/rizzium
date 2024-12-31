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
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Firestore, collection, doc, setDoc, getDoc, updateDoc } from '@angular/fire/firestore';
import { FirebaseAuthService, AnalysisService } from '@rizzium/shared/services';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, documentOutline, alertCircleOutline } from 'ionicons/icons';
import { Timestamp } from '@angular/fire/firestore';

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

      // Check if usage document exists and create if it doesn't
      const usageRef = doc(this.firestore, `users/${user.uid}/usage/current`);
      const usageDoc = await getDoc(usageRef);

      if (!usageDoc.exists()) {
        try {
          await setDoc(usageRef, {
            scansUsed: 0,
            scansLimit: 3,
            storageUsed: 0,
            storageLimit: 50 * 1024 * 1024, // 50MB trial storage
            retentionDays: 7,
            lastResetDate: Timestamp.now(),
            tier: 'free' as const,
          });
        } catch (error) {
          console.error('Failed to create usage document:', error);
          this.error.set('Failed to initialize usage tracking. Please try again.');
          return;
        }
      } else {
        // If the document exists but doesn't have the tier field, add it
        const usage = usageDoc.data();
        if (!usage?.['tier']) {
          try {
            await updateDoc(usageRef, {
              tier: 'free' as const,
            });
          } catch (error) {
            console.error('Failed to update usage document with tier:', error);
            this.error.set('Failed to update usage tracking. Please try again.');
            return;
          }
        }
      }

      // Check usage limits before proceeding
      const canProceed = await this.analysisService.startAnalysis(user.uid);
      if (!canProceed) {
        this.error.set('Upload failed: Usage limit reached. Please upgrade your plan to continue.');
        return;
      }

      // Create a reference to the file location
      const filePath = `users/${user.uid}/finescan-uploads/${Date.now()}_${file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, '')}`;
      const fileRef = ref(this.storage, filePath);

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
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          this.uploadProgress.set(progress);
        },
        (error) => {
          console.error('Upload failed:', error);
          this.error.set(
            error.code === 'storage/unauthorized'
              ? 'Upload failed: Storage quota exceeded. Please upgrade your plan.'
              : `Upload failed: ${error.message}`
          );
          this.uploadProgress.set(0);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

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
          } catch (error) {
            console.error('Post-upload error:', error);

            // If analysis document creation fails, clean up the uploaded file
            try {
              await deleteObject(fileRef);
            } catch (deleteError) {
              console.error('Failed to clean up uploaded file:', deleteError);
            }

            if (error.code === 'permission-denied') {
              this.error.set('Upload failed: Usage limit reached. Please upgrade your plan.');
            } else {
              this.error.set(`Upload failed: ${error.message}`);
            }
            this.uploadProgress.set(0);
          }
        }
      );
    } catch (error) {
      console.error('Upload process error:', error);
      this.error.set('Upload failed: ' + (error as Error).message);
      this.uploadProgress.set(0);
    }
  }
}
