import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, Length, Min } from 'class-validator';
import { PaymentMethod } from '../../domain/entities';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  cpf: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}