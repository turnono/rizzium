import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';
import { TikTokContent } from '@rizzium/shared/interfaces';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TikTokContentService {
  private firestore = inject(Firestore);
  private readonly collection = 'TikTokContent';

  getContentCalendar(startDate: Date, endDate: Date): Observable<TikTokContent[]> {
    const contentRef = collection(this.firestore, this.collection);
    const q = query(
      contentRef,
      where('scheduledDate', '>=', startDate),
      where('scheduledDate', '<=', endDate),
      orderBy('scheduledDate', 'asc')
    );

    return collectionData(q) as Observable<TikTokContent[]>;
  }

  addContent(content: Omit<TikTokContent, 'id' | 'createdAt' | 'updatedAt'>): Observable<void> {
    const contentRef = doc(collection(this.firestore, this.collection));
    const newContent: TikTokContent = {
      ...content,
      id: contentRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return from(setDoc(contentRef, newContent));
  }

  updateContent(id: string, content: Partial<TikTokContent>): Observable<void> {
    const contentRef = doc(this.firestore, this.collection, id);
    const updateData = {
      ...content,
      updatedAt: new Date(),
    };

    return from(updateDoc(contentRef, updateData));
  }

  deleteContent(id: string): Observable<void> {
    const contentRef = doc(this.firestore, this.collection, id);
    return from(deleteDoc(contentRef));
  }

  updateMetrics(id: string, metrics: TikTokContent['metrics']): Observable<void> {
    return this.updateContent(id, { metrics });
  }
}
