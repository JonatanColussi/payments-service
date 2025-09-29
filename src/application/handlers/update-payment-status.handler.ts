import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdatePaymentStatusCommand } from '../commands';
import { IPaymentRepository } from '../../domain/interfaces';
import { PaymentResponseDto } from '../dtos';

@Injectable()
@CommandHandler(UpdatePaymentStatusCommand)
export class UpdatePaymentStatusHandler implements ICommandHandler<UpdatePaymentStatusCommand> {
  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: UpdatePaymentStatusCommand): Promise<PaymentResponseDto> {
    const { paymentId, status } = command;

    // Find payment
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    // Update status using domain logic
    payment.updateStatus(status);

    // Save updated payment
    const updatedPayment = await this.paymentRepository.update(payment);

    // Publish domain events
    const paymentModel = this.publisher.mergeObjectContext(updatedPayment);
    paymentModel.commit();

    // Return response DTO
    const plainObject = updatedPayment.toPlainObject();
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