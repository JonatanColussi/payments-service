import { IQuery } from '@nestjs/cqrs';

export class GetPaymentByIdQuery implements IQuery {
  constructor(public readonly paymentId: string) {}
}