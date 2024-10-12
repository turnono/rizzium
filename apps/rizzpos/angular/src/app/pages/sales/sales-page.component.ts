import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui';
import {
  ProductService,
  TransactionService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { Product, Transaction } from '@rizzpos/shared/interfaces';

@Component({
  selector: 'app-sales-page',
  templateUrl: './sales-page.component.html',
  styleUrls: ['./sales-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
  ],
})
export class SalesPageComponent implements OnInit {
  businessId: string;
  products$: Observable<Product[]>;
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
      businessId: this.businessId,
      items: this.cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      total: this.getTotalAmount(),
      date: new Date(),
    };

    this.transactionService.createTransaction(transaction).subscribe(
      () => {
        this.errorHandler.showSuccess('Transaction processed successfully');
        this.cart = [];
      },
      (error) => {
        this.errorHandler.handleError(error, 'Error processing transaction');
      }
    );
  }
}
