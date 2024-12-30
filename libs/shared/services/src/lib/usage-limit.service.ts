import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc, setDoc, Timestamp } from '@angular/fire/firestore';
import { ModalController } from '@ionic/angular/standalone';
import { FirebaseAuthService } from './firebase-auth.service';
import { Router } from '@angular/router';
import { UpgradeModalComponent } from '@rizzium/shared/ui/molecules';
import { UsageData } from '@rizzium/shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class UsageLimitService {
  private firestore = inject(Firestore);
  private modalCtrl = inject(ModalController);
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);

  constructor() {
    // Initialize usage tracking for existing users
    this.authService.user$.subscribe(async (user) => {
      if (user) {
        await this.ensureUsageDocumentExists(user.uid);
      }
    });
  }

  async hasReachedLimit(): Promise<boolean> {
    const user = await this.authService.getCurrentUser();
    if (!user) return true; // Block access if no user

    await this.ensureUsageDocumentExists(user.uid);

    const usageRef = doc(this.firestore, `users/${user.uid}/usage/current`);
    const usageSnap = await getDoc(usageRef);
    const usage = usageSnap.data() as UsageData;

    // Check if we need to reset monthly usage
    const lastResetDate = usage.lastResetDate?.toDate() || new Date(0);
    const now = new Date();
    if (this.shouldResetMonthlyUsage(lastResetDate, now)) {
      await updateDoc(usageRef, {
        scansUsed: 0,
        lastResetDate: Timestamp.now(),
      });
      return false;
    }

    return usage.scansUsed >= usage.scansLimit;
  }

  private async ensureUsageDocumentExists(userId: string): Promise<void> {
    const usageRef = doc(this.firestore, `users/${userId}/usage/current`);
    const usageSnap = await getDoc(usageRef);

    if (!usageSnap.exists()) {
      console.log('Creating new usage document for user:', userId);
      // Initialize usage document for existing user
      const initialUsage: UsageData = {
        scansUsed: 0,
        scansLimit: 3,
        storageUsed: 0,
        storageLimit: 50 * 1024 * 1024, // 50MB trial storage
        retentionDays: 7,
        lastResetDate: Timestamp.now(),
      };
      await setDoc(usageRef, initialUsage);
    }
  }

  async checkAndIncrementUsage(): Promise<boolean> {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      console.error('Usage check failed: No authenticated user');
      throw new Error('User must be authenticated');
    }

    // Ensure usage document exists
    await this.ensureUsageDocumentExists(user.uid);

    const usageRef = doc(this.firestore, `users/${user.uid}/usage/current`);
    const usageSnap = await getDoc(usageRef);
    const usage = usageSnap.data() as UsageData;

    console.log('Current usage stats:', {
      scansUsed: usage.scansUsed,
      scansLimit: usage.scansLimit,
      lastResetDate: usage.lastResetDate?.toDate(),
    });

    const lastResetDate = usage.lastResetDate?.toDate() || new Date(0);
    const now = new Date();

    // Check if we need to reset monthly usage
    if (this.shouldResetMonthlyUsage(lastResetDate, now)) {
      console.log('Resetting monthly usage (new month started)');
      await updateDoc(usageRef, {
        scansUsed: 0,
        lastResetDate: Timestamp.now(),
      });
      return true;
    }

    // Check if user has hit their limit
    if (usage.scansUsed >= usage.scansLimit) {
      console.log('Usage limit reached:', {
        current: usage.scansUsed,
        limit: usage.scansLimit,
      });
      await this.showUpgradeModal();
      return false;
    }

    // Increment usage
    const newUsage = usage.scansUsed + 1;
    console.log('Incrementing usage:', {
      from: usage.scansUsed,
      to: newUsage,
      limit: usage.scansLimit,
    });

    await updateDoc(usageRef, {
      scansUsed: newUsage,
    });

    // If this was their last free scan, show a warning
    if (newUsage === usage.scansLimit) {
      console.log('Last scan used, showing warning');
      await this.showLastScanWarning();
    }

    return true;
  }

  private shouldResetMonthlyUsage(lastReset: Date, now: Date): boolean {
    return lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();
  }

  private async showUpgradeModal(): Promise<void> {
    console.log('Showing upgrade modal');
    const modal = await this.modalCtrl.create({
      component: UpgradeModalComponent,
      cssClass: 'upgrade-modal',
      backdropDismiss: false,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.action === 'viewPlans') {
      await this.router.navigate(['/pricing']);
    }
  }

  private async showLastScanWarning(): Promise<void> {
    console.log('Showing last scan warning');
    const modal = await this.modalCtrl.create({
      component: UpgradeModalComponent,
      cssClass: 'upgrade-modal',
      backdropDismiss: false,
      componentProps: {
        isWarning: true,
        title: 'Last Free Scan Used',
        message: 'You have used your last free scan for this month. Upgrade now to continue analyzing documents.',
      },
    });

    await modal.present();
  }
}
