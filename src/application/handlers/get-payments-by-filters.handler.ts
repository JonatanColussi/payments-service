import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetPaymentsByFiltersQuery } from '../queries';
import { IPaymentRepository } from '../../domain/interfaces';
import { PaymentResponseDto } from '../dtos';

@Injectable()
@QueryHandler(GetPaymentsByFiltersQuery)
export class GetPaymentsByFiltersHandler implements IQueryHandler<GetPaymentsByFiltersQuery> {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(query: GetPaymentsByFiltersQuery): Promise<PaymentResponseDto[]> {
    const { filters } = query;

    const payments = await this.paymentRepository.findByFilters(filters);

    return payments.map(payment => {
      const plainObject = payment.toPlainObject();
      return new PaymentResponseDto(
        plainObject.id,
        plainObject.cpf,
        plainObject.description,
        plainObject.amount,
        plainObject.paymentMethod,
        plainObject.status,
        plainObject.createdAt,
        plainObject.updatedAt,
      );
    });
  }
}
