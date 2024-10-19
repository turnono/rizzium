import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { HeaderComponent, FooterComponent } from '@rizzpos/shared/ui/organisms';
import { ProductService, ErrorHandlerService } from '@rizzpos/shared/services';
import { Product } from '@rizzpos/shared/interfaces';
import {
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonContent,
  IonInput,
  IonBadge,
  IonAlert,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-inventory-page',
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HeaderComponent,
    FooterComponent,
    IonButton,
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
    IonContent,
    IonInput,
    IonBadge,
    IonAlert,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
  ],
})
export class InventoryPageComponent implements OnInit {
  businessId: string;
  products$: Observable<Product[]> = new Observable<Product[]>();
  private pageSize = 20;
  private lastVisible$ = new BehaviorSubject<Product | null>(null);
  bulkUpdateQuantity = 0;
  lowStockThreshold = 10;
  showLowStockAlert = false;
  lowStockProduct: Product | null = null;
  isAddProductModalOpen = false;
  addProductForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private errorHandler: ErrorHandlerService,
    private formBuilder: FormBuilder
  ) {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    addIcons({ addCircleOutline });
    this.addProductForm = this.formBuilder.group({
      name: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      stockQuantity: ['', [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.products$ = this.lastVisible$.pipe(
      switchMap((lastVisible) =>
        this.productService.getProducts(
          this.businessId,
          this.pageSize,
          lastVisible
        )
      )
    );
  }

  loadMore() {
    this.products$.pipe(take(1)).subscribe((products) => {
      if (products.length > 0) {
        this.lastVisible$.next(products[products.length - 1]);
      }
    });
  }

  updateStock(product: Product, newQuantity: number) {
    if (isNaN(newQuantity)) {
      this.errorHandler.handleError(
        'Invalid quantity',
        'Please enter a valid number'
      );
      return;
    }

    this.productService
      .updateProduct(product.id as string, { stockQuantity: newQuantity })
      .then(() => {
        this.errorHandler.showSuccess('Stock updated successfully');
        this.checkLowStock(product, newQuantity);
      })
      .catch((error: unknown) => {
        this.errorHandler.handleError(error, 'Error updating stock');
      });
  }

  bulkUpdateStock() {
    this.products$.subscribe((products) => {
      products.forEach((product) => {
        const newQuantity = product.stockQuantity + this.bulkUpdateQuantity;
        this.updateStock(product, newQuantity);
      });
    });
  }

  checkLowStock(product: Product, newQuantity: number) {
    if (newQuantity <= this.lowStockThreshold) {
      this.lowStockProduct = product;
      this.showLowStockAlert = true;
    }
  }

  openAddProductModal() {
    this.isAddProductModalOpen = true;
  }

  cancelAddProduct() {
    this.isAddProductModalOpen = false;
    this.addProductForm.reset();
  }

  submitAddProduct() {
    if (this.addProductForm.valid) {
      const newProduct: Omit<Product, 'id'> = {
        ...this.addProductForm.value,
        businessId: this.businessId,
      };
      console.log('Submitting new product:', newProduct);
      this.productService
        .addProduct(newProduct)
        .then(() => {
          console.log('Product added successfully');
          this.errorHandler.showSuccess('Product added successfully');
          this.isAddProductModalOpen = false;
          console.log('Modal should be closed now');
          this.addProductForm.reset();
          this.loadProducts();
        })
        .catch((error) => {
          console.error('Error adding product:', error);
          this.errorHandler.handleError(error, 'Error adding product');
        });
    } else {
      console.log('Form is invalid:', this.addProductForm.errors);
    }
  }
}
