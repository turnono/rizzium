import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import {
  ProductService,
  TransactionService,
  ErrorHandlerService,
} from '@rizzpos/shared/services';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import { Observable } from 'rxjs';
import { Product } from '@rizzpos/shared/interfaces';

@Component({
  selector: 'app-cashier-dashboard',
  templateUrl: './cashier-dashboard.page.html',
  styleUrl: './cashier-dashboard.page.scss',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FooterComponent],
})
export class CashierDashboardComponent implements OnInit {
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
    this.products$ = this.productService.getProducts(
      this.businessId
    ) as Observable<Product[]>;
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
    const transaction = {
      businessId: this.businessId,
      items: this.cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      total: this.getTotalAmount(),
      date: new Date(),
    };

    this.transactionService.createTransaction(transaction).then(
      () => {
        this.errorHandler.showSuccess('Transaction processed successfully');
        this.cart = [];
      },
      (error: unknown) => {
        this.errorHandler.handleError(error, 'Error processing transaction');
      }
    );
  }
}
