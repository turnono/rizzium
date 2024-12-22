import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'ui-file-upload',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="file-upload-container">
      <ion-button (click)="fileInput.click()" [disabled]="isUploading">
        <ion-icon name="cloud-upload-outline" slot="start"></ion-icon>
        Select File
      </ion-button>

      <input #fileInput type="file" (change)="onFileSelected($event)" [accept]="accept" style="display: none" />

      @if (isUploading) {
      <ion-progress-bar [value]="uploadProgress"></ion-progress-bar>
      <ion-text color="medium"> Uploading: {{ uploadProgress | percent }} </ion-text>
      } @if (errorMessage) {
      <ion-text color="danger">
        {{ errorMessage }}
      </ion-text>
      } @if (downloadUrl) {
      <div class="download-url-container">
        <ion-text color="success">File uploaded successfully!</ion-text>
        <ion-input readonly [value]="downloadUrl" fill="solid" label="Download URL"></ion-input>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .file-upload-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }

      .download-url-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      ion-progress-bar {
        margin: 0.5rem 0;
      }
    `,
  ],
})
export class FileUploadComponent {
  private storage = inject(Storage);

  @Input() path = 'uploads'; // Default upload path in Firebase Storage
  @Input() accept = '*/*'; // Default accept all file types
  @Output() urlGenerated = new EventEmitter<string>();

  isUploading = false;
  uploadProgress = 0;
  downloadUrl = '';
  errorMessage = '';

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploading = true;
    this.uploadProgress = 0;
    this.errorMessage = '';
    this.downloadUrl = '';

    try {
      // Create a storage reference
      const storageRef = ref(this.storage, `${this.path}/${Date.now()}_${file.name}`);

      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          this.uploadProgress = snapshot.bytesTransferred / snapshot.totalBytes;
        },
        (error) => {
          this.errorMessage = 'Upload failed: ' + error.message;
          this.isUploading = false;
        },
        async () => {
          // Upload completed successfully
          try {
            this.downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            this.urlGenerated.emit(this.downloadUrl);
          } catch (error) {
            this.errorMessage = 'Failed to get download URL';
          }
          this.isUploading = false;
        }
      );
    } catch (error) {
      this.errorMessage = 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error');
      this.isUploading = false;
    }
  }
}
