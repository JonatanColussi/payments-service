import { AggregateRoot } from '@nestjs/cqrs';
import { CPF, Money } from '../value-objects';
import { PaymentStatus, PaymentMethod } from './enums';
import { PaymentCreatedEvent, PaymentStatusUpdatedEvent } from '../events';

export class Payment extends AggregateRoot {
  private _id: string;
  private _cpf: CPF;
  private _description: string;
  private _amount: Money;
  private _paymentMethod: PaymentMethod;
  private _status: PaymentStatus;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    cpf: CPF,
    description: string,
    amount: Money,
    paymentMethod: PaymentMethod,
    status: PaymentStatus = PaymentStatus.PENDING,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super();
    this._id = id;
    this._cpf = cpf;
    this._description = description;
    this._amount = amount;
    this._paymentMethod = paymentMethod;
    this._status = status;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  static create(
    id: string,
    cpf: CPF,
    description: string,
    amount: Money,
    paymentMethod: PaymentMethod,
  ): Payment {
    const payment = new Payment(id, cpf, description, amount, paymentMethod);
    
    payment.apply(new PaymentCreatedEvent(
      payment._id,
      payment._cpf.getValue(),
      payment._amount.getAmount(),
      payment._paymentMethod,
      payment._description,
      payment._createdAt,
    ));

    return payment;
  }

  updateStatus(newStatus: PaymentStatus): void {
    if (this._status === newStatus) {
      return;
    }

    if (!this.isValidStatusTransition(newStatus)) {
      throw new Error(`Invalid status transition from ${this._status} to ${newStatus}`);
    }

    const previousStatus = this._status;
    this._status = newStatus;
    this._updatedAt = new Date();

    this.apply(new PaymentStatusUpdatedEvent(
      this._id,
      previousStatus,
      newStatus,
      this._updatedAt,
    ));
  }

  markAsPaid(): void {
    this.updateStatus(PaymentStatus.PAID);
  }

  markAsFailed(): void {
    this.updateStatus(PaymentStatus.FAIL);
  }

  isPending(): boolean {
    return this._status === PaymentStatus.PENDING;
  }

  isPaid(): boolean {
    return this._status === PaymentStatus.PAID;
  }

  isFailed(): boolean {
    return this._status === PaymentStatus.FAIL;
  }

  canBeProcessed(): boolean {
    return this._status === PaymentStatus.PENDING;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get cpf(): CPF {
    return this._cpf;
  }

  get description(): string {
    return this._description;
  }

  get amount(): Money {
    return this._amount;
  }

  get paymentMethod(): PaymentMethod {
    return this._paymentMethod;
  }

  get status(): PaymentStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  private isValidStatusTransition(newStatus: PaymentStatus): boolean {
    const transitions = {
      [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.FAIL],
      [PaymentStatus.PAID]: [],
      [PaymentStatus.FAIL]: [],
    };

    return transitions[this._status].includes(newStatus);
  }

  toPlainObject() {
    return {
      id: this._id,
      cpf: this._cpf.getValue(),
      description: this._description,
      amount: this._amount.getAmount(),
      paymentMethod: this._paymentMethod,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}