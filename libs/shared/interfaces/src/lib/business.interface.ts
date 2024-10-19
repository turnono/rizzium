import { Timestamp } from '@angular/fire/firestore';

export interface BusinessData {
  id: string;
  businessName: string;
  businessType: string;
  address: string;
  phoneNumber: string;
  ownerId: string;
  createdAt: Timestamp;
}

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
  imageUrl?: string;
}

export interface Transaction {
  id: string;
  businessId: string;
  date: Date;
  total: number;
  items: { productId: string; quantity: number; price: number }[];
}

export interface Purchase {
  id: string;
  date: Date;
  total: number;
  items: { productId: string; quantity: number; price: number }[];
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  expiryDate: Date;
}

export interface BusinessUser {
  userId: string;
  role: 'owner' | 'manager' | 'cashier' | 'customer';
  displayName: string;
  email: string;
  createdAt: Timestamp;
}
