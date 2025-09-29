import { Module } from '@nestjs/common';
import { TemporalNestModule } from './temporal/temporal.module';

@Module({
  imports: [
    TemporalNestModule,
  ],
  exports: [
    TemporalNestModule,
  ],
})
export class InfrastructureModule {}
