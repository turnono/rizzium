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
} from '@ionic/angular/standalone';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Firestore, collection, doc, setDoc } from '@angular/fire/firestore';
import { FirebaseAuthService, AnalysisService } from '@rizzium/shared/services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonText],
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-title>Upload Document</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <input type="file" (change)="onFileSelected($event)" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
        <ion-button (click)="uploadFile()" [disabled]="!selectedFile()">Upload</ion-button>
      </ion-card-content>
    </ion-card>
  `,
})
export class FileUploadComponent {
  private storage = inject(Storage);
  private firestore = inject(Firestore);
  private authService = inject(FirebaseAuthService);
  private analysisService = inject(AnalysisService);
  private router = inject(Router);

  selectedFile = signal<File | null>(null);

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  async uploadFile() {
    const file = this.selectedFile();
    if (!file) return;

    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        console.error('Upload failed: No authenticated user');
        return;
      }

      // Check usage limits before proceeding
      const canProceed = await this.analysisService.startAnalysis(user.uid);
      if (!canProceed) {
        console.error('Upload failed: Usage limit reached');
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
          console.log('Upload progress:', progress + '%');
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error('Upload failed:', error);
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
    }
  }
}
