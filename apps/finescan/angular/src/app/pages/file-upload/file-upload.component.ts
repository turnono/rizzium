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
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { FirebaseAuthService } from '@rizzium/shared/services';
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
        <input type="file" (change)="onFileSelected($event)" accept=".pdf,.doc,.docx" />
        <ion-button (click)="uploadFile()" [disabled]="!selectedFile()">Upload</ion-button>
      </ion-card-content>
    </ion-card>
  `,
})
export class FileUploadComponent {
  private storage = inject(Storage);
  private firestore = inject(Firestore);
  private authService = inject(FirebaseAuthService);
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

      // Create a reference to the file location
      const filePath = `uploads/${user.uid}/${Date.now()}_${file.name}`;
      const fileRef = ref(this.storage, filePath);

      // Upload the file
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Handle progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error('Upload failed:', error);
        },
        async () => {
          // Handle successful uploads
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('File available at', downloadURL);

          // Add document reference to Firestore
          await addDoc(collection(this.firestore, 'documents'), {
            userId: user.uid,
            fileName: file.name,
            fileUrl: downloadURL,
            uploadDate: new Date(),
            status: 'pending',
          });

          // Navigate to reports page
          this.router.navigate(['/reports']);
        }
      );
    } catch (error) {
      console.error('Error during upload:', error);
    }
  }
}
