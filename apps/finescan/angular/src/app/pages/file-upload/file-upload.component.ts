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
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject, StorageError } from '@angular/fire/storage';
import { Firestore, collection, doc, setDoc, getDoc, updateDoc, FirestoreError } from '@angular/fire/firestore';
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

  private async ensureUsageDocument(userId: string): Promise<void> {
    const usageRef = doc(this.firestore, `users/${userId}/usage/current`);
    const usageDoc = await getDoc(usageRef);

    if (!usageDoc.exists()) {
      await setDoc(usageRef, {
        scansUsed: 0,
        scansLimit: 3,
        storageUsed: 0,
        storageLimit: 50 * 1024 * 1024, // 50MB trial storage
        retentionDays: 7,
        lastResetDate: Timestamp.now(),
        tier: 'free' as const,
      });
    } else if (!usageDoc.data()?.['tier']) {
      await updateDoc(usageRef, {
        tier: 'free' as const,
      });
    }
  }

  private async uploadFileToStorage(file: File, userId: string): Promise<{ downloadURL: string; filePath: string }> {
    const filePath = `users/${userId}/finescan-uploads/${Date.now()}_${file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '')}`;
    const fileRef = ref(this.storage, filePath);

    const uploadTask = uploadBytesResumable(fileRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        originalName: file.name,
      },
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          this.uploadProgress.set(progress);
        },
        (error) => {
          console.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ downloadURL, filePath });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
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

      // Step 1: Ensure usage document exists
      await this.ensureUsageDocument(user.uid);

      // Step 2: Check if we can proceed with the upload
      const canProceed = await this.analysisService.checkUsageLimits(user.uid);
      if (!canProceed) {
        this.error.set('Upload failed: Usage limit reached. Please upgrade your plan to continue.');
        return;
      }

      // Step 3: Upload file to storage
      let uploadResult;
      try {
        uploadResult = await this.uploadFileToStorage(file, user.uid);
      } catch (error) {
        const storageError = error as StorageError;
        this.error.set(
          storageError.code === 'storage/unauthorized'
            ? 'Upload failed: Storage quota exceeded. Please upgrade your plan.'
            : `Upload failed: ${storageError.message}`
        );
        this.uploadProgress.set(0);
        return;
      }

      // Step 4: First update the usage document
      try {
        const usageRef = doc(this.firestore, `users/${user.uid}/usage/current`);
        const usageDoc = await getDoc(usageRef);

        if (!usageDoc.exists()) {
          throw new Error('Usage document not found');
        }

        const usage = usageDoc.data();
        const newStorageUsed = usage['storageUsed'] + file.size;
        const newScansUsed = usage['scansUsed'] + 1;

        if (newStorageUsed > usage['storageLimit'] || newScansUsed > usage['scansLimit']) {
          // If usage would exceed limits, clean up the uploaded file
          const fileRef = ref(this.storage, uploadResult.filePath);
          await deleteObject(fileRef);
          throw new Error('Usage limit exceeded');
        }

        await updateDoc(usageRef, {
          storageUsed: newStorageUsed,
          scansUsed: newScansUsed,
        });

        // Step 5: Then create the analysis document
        const analysisRef = doc(collection(this.firestore, `users/${user.uid}/analyses`));
        await setDoc(analysisRef, {
          fileName: file.name,
          fileUrl: uploadResult.downloadURL,
          filePath: uploadResult.filePath,
          fileType: file.type,
          fileSize: file.size,
          createdAt: Timestamp.now(),
          status: 'pending',
          userId: user.uid,
        });

        // Success - reset UI and navigate
        this.selectedFile.set(null);
        this.uploadProgress.set(0);
        this.error.set('');
        await this.router.navigate(['/analysis']);
      } catch (error) {
        // If anything fails, clean up the uploaded file
        const fileRef = ref(this.storage, uploadResult.filePath);
        await deleteObject(fileRef);

        // If it's a usage update error, we need to revert the usage update
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
          const usageRef = doc(this.firestore, `users/${user.uid}/usage/current`);
          const usageDoc = await getDoc(usageRef);
          if (usageDoc.exists()) {
            const usage = usageDoc.data();
            await updateDoc(usageRef, {
              storageUsed: usage['storageUsed'] - file.size,
              scansUsed: usage['scansUsed'] - 1,
            });
          }
        }

        const firestoreError = error as FirestoreError;
        this.error.set(`Upload failed: ${firestoreError.message}`);
        this.uploadProgress.set(0);
      }
    } catch (error) {
      const firestoreError = error as FirestoreError;
      this.error.set(`Upload failed: ${firestoreError.message}`);
      this.uploadProgress.set(0);
    }
  }
}
