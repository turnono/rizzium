import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-journal-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  template: `
    <ion-content class="ion-padding">
      <form [formGroup]="journalForm" (ngSubmit)="onSubmit()">
        <ion-item>
          <ion-label position="stacked">Date</ion-label>
          <ion-datetime-button datetime="date"></ion-datetime-button>
          <ion-modal [keepContentsMounted]="true">
            <ng-template>
              <ion-datetime id="date" formControlName="date"></ion-datetime>
            </ng-template>
          </ion-modal>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Entry</ion-label>
          <ion-textarea formControlName="text" placeholder="Write your thoughts..." [rows]="6"></ion-textarea>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Mood</ion-label>
          <ion-select formControlName="mood">
            <ion-select-option value="happy">😊 Happy</ion-select-option>
            <ion-select-option value="neutral">😐 Neutral</ion-select-option>
            <ion-select-option value="sad">😢 Sad</ion-select-option>
            <ion-select-option value="excited">🎉 Excited</ion-select-option>
            <ion-select-option value="anxious">😰 Anxious</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-button expand="block" type="submit" [disabled]="!journalForm.valid" class="ion-margin-top">
          Save Entry
        </ion-button>
      </form>
    </ion-content>
  `,
  styles: [
    `
      ion-content {
        --background: var(--ion-color-light);
      }

      form {
        max-width: 600px;
        margin: 0 auto;
      }

      ion-item {
        margin-bottom: 16px;
        --background: var(--ion-color-light);
      }
    `,
  ],
})
export class JournalEntryComponent {
  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);

  journalForm: FormGroup = this.fb.group({
    date: [new Date().toISOString(), Validators.required],
    text: ['', [Validators.required, Validators.minLength(3)]],
    mood: ['', Validators.required],
  });

  async onSubmit() {
    if (this.journalForm.valid) {
      try {
        const journalCollection = collection(this.firestore, 'journal-entries');
        await addDoc(journalCollection, {
          ...this.journalForm.value,
          userId: 'TODO: Add user ID here', // You'll need to integrate with authentication
          createdAt: new Date(),
        });
        this.journalForm.reset({
          date: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error saving journal entry:', error);
      }
    }
  }
}
