import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { GetPaymentsByFiltersQuery } from '../queries';
import { IPaymentRepository } from '../../domain/interfaces';
import { PaymentResponseDto } from '../dtos';
import { PaymentStatus } from '../../domain/entities';

@Injectable()
@QueryHandler(GetPaymentsByFiltersQuery)
export class GetPaymentsByFiltersHandler implements IQueryHandler<GetPaymentsByFiltersQuery> {
  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(query: GetPaymentsByFiltersQuery): Promise<PaymentResponseDto[]> {
    const { filters } = query;
    const { cpf, status } = filters;

    let payments;

    // Use the most specific repository method based on available filters
    if (cpf && status) {
      payments = await this.paymentRepository.findByCpfAndStatus(cpf, status);
    } else if (cpf) {
      payments = await this.paymentRepository.findByCpf(cpf);
    } else if (status) {
      payments = await this.paymentRepository.findByStatus(status);
    } else {
      // If no filters, return payments by PENDING status as default
      payments = await this.paymentRepository.findByStatus(PaymentStatus.PENDING);
    }

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
