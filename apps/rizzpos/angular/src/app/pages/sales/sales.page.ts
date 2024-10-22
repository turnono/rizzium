import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, map } from 'rxjs';
import { HeaderComponent, FooterComponent } from '@rizzium/shared/ui/organisms';
import {
  ProductService,
  TransactionService,
  ErrorHandlerService,
} from '@rizzium/shared/services';
import { Product, Transaction } from '@rizzium/shared/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { addIcons } from 'ionicons';

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
  IonIcon,
  IonBadge,
  IonThumbnail,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { addCircleOutline, trash, cash } from 'ionicons/icons';

@Component({
  selector: 'app-sales-page',
  templateUrl: './sales.page.html',
  styleUrls: ['./sales.page.scss'],
  standalone: true,
  imports: [
    IonSearchbar,
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
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
    IonText,
    IonContent,
    IonBadge,
    IonThumbnail,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonIcon,
  ],
})
export class SalesPageComponent implements OnInit {
  businessId: string;
  products$: Observable<Product[]> = new Observable<Product[]>();
  recentTransactions$: Observable<Transaction[]> = new Observable<
    Transaction[]
  >();
  cart: { product: Product; quantity: number }[] = [];
  defaultProductImage = 'assets/default-product.png';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private transactionService: TransactionService,
    private errorHandler: ErrorHandlerService
  ) {
    addIcons({ trash, cash, addCircleOutline });
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
  }

  ngOnInit() {
    this.loadProducts();
    this.loadRecentTransactions();
  }

  loadProducts() {
    this.products$ = this.productService.getProducts(this.businessId);
  }

  loadRecentTransactions() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.recentTransactions$ = this.transactionService.getTransactions(
      this.businessId,
      twentyFourHoursAgo
    );
  }

  getProductImage(product: Product): string {
    return product.imageUrl ?? this.defaultProductImage;
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
        this.resetCart();
      },
      error: (error: unknown) => {
        this.errorHandler.handleError(error, 'Error processing transaction');
      },
    });
  }

  resetCart() {
    this.cart = [];
  }

  onSearchChange(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.products$ = this.productService
      .getProducts(this.businessId)
      .pipe(
        map((products: Product[]) =>
          products.filter((product: Product) =>
            product.name.toLowerCase().includes(searchTerm)
          )
        )
      );
  }

  clearCart() {
    this.cart = [];
    this.errorHandler.showSuccess('Cart cleared successfully');
  }
}
