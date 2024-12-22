import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  constructor(private toastController: ToastController) {}

  async showError(message: string, duration = 3000) {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'danger',
      position: 'bottom',
    });
    await toast.present();
  }

  async showSuccess(message: string, duration = 3000) {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'success',
      position: 'bottom',
    });
    await toast.present();
  }

  async showWarning(message: string, duration = 3000) {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'warning',
      position: 'bottom',
    });
    await toast.present();
  }

  handleError(error: any) {
    console.error('An error occurred:', error);
    let message = 'An unexpected error occurred';

    if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
    }

    this.showError(message);
  }
}
