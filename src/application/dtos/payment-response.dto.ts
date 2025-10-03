import { PaymentStatus, PaymentMethod } from '../../domain/entities';

export class PaymentResponseDto {
  id: string;
  cpf: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;

  /**
   * URL for MercadoPago checkout redirection.
   * Present for CREDIT_CARD payments, null for other payment methods.
   * Clients should redirect users to this URL to complete the payment.
   */
  preferenceUrl?: string;

  constructor(
    id: string,
    cpf: string,
    description: string,
    amount: number,
    paymentMethod: PaymentMethod,
    status: PaymentStatus,
    createdAt: Date,
    updatedAt: Date,
    preferenceUrl?: string,
  ) {
    this.id = id;
    this.cpf = cpf;
    this.description = description;
    this.amount = amount;
    this.paymentMethod = paymentMethod;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.preferenceUrl = preferenceUrl;
  }
}
