import { IQuery } from '@nestjs/cqrs';
import { PaymentStatus } from '../../domain/entities';

export interface PaymentFilters {
  cpf?: string;
  status?: PaymentStatus;
}

export class GetPaymentsByFiltersQuery implements IQuery {
  constructor(public readonly filters: PaymentFilters) {}
}
