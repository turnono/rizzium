import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import {
  IonButton,
  IonIcon,
  IonProgressBar,
  IonText,
  IonCard,
  IonCardContent,
  IonChip,
  IonLabel,
  IonItem,
  IonAccordionGroup,
  IonAccordion,
  IonList,
  Platform,
} from '@ionic/angular/standalone';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from '@angular/fire/storage';
import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  FirestoreError,
  setDoc,
} from '@angular/fire/firestore';
import { FirebaseAuthService, UsageLimitService } from '@rizzium/shared/services';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  documentOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  cloudUpload,
  lockClosedOutline,
  serverOutline,
  timeOutline,
  arrowForwardOutline,
  helpCircleOutline,
  alertCircle,
  warning,
  time,
  lockClosed,
  server,
  shieldCheckmark,
  arrowForward,
  checkmark,
  analyticsOutline,
  checkmarkCircle,
  imageOutline,
  documentTextOutline,
  document,
} from 'ionicons/icons';
import { DataSaverService } from '@rizzium/shared/services';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_TYPES = ['text/plain', 'image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'ui-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon,
    IonProgressBar,
    IonText,
    IonCard,
    IonCardContent,
    IonChip,
    IonLabel,
    IonItem,
    IonAccordionGroup,
    IonAccordion,
    IonList,
  ],
  template: `
    <div
      class="upload-container"
      [class.is-dragging]="isDragging"
      [class.is-uploading]="isUploading"
      role="region"
      aria-label="File upload section"
    >
      <input
        #fileInput
        type="file"
        [accept]="accept"
        (change)="onFileSelected($event)"
        style="display: none"
        aria-hidden="true"
        data-cy="file-input"
      />

      <div
        class="upload-area"
        (click)="triggerFileUpload($event)"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        [class.is-dragging]="isDragging"
        role="button"
        tabindex="0"
        aria-label="Click or drag files here to upload"
        (keydown.enter)="triggerFileUpload($event)"
        (keydown.space)="triggerFileUpload($event)"
        data-cy="upload-area"
      >
        @if (!selectedFile && !isUploading && !errorMessage && !uploadComplete) {
        <div class="upload-content" role="status">
          <ion-icon name="cloud-upload-outline" size="large" class="upload-icon" aria-hidden="true"></ion-icon>
          <h2 class="visually-accessible" color="clear">Upload Document</h2>
          @if (isMobile) {
          <p>Tap here to upload a text file or image</p>
          } @if (!isMobile) {
          <p>Tap here or drag a text file or image to upload</p>
          }
          <div class="file-types" role="list" aria-label="Accepted file types">
            <ion-chip (click)="triggerFileUpload($event, '.txt')">
              <ion-icon name="document-text-outline" aria-hidden="true" size="small"></ion-icon>
              <ion-label>Text File (.txt)</ion-label>
            </ion-chip>
            <ion-chip (click)="triggerFileUpload($event, 'image/*')">
              <ion-icon name="image-outline" aria-hidden="true" size="small"></ion-icon>
              <ion-label>Image (JPG, PNG, WEBP)</ion-label>
            </ion-chip>
          </div>
          <div class="help-text" role="note">
            <ion-icon name="information-circle-outline" color="medium"></ion-icon>
            <span>Maximum file size: {{ formatFileSize(MAX_FILE_SIZE) }}</span>
          </div>
        </div>
        } @if (errorMessage) {
        <div class="error-container" role="alert">
          <ion-icon name="warning" color="danger" size="large"></ion-icon>
          <h3>Upload Failed</h3>
          <p>{{ errorMessage }}</p>
          <ion-button (click)="clearFile($event)" expand="block" color="primary"> Choose Different File </ion-button>
        </div>
        } @if (isUploading) {
        <div class="upload-progress" role="status" aria-live="polite">
          <ion-progress-bar
            [value]="uploadProgress"
            [color]="uploadProgress < 1 ? 'primary' : 'success'"
            aria-label="Upload progress"
            [attr.aria-valuenow]="uploadProgress * 100"
            aria-valuemin="0"
            aria-valuemax="100"
          ></ion-progress-bar>
          <div class="progress-info">
            <h3>Uploading... {{ (uploadProgress * 100).toFixed(0) }}%</h3>
            <p class="status-message">
              <ion-icon name="time"></ion-icon>
              Please keep this window open
            </p>
          </div>
        </div>
        } @if (selectedFile && !isUploading && !errorMessage && !uploadComplete) {
        <div class="upload-content">
          <ion-icon name="document-outline" class="file-icon"></ion-icon>
          <h3>{{ selectedFile.name }}</h3>
          <p class="file-info">
            <ion-icon name="information-circle"></ion-icon>
            {{ formatFileSize(selectedFile.size) }}
          </p>
          <ion-button
            (click)="startUpload($event)"
            expand="block"
            class="start-upload"
            [disabled]="isUploading || selectedFile.size > MAX_FILE_SIZE"
            [color]="selectedFile.size > MAX_FILE_SIZE ? 'danger' : 'primary'"
          >
            <ion-icon [name]="selectedFile.size > MAX_FILE_SIZE ? 'warning' : 'analytics-outline'"></ion-icon>
            {{ selectedFile.size > MAX_FILE_SIZE ? 'File Too Large' : 'Start Analysis' }}
          </ion-button>
          <ion-button (click)="clearFile($event)" fill="clear" color="medium"> Choose Different File </ion-button>
        </div>
        } @if (uploadComplete) {
        <div class="upload-success" role="status" aria-live="polite">
          <div class="success-icon">
            <ion-icon name="checkmark-circle" color="success"></ion-icon>
          </div>
          <div class="success-content">
            <h3>Upload Complete!</h3>
            <p class="file-info">
              <ion-icon name="information-circle"></ion-icon>
              {{ selectedFile ? formatFileSize(selectedFile.size) : '' }}
            </p>
            <ion-button
              (click)="$event.stopPropagation(); $event.preventDefault(); startAnalysis()"
              expand="block"
              color="primary"
            >
              <ion-icon name="analytics-outline" slot="start"></ion-icon>
              Start Analysis
            </ion-button>
          </div>
        </div>
        }
      </div>

      <!-- Security Notice Accordion -->
      <ion-accordion-group class="ion-no-padding ion-no-margin">
        <ion-accordion value="security">
          <ion-item slot="header" color="light">
            <ion-icon name="shield-checkmark" color="success" slot="start" class="ion-no-padding"></ion-icon>
            <ion-label>
              Your Privacy & Security
              <ion-text color="medium">
                <p class="subtitle">Click to learn more about our security measures</p>
              </ion-text>
            </ion-label>
          </ion-item>

          <div slot="content" class="security-content">
            <ion-list lines="none">
              <ion-item>
                <ion-icon name="lock-closed" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h3>End-to-end Encryption</h3>
                  <p>All documents are encrypted during transit and storage</p>
                </ion-label>
              </ion-item>

              <ion-item>
                <ion-icon name="server" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h3>Secure Cloud Storage</h3>
                  <p>Protected by Firebase's enterprise-grade security</p>
                </ion-label>
              </ion-item>

              <ion-item>
                <ion-icon name="time" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h3>Automatic Deletion</h3>
                  <p>Documents are automatically removed after 30 days</p>
                </ion-label>
              </ion-item>
            </ion-list>

            <ion-button fill="clear" size="small" (click)="showPrivacyDetails()">
              Learn More About Security
              <ion-icon name="arrow-forward" slot="end"></ion-icon>
            </ion-button>
          </div>
        </ion-accordion>
      </ion-accordion-group>
    </div>
  `,
  styles: [
    `
      .upload-container {
        // padding: 8px;
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
      }

      .upload-area {
        border: 2px dashed var(--ion-color-medium);
        border-radius: 12px;
        min-height: 200px;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        touch-action: none;
        background: rgba(var(--ion-color-light-rgb), 0.05);

        &:active {
          background: rgba(var(--ion-color-primary-rgb), 0.05);
        }
      }

      .upload-content {
        text-align: center;
        padding: 16px;
        width: 100%;

        // ion-icon {
        //   font-size: 2.5rem;
        //   margin-bottom: 8px;
        // }

        h2 {
          font-size: 1.2rem;
          margin: 0 0 8px;
        }

        h3 {
          font-size: 1rem;
          margin: 0 0 8px;
        }

        p {
          margin: 4px 0;
          font-size: 0.9rem;
        }
      }

      .file-types {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        margin: 16px 0;
      }

      .size-limit {
        font-size: 0.9rem;
        opacity: 0.7;
      }

      ion-progress-bar {
        margin: 12px 0;
        height: 4px;
        border-radius: 2px;
      }

      @media (min-width: 768px) {
        .upload-container {
          padding: 16px;
          max-width: 600px;
        }

        .upload-area {
          min-height: 300px;
        }

        .upload-content {
          padding: 24px;

          ion-icon {
            font-size: 3rem;
          }

          h2 {
            font-size: 1.5rem;
          }
        }
      }

      .file-info {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        color: var(--ion-color-medium);

        &.file-size-warning {
          color: var(--ion-color-warning);
        }

        .size-warning {
          font-style: italic;
          margin-left: 4px;
        }
      }

      .help-text {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        color: var(--ion-color-medium);
        margin-top: 8px;
      }

      .status-message {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--ion-color-medium);
        font-size: 14px;
        margin: 8px 0;

        ion-icon {
          font-size: 16px;
        }
      }

      .success-animation {
        animation: scaleIn 0.3s ease-out;

        ion-icon {
          font-size: 48px;
        }
      }

      .error-message {
        color: var(--ion-color-danger);
        font-weight: 500;
      }

      .error-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 16px;
      }

      .help-tooltip {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 8px;
        padding: 8px;
        background: rgba(var(--ion-color-light-rgb), 0.1);
        border-radius: 8px;
        font-size: 12px;
        color: var(--ion-color-medium);
        cursor: pointer;

        &:active {
          background: rgba(var(--ion-color-light-rgb), 0.2);
        }
      }

      @keyframes scaleIn {
        from {
          transform: scale(0.5);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      // Accessibility-focused styles
      .visually-accessible {
        font-size: var(--accessible-font-size, 1.2rem);
        font-weight: 500;
        color: var(--accessible-text-color, var(--ion-color-dark));
        margin-bottom: 1rem;
      }

      // High contrast mode styles
      @media (prefers-contrast: more) {
        .upload-area {
          border: 3px solid var(--ion-color-dark);
          background: var(--ion-color-light);
        }

        .upload-content {
          color: var(--ion-color-dark);
        }

        ion-progress-bar {
          --progress-background: var(--ion-color-dark);
          height: 8px;
        }

        .error-message {
          color: var(--ion-color-danger-shade);
          font-weight: bold;
        }
      }

      // Reduced motion preferences
      @media (prefers-reduced-motion: reduce) {
        .success-animation {
          animation: none;
        }

        * {
          transition: none !important;
        }
      }

      // Focus indicators
      .upload-area:focus {
        outline: 3px solid var(--ion-color-primary);
        outline-offset: 2px;
      }

      // Large text support
      @media (prefers-reduced-motion: no-preference) {
        :root {
          --accessible-font-size: 1.4rem;
        }
      }

      // Screen reader only text
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      }

      .upload-success {
        // background: var(--ion-color-success-tint);
        border-radius: 16px;
        padding: 24px;
        text-align: center;
        animation: fadeIn 0.3s ease-out;
      }

      .success-icon {
        margin-bottom: 16px;

        ion-icon {
          font-size: 48px;
          animation: scaleIn 0.3s ease-out;
        }
      }

      .success-content {
        h3 {
          color: var(--ion-color-success-shade);
          font-size: 20px;
          margin: 0 0 8px;
          font-weight: 600;
        }

        .file-name {
          color: var(--ion-color-medium);
          font-size: 14px;
          margin: 0 0 20px;
          word-break: break-word;
        }
      }

      .success-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;

        ion-button {
          min-width: 140px;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes scaleIn {
        from {
          transform: scale(0.5);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      @media (max-width: 480px) {
        .success-actions {
          flex-direction: column;

          ion-button {
            width: 100%;
          }
        }
      }

      ion-accordion-group {
        margin-bottom: 16px;
      }

      ion-accordion {
        background: var(--ion-color-light);
        border-radius: 8px;
        overflow: hidden;

        ion-item {
          --padding-start: 16px;
          --inner-padding-end: 16px;

          &::part(native) {
            border-radius: 8px;
          }
        }
      }

      .subtitle {
        font-size: 12px;
        margin-top: 4px;
      }

      .security-content {
        padding: 8px 16px 16px;

        ion-list {
          background: transparent;
          padding: 0;
          margin-bottom: 16px;

          ion-item {
            --background: transparent;
            --padding-start: 8px;
            margin-bottom: 8px;

            h3 {
              font-size: 14px;
              font-weight: 500;
              margin: 0;
            }

            p {
              font-size: 12px;
              color: var(--ion-color-medium);
              margin: 4px 0 0;
            }

            ion-icon {
              font-size: 20px;
              margin-right: 16px;
            }
          }
        }

        ion-button {
          margin: 0;
          height: 36px;
          font-size: 12px;
        }
      }

      .error-container {
        text-align: center;
        padding: 24px;

        ion-icon {
          font-size: 48px;
          margin-bottom: 16px;
          color: var(--ion-color-danger);
        }

        h3 {
          color: var(--ion-color-danger);
          font-size: 18px;
          margin: 0 0 8px;
          font-weight: 500;
        }

        p {
          color: var(--ion-color-medium);
          margin: 0 0 24px;
          font-size: 14px;
          line-height: 1.4;
        }

        ion-button {
          max-width: 200px;
          margin: 0 auto;
        }
      }

      .upload-progress {
        padding: 24px;
        text-align: center;

        ion-progress-bar {
          height: 8px;
          border-radius: 4px;
          margin-bottom: 16px;
          --progress-background: var(--ion-color-primary);
        }

        .progress-info {
          h3 {
            color: var(--ion-color-dark);
            font-size: 16px;
            margin: 0 0 8px;
            font-weight: 500;
          }

          .status-message {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: var(--ion-color-medium);
            font-size: 14px;
            margin: 0;

            ion-icon {
              font-size: 16px;
            }
          }
        }
      }

      .upload-success {
        text-align: center;
        padding: 24px;

        .success-icon {
          margin-bottom: 16px;

          ion-icon {
            font-size: 48px;
          }
        }

        .success-content {
          h3 {
            color: var(--ion-color-success);
            font-size: 18px;
            margin: 0 0 16px;
            font-weight: 500;
          }

          .file-info {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: var(--ion-color-medium);
            font-size: 14px;
            margin: 0 0 24px;
          }

          ion-button {
            max-width: 200px;
            margin: 0 auto;
          }
        }
      }
    `,
  ],
})
export class FileUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  private storage = inject(Storage);
  private ngZone = inject(NgZone);
  private firestore = inject(Firestore);
  private authService = inject(FirebaseAuthService);
  private dataSaverService = inject(DataSaverService);
  private alertController = inject(AlertController);
  private router = inject(Router);
  private platform = inject(Platform);
  private usageLimitService = inject(UsageLimitService);
  private document = inject(DOCUMENT);

  @Input() path = 'uploads';
  @Input() accept = '.txt,image/jpeg,image/png,image/webp';
  @Output() urlGenerated = new EventEmitter<string>();
  @Output() validationError = new EventEmitter<string>();
  @Output() progressChange = new EventEmitter<number>();

  isDragging = false;
  isUploading = false;
  uploadProgress = 0;
  uploadComplete = false;
  downloadUrl = '';
  errorMessage = '';
  selectedFile: File | null = null;
  needsHelp = false;
  lastUploadedUrl: string | null = null;

  readonly MAX_FILE_SIZE = MAX_FILE_SIZE;

  constructor() {
    addIcons({
      cloudUploadOutline,
      documentOutline,
      closeCircleOutline,
      checkmarkCircleOutline,
      informationCircleOutline,
      cloudUpload,
      lockClosedOutline,
      serverOutline,
      timeOutline,
      arrowForwardOutline,
      helpCircleOutline,
      alertCircle,
      warning,
      time,
      lockClosed,
      server,
      shieldCheckmark,
      arrowForward,
      checkmark,
      analyticsOutline,
      checkmarkCircle,
      imageOutline,
      documentTextOutline,
      document,
    });
  }

  get isMobile(): boolean {
    return this.platform.is('mobile') || this.platform.is('android') || this.platform.is('ios');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  validateFile(file: File): string | null {
    if (!file) return 'No file selected';

    if (file.size === 0) {
      return 'File is empty. Please choose a file with content.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File size (${this.formatFileSize(file.size)}) exceeds the ${this.formatFileSize(MAX_FILE_SIZE)} limit`;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Only text files and images (JPG, PNG, WEBP) are supported`;
    }

    return null;
  }

  clearFile(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.isUploading) return;

    this.selectedFile = null;
    this.errorMessage = '';
    this.uploadProgress = 0;
    this.uploadComplete = false;
    this.isUploading = false;
    this.downloadUrl = '';
    this.isDragging = false;
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  async onFileSelected(event: Event) {
    console.log('onFileSelected triggered');
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    this.clearFile(event);
    console.log('Previous file state cleared');

    this.selectedFile = file;
    console.log('New file set as selectedFile');

    const validationError = this.validateFile(file);
    if (validationError) {
      console.log('File validation failed:', validationError);
      this.errorMessage = validationError;
      this.validationError.emit(validationError);
      return;
    }
    console.log('File validation passed');

    try {
      console.log('Getting current user...');
      const user = await this.authService.getCurrentUser();
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('No authenticated user');
      }
      console.log('User authenticated:', user.uid);

      // Check usage limits before proceeding with upload
      console.log('Checking usage limits...');
      const canProceed = await this.usageLimitService.checkAndIncrementUsage();
      console.log('Usage limit check result:', canProceed);

      if (!canProceed) {
        this.errorMessage = 'Upload failed: Usage limit reached. Please upgrade your plan to continue.';
        this.validationError.emit(this.errorMessage);
        return;
      }
      console.log('Usage limit check passed');

      this.isUploading = true;
      this.uploadProgress = 0;
      this.uploadComplete = false;

      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const filePath = `users/${user.uid}/finescan-uploads/${uniqueFileName}`;
      console.log('Generated file path:', filePath);

      const storageRef = ref(this.storage, filePath);
      console.log('Storage reference created');

      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString(),
        },
      };

      console.log('Starting upload with metadata:', metadata);
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          this.ngZone.run(() => {
            const progress = snapshot.bytesTransferred / snapshot.totalBytes;
            console.log(`Upload progress: ${Math.round(progress * 100)}%`);
            this.uploadProgress = progress;
            this.progressChange.emit(progress);
          });
        },
        (error) => {
          console.error('Upload error:', error);
          this.ngZone.run(() => {
            this.errorMessage = 'Upload failed: ' + error.message;
            this.validationError.emit(this.errorMessage);
            this.isUploading = false;
            this.uploadComplete = false;
          });
        },
        async () => {
          try {
            console.log('Upload completed, getting download URL...');
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Download URL obtained:', url);

            console.log('Creating analysis document...');
            const analysisRef = collection(this.firestore, `users/${user.uid}/analyses`);

            // Get the current usage document to include scansLimit
            const usageRef = doc(this.firestore, `users/${user.uid}/usage/current`);
            const usageDoc = await getDoc(usageRef);
            if (!usageDoc.exists()) {
              throw new Error('Usage document not found');
            }
            const usageData = usageDoc.data();

            await addDoc(analysisRef, {
              userId: user.uid,
              fileName: file.name,
              fileUrl: url,
              status: 'pending',
              createdAt: Timestamp.now(),
              scansLimit: usageData['scansLimit'],
              metadata: {
                contentType: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString(),
              },
            });
            console.log('Analysis document created successfully');

            this.ngZone.run(() => {
              this.downloadUrl = url;
              this.urlGenerated.emit(url);
              this.lastUploadedUrl = url;
              this.isUploading = false;
              this.uploadComplete = true;
              this.uploadProgress = 0;
              this.clearFileInput();
            });
          } catch (error) {
            console.error('Post-upload error:', error);
            this.ngZone.run(() => {
              this.errorMessage = 'Failed to complete upload process';
              this.validationError.emit(this.errorMessage);
              this.isUploading = false;
              this.uploadComplete = false;
            });
          }
        }
      );
    } catch (error) {
      console.error('Upload setup error:', error);
      this.isUploading = false;
      this.errorMessage = 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error');
      this.validationError.emit(this.errorMessage);
      this.uploadComplete = false;
    }
  }

  clearFileInput() {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  openFileDialog() {
    const input = this.document.createElement('input') as HTMLInputElement;
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

  async handleFileSelection(file: File) {
    this.selectedFile = file;
    this.errorMessage = '';

    const validationError = this.validateFile(file);
    if (validationError) {
      this.errorMessage = validationError;
      this.validationError.emit(validationError);
      return;
    }

    // If file is an image and larger than 2MB, try to optimize it
    if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) {
      try {
        const optimizedFile = await this.optimizeImage(file);
        this.selectedFile = optimizedFile;
      } catch (error) {
        console.warn('Image optimization failed:', error);
        // Continue with original file if optimization fails
      }
    }
  }

  private async optimizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const quality = this.dataSaverService.getImageQuality() / 100;
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = this.document.createElement('canvas') as HTMLCanvasElement;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not create blob'));
                return;
              }
              const optimizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            },
            file.type,
            quality
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async startUpload(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.selectedFile && !this.isUploading) {
      try {
        const user = await this.authService.getCurrentUser();
        if (!user) {
          throw new Error('No authenticated user');
        }

        // Check usage limits before starting upload
        console.log('Checking usage limits before upload...');
        const canProceed = await this.usageLimitService.checkAndIncrementUsage();
        console.log('Usage limit check result:', canProceed);

        if (!canProceed) {
          this.errorMessage = 'Upload failed: Usage limit reached. Please upgrade your plan to continue.';
          this.validationError.emit(this.errorMessage);
          return;
        }
        console.log('Usage limit check passed, proceeding with upload');

        await this.uploadFile(this.selectedFile);
      } catch (error) {
        console.error('Error in startUpload:', error);
        this.errorMessage = error instanceof Error ? error.message : 'Upload failed';
        this.validationError.emit(this.errorMessage);
      }
    }
  }

  async uploadFile(file: File) {
    if (!file) {
      this.errorMessage = 'No file selected';
      return;
    }

    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        this.errorMessage = 'Please sign in to upload files';
        this.validationError.emit(this.errorMessage);
        return;
      }

      if (this.isUploading) {
        return;
      }

      const validationError = this.validateFile(file);
      if (validationError) {
        this.errorMessage = validationError;
        this.validationError.emit(validationError);
        return;
      }

      this.isUploading = true;
      this.uploadProgress = 0;
      this.errorMessage = '';

      const timestamp = Date.now();
      const sanitizedName = this.sanitizeFileName(file.name);
      const filePath = `users/${user.uid}/finescan/${timestamp}_${sanitizedName}`;

      const storageRef = ref(this.storage, filePath);
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString(),
          originalName: file.name,
        },
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = snapshot.bytesTransferred / snapshot.totalBytes;
          this.ngZone.run(() => {
            this.uploadProgress = progress;
            this.progressChange.emit(progress);
          });
        },
        (error) => {
          console.error('Upload failed:', error);
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

            // Create the analysis document
            const analysisRef = doc(collection(this.firestore, `users/${user.uid}/analyses`));
            await setDoc(analysisRef, {
              fileName: file.name,
              fileUrl: url,
              filePath: filePath,
              fileType: file.type,
              fileSize: file.size,
              createdAt: Timestamp.now(),
              status: 'pending',
              userId: user.uid,
            });

            this.ngZone.run(() => {
              this.downloadUrl = url;
              this.urlGenerated.emit(url);
              this.lastUploadedUrl = url;
              this.isUploading = false;
              this.uploadComplete = true;
              this.uploadProgress = 0;
              this.clearFileInput();
            });

            // Clear the file input
            if (this.fileInput?.nativeElement) {
              this.fileInput.nativeElement.value = '';
            }
          } catch (error) {
            // If anything fails, clean up the uploaded file
            const fileRef = ref(this.storage, filePath);
            await deleteObject(fileRef);

            const firestoreError = error as FirestoreError;
            this.errorMessage = `Upload failed: ${firestoreError.message}`;
            this.validationError.emit(this.errorMessage);
            this.isUploading = false;
            this.uploadComplete = false;
          }
        }
      );
    } catch (error) {
      console.error('Upload process error:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Upload failed';
      this.uploadProgress = 0;
      this.isUploading = false;
    }
  }

  private sanitizeFileName(fileName: string): string {
    // Only keep alphanumeric characters, dots, and underscores
    const cleanName = fileName
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');

    // Ensure the extension is preserved
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return `${cleanName}.${extension}`;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.handleFileSelection(files[0]);
    }
  }

  triggerFileUpload(event: Event, fileType?: string) {
    event.preventDefault();
    event.stopPropagation();

    if (this.fileInput?.nativeElement) {
      // Set accept attribute based on file type
      if (fileType) {
        this.fileInput.nativeElement.accept = fileType;
      } else {
        this.fileInput.nativeElement.accept = this.accept;
      }
      this.fileInput.nativeElement.click();
    }
  }

  async showUploadHelp() {
    const alert = await this.alertController.create({
      header: 'How to Upload Files',
      message: `
        1. Tap the upload area or drag a file
        2. Select a text file or image
        3. Confirm your selection
        4. Wait for upload to complete

        Note: Files must be under 5MB
      `,
      buttons: ['Got it!'],
    });

    await alert.present();
  }

  retryUpload(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.selectedFile && !this.isUploading) {
      this.errorMessage = '';
      this.uploadFile(this.selectedFile);
    }
  }

  startAnalysis() {
    if (this.downloadUrl) {
      this.router.navigate(['/reports']);
    }
  }

  async showPrivacyDetails() {
    const alert = await this.alertController.create({
      header: 'Privacy & Security Details',
      message: `
        Document Security:
        • End-to-end encryption for all uploads
        • Secure cloud storage with Firebase
        • Automatic deletion after 30 days

        Data Protection:
        • Your documents are only accessible to you
        • No third-party access to your data
        • Regular security audits and updates

        Your Rights:
        • Request data deletion at any time
        • Download your documents
        • Access detailed audit logs
      `,
      cssClass: 'privacy-alert',
      buttons: ['Got It'],
    });

    await alert.present();
  }

  viewDocument() {
    if (this.lastUploadedUrl) {
      window.open(this.lastUploadedUrl, '_blank');
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
        lastUpdated: Timestamp.now(),
        tier: 'free' as const,
      });
    } else if (!usageDoc.data()?.['tier'] || !usageDoc.data()?.['scansUsed']) {
      // Ensure scansUsed exists and initialize if missing
      await updateDoc(usageRef, {
        tier: 'free' as const,
        scansUsed: 0,
        lastUpdated: Timestamp.now(),
      });
    }
  }
}
