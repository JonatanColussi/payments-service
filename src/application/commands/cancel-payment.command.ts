import { ICommand } from '@nestjs/cqrs';

export class CancelPaymentCommand implements ICommand {
  constructor(public readonly paymentId: string) {}
}