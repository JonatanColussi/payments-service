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

  constructor(
    id: string,
    cpf: string,
    description: string,
    amount: number,
    paymentMethod: PaymentMethod,
    status: PaymentStatus,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.cpf = cpf;
    this.description = description;
    this.amount = amount;
    this.paymentMethod = paymentMethod;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}