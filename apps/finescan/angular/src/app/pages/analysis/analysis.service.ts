import { Injectable, inject } from '@angular/core';
import { Firestore, Timestamp, doc, updateDoc } from '@angular/fire/firestore';
import { UsageLimitService } from '@rizzium/shared/services';

@Injectable({
  providedIn: 'root',
})
export class AnalysisService {
  private firestore = inject(Firestore);
  private usageLimitService = inject(UsageLimitService);

  async startAnalysis(analysisId: string): Promise<boolean> {
    // Check usage limits before starting analysis
    const canProceed = await this.usageLimitService.checkAndIncrementUsage();
    if (!canProceed) {
      console.log('Usage limit reached, analysis blocked');
      return false;
    }
    console.log('Usage check passed, proceeding with analysis');

    const analysisRef = doc(this.firestore, 'analyses', analysisId);
    await updateDoc(analysisRef, {
      status: 'processing',
      startTime: Timestamp.now(),
    });
    return true;
  }
}
