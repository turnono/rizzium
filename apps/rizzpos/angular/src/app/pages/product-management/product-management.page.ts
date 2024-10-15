import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '@rizzpos/shared/services';
import { Observable } from 'rxjs';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import { ActivatedRoute } from '@angular/router';
import { Product } from '@rizzpos/shared/interfaces';
import { IonList } from '@ionic/angular/standalone';
import { IonButton, IonItem, IonLabel } from '@ionic/angular/standalone';
import { IonFab, IonIcon } from '@ionic/angular/standalone';
import { IonFabButton } from '@ionic/angular/standalone';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-product-management',
  templateUrl: './product-management.page.html',
  styleUrl: './product-management.page.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HeaderComponent,
    FooterComponent,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonFab,
    IonFabButton,
    IonIcon,
  ],
})
export class ProductManagementComponent implements OnInit {
  products$: Observable<Product[]>;
  businessId: string;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.products$ = this.productService.getProducts(this.businessId);
  }

  ngOnInit() {
    // You can add initialization logic here if needed
    console.log('ProductManagementComponent initialized');
  }

  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    this.productService.addProduct(product);
  }

  updateProduct(id: string, product: Partial<Product>) {
    this.productService.updateProduct(id, product);
  }

  deleteProduct(id: string | undefined) {
    if (id) {
      this.productService.deleteProduct(id);
    }
  }

  openAddProductModal() {
    // Implement this method to open a modal for adding a new product
    console.log('Open add product modal');
  }

  editProduct(product: Product) {
    // Implement this method to edit a product
    console.log('Edit product', product);
  }
}
