import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, Length, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentMethod } from '../../domain/entities';

export class CreatePaymentRequestDto {
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, { message: 'CPF must have exactly 11 digits' })
  @Transform(({ value }) => value?.replace(/\D/g, ''))
  cpf: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 500, { message: 'Description must be between 1 and 500 characters' })
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must have at most 2 decimal places' })
  @IsPositive({ message: 'Amount must be positive' })
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsEnum(PaymentMethod, { message: 'Payment method must be either PIX or CREDIT_CARD' })
  paymentMethod: PaymentMethod;
}