import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { CancelPaymentCommand } from '../commands/cancel-payment.command';
import { IPaymentWorkflowService } from '../interfaces/payment-workflow.interface';

@Injectable()
@CommandHandler(CancelPaymentCommand)
export class CancelPaymentHandler implements ICommandHandler<CancelPaymentCommand> {
  private readonly logger = new Logger(CancelPaymentHandler.name);

  constructor(
    private readonly paymentWorkflowService: IPaymentWorkflowService,
  ) {}

  async execute(command: CancelPaymentCommand): Promise<void> {
    const { paymentId } = command;

    this.logger.log(`Cancelling payment: ${paymentId}`);

    await this.paymentWorkflowService.cancelPayment(paymentId);

    this.logger.log(`Payment cancellation request sent: ${paymentId}`);
  }
}