import { IEvent } from '@nestjs/cqrs';

export class PaymentStatusUpdatedEvent implements IEvent {
  constructor(
    public readonly paymentId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly updatedAt: Date,
  ) {}
}