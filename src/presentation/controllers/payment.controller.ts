import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post, Query,
  ValidationPipe
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CreatePaymentDto,
  UpdatePaymentStatusDto,
  PaymentResponseDto,
  CreatePaymentCommand,
  UpdatePaymentStatusCommand,
  GetPaymentByIdQuery,
  GetPaymentsByFiltersQuery,
} from '../../application';
import { PaymentStatus } from '../../domain/entities';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Body(new ValidationPipe({ transform: true })) createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const command = new CreatePaymentCommand(
      createPaymentDto.cpf,
      createPaymentDto.description,
      createPaymentDto.amount,
      createPaymentDto.paymentMethod,
    );

    return this.commandBus.execute(command);
  }

  @Get(':id')
  async getPaymentById(@Param('id') id: string): Promise<PaymentResponseDto> {
    const query = new GetPaymentByIdQuery(id);
    return this.queryBus.execute(query);
  }

  @Get()
  async getPayments(
    @Query('cpf') cpf?: string,
    @Query('status') status?: PaymentStatus,
  ): Promise<PaymentResponseDto[]> {
    const query = new GetPaymentsByFiltersQuery({ cpf, status });
    return this.queryBus.execute(query);
  }

  @Patch(':id/status')
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) updateStatusDto: UpdatePaymentStatusDto,
  ): Promise<PaymentResponseDto> {
    const command = new UpdatePaymentStatusCommand(id, updateStatusDto.status);
    return this.commandBus.execute(command);
  }
}
