import { Money } from '../value-objects';
import { PaymentMethod } from '../entities';

export class PaymentValidationService {
  static validatePaymentAmount(amount: Money, paymentMethod: PaymentMethod): void {
    const minAmount = this.getMinimumAmount(paymentMethod);
    const maxAmount = this.getMaximumAmount(paymentMethod);

    if (amount.isLessThan(minAmount)) {
      throw new Error(`Payment amount must be at least ${minAmount.toString()}`);
    }

    if (amount.isGreaterThan(maxAmount)) {
      throw new Error(`Payment amount cannot exceed ${maxAmount.toString()}`);
    }
  }

  static validatePaymentMethod(paymentMethod: PaymentMethod): void {
    const validMethods = Object.values(PaymentMethod);
    if (!validMethods.includes(paymentMethod)) {
      throw new Error(`Invalid payment method: ${paymentMethod}`);
    }
  }

  static validateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new Error('Payment description is required');
    }

    if (description.length > 500) {
      throw new Error('Payment description cannot exceed 500 characters');
    }
  }

  private static getMinimumAmount(paymentMethod: PaymentMethod): Money {
    switch (paymentMethod) {
      case PaymentMethod.PIX:
        return new Money(0.01);
      case PaymentMethod.CREDIT_CARD:
        return new Money(1.00);
      default:
        return new Money(0.01);
    }
  }

  private static getMaximumAmount(paymentMethod: PaymentMethod): Money {
    switch (paymentMethod) {
      case PaymentMethod.PIX:
        return new Money(500000.00); // R$ 500,000
      case PaymentMethod.CREDIT_CARD:
        return new Money(50000.00);  // R$ 50,000
      default:
        return new Money(500000.00);
    }
  }
}