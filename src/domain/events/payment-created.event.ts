import { IEvent } from '@nestjs/cqrs';

export class PaymentCreatedEvent implements IEvent {
  constructor(
    public readonly paymentId: string,
    public readonly cpf: string,
    public readonly amount: number,
    public readonly paymentMethod: string,
    public readonly description: string,
    public readonly createdAt: Date,
  ) {}
}