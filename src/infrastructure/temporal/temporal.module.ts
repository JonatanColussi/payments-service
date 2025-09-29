import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WorkflowClient, Connection } from '@temporalio/client';
import { PaymentActivitiesService } from './services/payment-activities.service';
import { TemporalWorkflowService } from './services/temporal-workflow.service';
import { MercadoPagoService } from '../external/mercadopago.service';
import { IPaymentRepository } from '../../domain/interfaces';
import { IPaymentWorkflowService } from '../../application/interfaces/payment-workflow.interface';
import { PaymentRepository } from '../repositories/payment.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentOrmEntity } from '../persistence/payment.orm-entity';
import databaseConfig from '../../config/database.config';
import mercadoPagoConfig from '../../config/mercadopago.config';

@Module({
  imports: [
    ConfigModule.forFeature(mercadoPagoConfig),
    TypeOrmModule.forRootAsync({
      useFactory: () => databaseConfig(),
    }),
    TypeOrmModule.forFeature([PaymentOrmEntity]),
  ],
  providers: [
    PaymentActivitiesService,
    TemporalWorkflowService,
    MercadoPagoService,
    {
      provide: IPaymentRepository,
      useClass: PaymentRepository,
    },
    {
      provide: IPaymentWorkflowService,
      useClass: TemporalWorkflowService,
    },
    {
      provide: 'TEMPORAL_CLIENT',
      useFactory: async (configService: ConfigService) => {
        try {
          const connection = await Connection.connect({
            address: configService.get<string>('TEMPORAL_SERVER_URL', 'localhost:7233'),
          });

          return new WorkflowClient({
            connection,
            namespace: configService.get<string>('TEMPORAL_NAMESPACE', 'default'),
          });
        } catch (error) {
          console.error('Failed to connect to Temporal:', error.message);
          // Retornar um mock client para não quebrar a aplicação
          return null;
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    PaymentActivitiesService,
    TemporalWorkflowService,
    MercadoPagoService,
    IPaymentRepository,
    IPaymentWorkflowService,
  ],
})
export class TemporalNestModule {}
