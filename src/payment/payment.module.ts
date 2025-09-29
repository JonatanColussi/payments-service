import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

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
} from '../application/handlers';

// Infrastructure
import { PaymentOrmEntity, PaymentRepository } from '../infrastructure';

// Presentation
import { PaymentController } from '../presentation/controllers/payment.controller';
import { IPaymentRepository } from '../domain';

const CommandHandlers = [
  CreatePaymentHandler,
  UpdatePaymentStatusHandler,
];

const QueryHandlers = [
  GetPaymentByIdHandler,
  GetPaymentsByFiltersHandler,
];

const EventHandlers = [
  PaymentCreatedEventHandler,
  PaymentStatusUpdatedEventHandler,
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([PaymentOrmEntity]),
  ],
  controllers: [PaymentController],
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
    'IPaymentRepository',
    PaymentValidationService,
  ],
})
export class PaymentModule {}
