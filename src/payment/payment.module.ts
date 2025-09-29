import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Domain
import { PaymentValidationService } from '../domain/services';

// Application
import {
  CreatePaymentHandler,
  UpdatePaymentStatusHandler,
  GetPaymentByIdHandler,
  GetPaymentsByFiltersHandler,
  PaymentCreatedEventHandler,
  PaymentStatusUpdatedEventHandler,
  NotifyPaymentStatusHandler,
  CancelPaymentHandler,
  GetPaymentWorkflowStateHandler,
  GetActiveWorkflowsHandler,
} from '../application/handlers';


// Infrastructure
import { PaymentOrmEntity, PaymentRepository } from '../infrastructure';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

// Presentation
import { PaymentController } from '../presentation/controllers/payment.controller';
import { MercadoPagoWebhookController } from '../presentation/controllers/mercadopago-webhook.controller';
import { IPaymentRepository } from '../domain';

const CommandHandlers = [
  CreatePaymentHandler,
  UpdatePaymentStatusHandler,
  NotifyPaymentStatusHandler,
  CancelPaymentHandler,
];

const QueryHandlers = [
  GetPaymentByIdHandler,
  GetPaymentsByFiltersHandler,
  GetPaymentWorkflowStateHandler,
  GetActiveWorkflowsHandler,
];

const EventHandlers = [
  PaymentCreatedEventHandler,
  PaymentStatusUpdatedEventHandler,
];

@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    TypeOrmModule.forFeature([PaymentOrmEntity]),
    InfrastructureModule,
  ],
  controllers: [
    PaymentController,
    MercadoPagoWebhookController,
  ],
  providers: [
    // Domain Services
    PaymentValidationService,

    // Application Handlers
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,

    // Infrastructure
    {
      provide: IPaymentRepository,
      useClass: PaymentRepository,
    },
  ],
  exports: [
    IPaymentRepository,
    PaymentValidationService,
  ],
})
export class PaymentModule {}
