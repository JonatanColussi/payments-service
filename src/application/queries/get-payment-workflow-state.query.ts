import { IQuery } from '@nestjs/cqrs';

export class GetPaymentWorkflowStateQuery implements IQuery {
  constructor(public readonly paymentId: string) {}
}