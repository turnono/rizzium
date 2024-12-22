import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'];

@Component({
  selector: 'ui-file-upload',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="file-upload-container">
      <div class="upload-info">
        <ion-text color="medium">
          <p>Maximum file size: 5MB</p>
          <p>Accepted formats: PDF, Text, JPEG, PNG</p>
        </ion-text>
      </div>

      <ion-button (click)="fileInput.click()" [disabled]="isUploading">
        <ion-icon name="cloud-upload-outline" slot="start"></ion-icon>
        Select File
      </ion-button>

      <input #fileInput type="file" (change)="onFileSelected($event)" [accept]="accept" style="display: none" />

      @if (selectedFile) {
      <div class="file-info">
        <ion-chip>
          <ion-icon name="document-outline"></ion-icon>
          <ion-label>{{ selectedFile.name }}</ion-label>
          <ion-icon name="close-circle" (click)="clearFile()"></ion-icon>
        </ion-chip>
      </div>
      } @if (isUploading) {
      <div class="upload-progress">
        <ion-progress-bar [value]="uploadProgress"></ion-progress-bar>
        <ion-text color="medium"> Uploading: {{ uploadProgress | percent }} </ion-text>
      </div>
      } @if (errorMessage) {
      <ion-item color="danger" lines="none">
        <ion-icon name="alert-circle" slot="start"></ion-icon>
        <ion-label>{{ errorMessage }}</ion-label>
      </ion-item>
      } @if (downloadUrl) {
      <div class="success-message">
        <ion-item color="success" lines="none">
          <ion-icon name="checkmark-circle" slot="start"></ion-icon>
          <ion-label>File uploaded successfully!</ion-label>
        </ion-item>
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

      .upload-info {
        background: var(--ion-color-light);
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;

        p {
          margin: 0.25rem 0;
          font-size: 0.9rem;
        }
      }

      .file-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .upload-progress {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .success-message {
        margin-top: 1rem;
      }

      ion-chip {
        --background: var(--ion-color-light);
      }
    `,
  ],
})
export class FileUploadComponent {
  private storage = inject(Storage);

  @Input() path = 'uploads';
  @Input() accept = 'application/pdf,text/plain,image/jpeg,image/png';
  @Output() urlGenerated = new EventEmitter<string>();
  @Output() validationError = new EventEmitter<string>();

  isUploading = false;
  uploadProgress = 0;
  downloadUrl = '';
  errorMessage = '';
  selectedFile: File | null = null;

  validateFile(file: File): string | null {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 5MB limit';
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only PDF, Text, JPEG, and PNG files are allowed';
    }

    return null;
  }

  clearFile() {
    this.selectedFile = null;
    this.errorMessage = '';
    this.downloadUrl = '';
  }

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedFile = file;
    this.errorMessage = '';
    this.downloadUrl = '';

    // Validate file
    const validationError = this.validateFile(file);
    if (validationError) {
      this.errorMessage = validationError;
      this.validationError.emit(validationError);
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    try {
      // Create a unique file name
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const storageRef = ref(this.storage, `${this.path}/${uniqueFileName}`);

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
          this.validationError.emit(this.errorMessage);
          this.isUploading = false;
        },
        async () => {
          try {
            this.downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            this.urlGenerated.emit(this.downloadUrl);
          } catch (error) {
            this.errorMessage = 'Failed to get download URL';
            this.validationError.emit(this.errorMessage);
          }
          this.isUploading = false;
        }
      );
    } catch (error) {
      this.errorMessage = 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error');
      this.validationError.emit(this.errorMessage);
      this.isUploading = false;
    }
  }
}
