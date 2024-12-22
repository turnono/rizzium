import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  constructor(private toastController: ToastController) {}

  async handleError(error: any, defaultMessage = 'An error occurred') {
    console.error('Error:', error);

    let message = defaultMessage;
    if (error?.message) {
      if (error.message.includes('auth/email-already-in-use')) {
        message = 'This email is already registered';
      } else if (error.message.includes('auth/wrong-password')) {
        message = 'Invalid email or password';
      } else if (error.message.includes('auth/user-not-found')) {
        message = 'User not found';
      } else if (error.message.includes('auth/invalid-email')) {
        message = 'Invalid email format';
      }
    }

    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger',
      cssClass: 'error-toast',
    });

    await toast.present();
  }
}
