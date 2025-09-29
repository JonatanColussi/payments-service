import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { NotifyPaymentStatusCommand } from '../commands/notify-payment-status.command';
import { IPaymentWorkflowService } from '../interfaces/payment-workflow.interface';

@Injectable()
@CommandHandler(NotifyPaymentStatusCommand)
export class NotifyPaymentStatusHandler implements ICommandHandler<NotifyPaymentStatusCommand> {
  private readonly logger = new Logger(NotifyPaymentStatusHandler.name);

  constructor(
    private readonly paymentWorkflowService: IPaymentWorkflowService,
  ) {}

  async execute(command: NotifyPaymentStatusCommand): Promise<void> {
    const { paymentId, status, mercadoPagoPaymentId } = command;

    this.logger.log(`Notifying payment status: ${paymentId} -> ${status}`);

    await this.paymentWorkflowService.notifyPaymentStatus(
      paymentId,
      status,
      mercadoPagoPaymentId
    );

    this.logger.log(`Payment status notification sent successfully: ${paymentId}`);
  }
}