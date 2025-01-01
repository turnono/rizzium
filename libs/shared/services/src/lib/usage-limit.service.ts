import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc, setDoc, Timestamp, onSnapshot } from '@angular/fire/firestore';
import { ModalController } from '@ionic/angular/standalone';
import { FirebaseAuthService } from './firebase-auth.service';
import { Router } from '@angular/router';
import { UpgradeModalComponent } from '@rizzium/shared/ui/molecules';
import { UsageData } from '@rizzium/shared/interfaces';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsageLimitService {
  private firestore = inject(Firestore);
  private modalCtrl = inject(ModalController);
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);
  private usageSubject = new BehaviorSubject<UsageData | null>(null);
  private usageListener: (() => void) | null = null;

  usage$ = this.usageSubject.asObservable();

  constructor() {
    // Initialize usage tracking for existing users
    this.authService.user$.subscribe(async (user) => {
      if (user) {
        await this.ensureUsageDocumentExists(user.uid);
        this.initUsageListener(user.uid);
      } else {
        this.stopUsageListener();
        this.usageSubject.next(null);
      }
    });
  }

  private initUsageListener(userId: string) {
    if (this.usageListener) {
      this.stopUsageListener();
    }

    const usageRef = doc(this.firestore, `users/${userId}/usage/current`);
    this.usageListener = onSnapshot(
      usageRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const usage = snapshot.data() as UsageData;
          this.usageSubject.next(usage);
        }
      },
      (error) => {
        console.error('Error listening to usage updates:', error);
        this.usageSubject.next(null);
      }
    );
  }

  private stopUsageListener() {
    if (this.usageListener) {
      this.usageListener();
      this.usageListener = null;
    }
  }

  async hasReachedLimit(): Promise<{ hasReached: boolean; scansUsed: number; scansLimit: number; tier: string }> {
    const user = await this.authService.getCurrentUser();
    if (!user) return { hasReached: true, scansUsed: 0, scansLimit: 0, tier: 'none' }; // Block access if no user

    const currentUsage = this.usageSubject.value;
    if (!currentUsage) {
      await this.ensureUsageDocumentExists(user.uid);
      const usageRef = doc(this.firestore, `users/${user.uid}/usage/current`);
      const usageSnap = await getDoc(usageRef);
      const usage = usageSnap.data() as UsageData;
      return {
        hasReached: usage.scansUsed >= usage.scansLimit,
        scansUsed: usage.scansUsed,
        scansLimit: usage.scansLimit,
        tier: usage.tier,
      };
    }

    // Check if we need to reset monthly usage
    const lastResetDate = currentUsage.lastResetDate?.toDate() || new Date(0);
    const now = new Date();
    if (this.shouldResetMonthlyUsage(lastResetDate, now)) {
      const usageRef = doc(this.firestore, `users/${user.uid}/usage/current`);
      await updateDoc(usageRef, {
        scansUsed: 0,
        lastResetDate: Timestamp.now(),
        tier: currentUsage.tier,
      });
      return { hasReached: false, scansUsed: 0, scansLimit: currentUsage.scansLimit, tier: currentUsage.tier };
    }

    return {
      hasReached: currentUsage.scansUsed >= currentUsage.scansLimit,
      scansUsed: currentUsage.scansUsed,
      scansLimit: currentUsage.scansLimit,
      tier: currentUsage.tier,
    };
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
        tier: 'free',
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

    try {
      // Ensure usage document exists
      await this.ensureUsageDocumentExists(user.uid);

      const usageRef = doc(this.firestore, `users/${user.uid}/usage/current`);
      const usageSnap = await getDoc(usageRef);
      const usage = usageSnap.data() as UsageData;

      console.log('Current usage stats:', {
        scansUsed: usage.scansUsed,
        scansLimit: usage.scansLimit,
        lastResetDate: usage.lastResetDate?.toDate(),
        tier: usage.tier,
      });

      const lastResetDate = usage.lastResetDate?.toDate() || new Date(0);
      const now = new Date();

      // Check if we need to reset monthly usage
      if (this.shouldResetMonthlyUsage(lastResetDate, now)) {
        console.log('Resetting monthly usage (new month started)');
        await updateDoc(usageRef, {
          ...usage,
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
          tier: usage.tier,
        });
        await this.showUpgradeModal();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in checkAndIncrementUsage:', error);
      throw error;
    }
  }

  async incrementScanCount(): Promise<boolean> {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      console.error('Usage increment failed: No authenticated user');
      throw new Error('User must be authenticated');
    }

    try {
      const usageRef = doc(this.firestore, `users/${user.uid}/usage/current`);
      const usageSnap = await getDoc(usageRef);
      const usage = usageSnap.data() as UsageData;

      // Increment usage while preserving all fields
      console.log('Incrementing scan count...', {
        userId: user.uid,
        currentScans: usage.scansUsed,
        path: `users/${user.uid}/usage/current`,
      });

      await updateDoc(usageRef, {
        ...usage,
        scansUsed: usage.scansUsed + 1,
        lastResetDate: usage.lastResetDate,
      });
      console.log('Successfully incremented scan count');

      // Get updated usage to check if it was the last scan
      const updatedUsageSnap = await getDoc(usageRef);
      const updatedUsage = updatedUsageSnap.data() as UsageData;

      console.log('Updated usage stats:', {
        previousScans: usage.scansUsed,
        newScans: updatedUsage.scansUsed,
        limit: updatedUsage.scansLimit,
      });

      // If this was their last free scan, show a warning
      if (updatedUsage.scansUsed === updatedUsage.scansLimit) {
        console.log('Last scan used, showing warning');
        await this.showLastScanWarning();
      }

      return true;
    } catch (error) {
      console.error('Error incrementing scan count:', error);
      throw error;
    }
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

    const { data } = await modal.onWillDismiss();
    if (data?.action === 'viewPlans') {
      await this.router.navigate(['/pricing']);
    }
  }
}
