import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { PaymentModule } from './payment/payment.module';
import databaseConfig from './config/database.config';
import { TemporalNestModule } from './infrastructure/temporal/temporal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => databaseConfig(),
    }),
    HealthModule,
    PaymentModule,
    TemporalNestModule,
  ],
})
export class AppModule {}
