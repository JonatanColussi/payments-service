import { IsEnum } from 'class-validator';
import { PaymentStatus } from '../../domain/entities';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}