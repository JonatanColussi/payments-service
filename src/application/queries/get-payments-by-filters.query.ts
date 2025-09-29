import { IQuery } from '@nestjs/cqrs';
import { PaymentFilters } from '../../domain/interfaces';

export class GetPaymentsByFiltersQuery implements IQuery {
  constructor(public readonly filters: PaymentFilters) {}
}
