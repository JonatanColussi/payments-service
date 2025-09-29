import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { PaymentStatusUpdatedEvent } from '../../domain/events';

@EventsHandler(PaymentStatusUpdatedEvent)
export class PaymentStatusUpdatedEventHandler implements IEventHandler<PaymentStatusUpdatedEvent> {
  private readonly logger = new Logger(PaymentStatusUpdatedEventHandler.name);

  handle(event: PaymentStatusUpdatedEvent) {
    this.logger.log(`Payment status updated: ${event.paymentId} from ${event.previousStatus} to ${event.newStatus}`);
    
    // Here you could implement additional side effects like:
    // - Sending status update notifications
    // - Triggering webhooks
    // - Updating external systems
    // - Compliance logging
  }
}