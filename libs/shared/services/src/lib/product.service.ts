import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  Timestamp,
  Query,
  DocumentData,
  orderBy,
  limit,
  startAfter,
} from '@angular/fire/firestore';
import { Product } from '@rizzium/shared/interfaces';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private firestore: Firestore) {}

  addProduct(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const productWithTimestamp = {
      ...product,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    return addDoc(
      collection(this.firestore, 'products'),
      productWithTimestamp
    ).then((docRef) => docRef.id);
  }

  updateProduct(id: string, product: Partial<Product>): Promise<void> {
    const productRef = doc(this.firestore, `products/${id}`);
    return updateDoc(productRef, { ...product, updatedAt: Timestamp.now() });
  }

  deleteProduct(id: string): Promise<void> {
    const productRef = doc(this.firestore, `products/${id}`);
    return deleteDoc(productRef);
  }

  getProducts(
    businessId: string,
    limitCount = 20,
    startAfterDoc: Product | null = null
  ): Observable<Product[]> {
    const productsRef = collection(this.firestore, 'products');
    let q: Query<DocumentData> = query(
      productsRef,
      where('businessId', '==', businessId),
      orderBy('name'),
      limit(limitCount)
    );

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc.name));
    }

    return from(getDocs(q)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as unknown as Product)
        )
      )
    );
  }

  getLowStockProducts(businessId: string): Observable<Product[]> {
    return this.getProducts(businessId).pipe(
      map((products) =>
        products.filter(
          (product) => product.stockQuantity <= product.lowStockThreshold
        )
      )
    );
  }
}
