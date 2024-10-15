import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import {
  ProductService,
  TransactionService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { Product } from '@rizzpos/shared/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@rizzpos/shared/interfaces';
import {
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonContent,
  IonText,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-sales-page',
  templateUrl: './sales.page.html',
  styleUrls: ['./sales.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    IonButton,
    IonNote,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonContent,
  ],
})
export class SalesPageComponent implements OnInit {
  businessId: string;
  products$?: Observable<Product[]>;
  cart: { product: Product; quantity: number }[] = [];

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private transactionService: TransactionService,
    private errorHandler: ErrorHandlerService
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.products$ = this.productService.getProducts(this.businessId);
  }

  addToCart(product: Product) {
    const existingItem = this.cart.find(
      (item) => item.product.id === product.id
    );
    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.cart.push({ product, quantity: 1 });
    }
  }

  removeFromCart(product: Product) {
    const index = this.cart.findIndex((item) => item.product.id === product.id);
    if (index !== -1) {
      if (this.cart[index].quantity > 1) {
        this.cart[index].quantity--;
      } else {
        this.cart.splice(index, 1);
      }
    }
  }

  getTotalAmount(): number {
    return this.cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }

  processTransaction() {
    const transaction: Transaction = {
      id: uuidv4(),
      businessId: this.businessId,
      items: this.cart.map((item) => ({
        productId: item.product.id || '',
        quantity: item.quantity,
        price: item.product.price,
      })),
      total: this.getTotalAmount(),
      date: new Date(),
    };

    this.transactionService.createTransaction(transaction).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Transaction processed successfully');
        this.cart = [];
      },
      error: (error: unknown) => {
        this.errorHandler.handleError(error, 'Error processing transaction');
      },
    });
  }
}
