import { ICommand } from '@nestjs/cqrs';
import { PaymentStatus } from '../../domain/entities';

export class UpdatePaymentStatusCommand implements ICommand {
  constructor(
    public readonly paymentId: string,
    public readonly status: PaymentStatus,
  ) {}
}