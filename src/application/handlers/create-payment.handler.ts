import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { CreatePaymentCommand } from '../commands';
import { Payment, CPF, Money, PaymentValidationService } from '../../domain';
import { IPaymentRepository } from '../../domain/interfaces';
import { PaymentResponseDto } from '../dtos';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
@CommandHandler(CreatePaymentCommand)
export class CreatePaymentHandler implements ICommandHandler<CreatePaymentCommand> {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreatePaymentCommand): Promise<PaymentResponseDto> {
    const { cpf, description, amount, paymentMethod } = command;

    // Validate inputs using domain services
    const cpfVO = new CPF(cpf);
    const amountVO = new Money(amount);

    PaymentValidationService.validatePaymentMethod(paymentMethod);
    PaymentValidationService.validatePaymentAmount(amountVO, paymentMethod);
    PaymentValidationService.validateDescription(description);

    // Create domain entity
    const paymentId = uuidv4();
    const payment = Payment.create(paymentId, cpfVO, description, amountVO, paymentMethod);

    // Save to repository
    const savedPayment = await this.paymentRepository.save(payment);

    // Publish domain events
    const paymentModel = this.publisher.mergeObjectContext(savedPayment);
    paymentModel.commit();

    // Return response DTO
    const plainObject = savedPayment.toPlainObject();
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
