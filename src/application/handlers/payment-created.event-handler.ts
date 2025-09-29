import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { PaymentCreatedEvent } from '../../domain/events';

@EventsHandler(PaymentCreatedEvent)
export class PaymentCreatedEventHandler implements IEventHandler<PaymentCreatedEvent> {
  private readonly logger = new Logger(PaymentCreatedEventHandler.name);

  handle(event: PaymentCreatedEvent) {
    this.logger.log(`Payment created: ${event.paymentId} for CPF: ${event.cpf}, Amount: ${event.amount}, Method: ${event.paymentMethod}`);
    
    // Here you could implement additional side effects like:
    // - Sending notifications
    // - Updating read models
    // - Integrating with external payment processors
    // - Analytics tracking
  }
}