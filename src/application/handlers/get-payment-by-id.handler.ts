import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { GetPaymentByIdQuery } from '../queries';
import { IPaymentRepository } from '../../domain/interfaces';
import { PaymentResponseDto } from '../dtos';

@Injectable()
@QueryHandler(GetPaymentByIdQuery)
export class GetPaymentByIdHandler implements IQueryHandler<GetPaymentByIdQuery> {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(query: GetPaymentByIdQuery): Promise<PaymentResponseDto> {
    const { paymentId } = query;

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

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
  }
}
