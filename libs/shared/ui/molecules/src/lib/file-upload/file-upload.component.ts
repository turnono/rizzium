import { Component, EventEmitter, Input, Output, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Firestore, collection, addDoc, Timestamp } from '@angular/fire/firestore';
import { FirebaseAuthService } from '@rizzium/shared/services';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'];

@Component({
  selector: 'ui-file-upload',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="file-upload-container" data-cy="file-upload-page">
      <div class="upload-info">
        <ion-text color="medium">
          <p>Maximum file size: 5MB</p>
          <p>Accepted formats: PDF, Text, JPEG, PNG</p>
        </ion-text>
      </div>

      <button
        class="upload-area"
        (click)="triggerFileUpload()"
        (keydown.enter)="triggerFileUpload()"
        (keydown.space)="triggerFileUpload()"
        (dragover)="onDragOver($event)"
        (drop)="onDrop($event)"
        type="button"
        role="button"
        tabindex="0"
      >
        <ion-icon name="cloud-upload-outline" size="large"></ion-icon>
        <h3>Drag and drop or click to upload</h3>
        <p>Supported formats: PDF, DOC, DOCX, TXT</p>

        @if (isUploading) {
        <div class="upload-progress">
          <ion-progress-bar [value]="uploadProgress"></ion-progress-bar>
          <p>Uploading... {{ (uploadProgress * 100).toFixed(0) }}%</p>
        </div>
        }
      </button>

      @if (selectedFile && !uploadComplete) {
      <div class="file-info">
        <ion-chip>
          <ion-icon name="document-outline"></ion-icon>
          <ion-label>{{ selectedFile.name }}</ion-label>
          <ion-icon name="close-circle" (click)="clearFile()"></ion-icon>
        </ion-chip>
      </div>
      } @if (isUploading) {
      <div class="upload-progress" data-cy="upload-progress">
        <ion-progress-bar [value]="uploadProgress"></ion-progress-bar>
        <ion-text color="medium">Uploading: {{ uploadProgress | percent }}</ion-text>
      </div>
      } @if (uploadComplete) {
      <div data-cy="success-message" class="success-message">
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
        padding: 1rem;
      }
      .upload-info {
        margin-bottom: 1rem;
      }
      .file-info {
        margin: 1rem 0;
      }
      .upload-progress {
        margin: 1rem 0;
      }
      .error-message,
      .success-message {
        margin: 1rem 0;
      }
    `,
  ],
})
export class FileUploadComponent {
  private storage = inject(Storage);
  private ngZone = inject(NgZone);
  private firestore = inject(Firestore);
  private authService = inject(FirebaseAuthService);

  @Input() path = 'uploads';
  @Input() accept = 'application/pdf,text/plain,image/jpeg,image/png';
  @Output() urlGenerated = new EventEmitter<string>();
  @Output() validationError = new EventEmitter<string>();
  @Output() progressChange = new EventEmitter<number>();

  isUploading = false;
  uploadProgress = 0;
  uploadComplete = false;
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
    this.uploadProgress = 0;
    this.isUploading = false;
    this.uploadComplete = false;
  }

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.clearFile();
    this.selectedFile = file;

    const validationError = this.validateFile(file);
    if (validationError) {
      this.errorMessage = validationError;
      this.validationError.emit(validationError);
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadComplete = false;

    try {
      const user = await this.authService.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const storageRef = ref(this.storage, `users/${user.uid}/${this.path}/${uniqueFileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          this.ngZone.run(() => {
            const progress = snapshot.bytesTransferred / snapshot.totalBytes;
            this.uploadProgress = progress;
            this.progressChange.emit(progress);
          });
        },
        (error) => {
          this.ngZone.run(() => {
            this.errorMessage = 'Upload failed: ' + error.message;
            this.validationError.emit(this.errorMessage);
            this.isUploading = false;
            this.uploadComplete = false;
          });
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            this.ngZone.run(() => {
              this.downloadUrl = url;
              this.urlGenerated.emit(this.downloadUrl);
              this.isUploading = false;
              this.uploadComplete = true;
              this.uploadProgress = 0;

              // Clear the file input to allow new uploads
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) {
                fileInput.value = '';
              }
            });
          } catch (error) {
            this.ngZone.run(() => {
              this.errorMessage = 'Failed to get download URL';
              this.validationError.emit(this.errorMessage);
              this.isUploading = false;
              this.uploadComplete = false;
            });
          }
        }
      );

      // After successful upload, create an analysis document
      const analysisRef = collection(this.firestore, `users/${user.uid}/analyses`);
      await addDoc(analysisRef, {
        userId: user.uid,
        fileName: file.name,
        fileUrl: this.downloadUrl,
        status: 'uploaded',
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      this.errorMessage = 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error');
      this.validationError.emit(this.errorMessage);
      this.isUploading = false;
      this.uploadComplete = false;
    }
  }

  openFileDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = this.accept;
    input.multiple = false;

    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files?.length) {
        this.handleFileSelection(files[0]);
      }
    };

    input.click();
  }

  private handleFileSelection(file: File) {
    // Your existing file upload logic
  }

  uploadFile(file: File) {
    const input = this.fileInput.nativeElement as HTMLInputElement;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    this.onFileSelected({ target: input } as unknown as Event);
  }
}
