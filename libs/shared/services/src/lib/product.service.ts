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
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
  lowStockThreshold: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

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

  getProducts(businessId: string): Observable<Product[]> {
    const q = query(
      collection(this.firestore, 'products'),
      where('businessId', '==', businessId)
    );
    return from(getDocs(q)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Product)
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
