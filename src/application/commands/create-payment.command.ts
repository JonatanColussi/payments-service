import { ICommand } from '@nestjs/cqrs';
import { PaymentMethod } from '../../domain/entities';

export class CreatePaymentCommand implements ICommand {
  constructor(
    public readonly cpf: string,
    public readonly description: string,
    public readonly amount: number,
    public readonly paymentMethod: PaymentMethod,
  ) {}
}