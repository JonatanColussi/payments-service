import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  Get,
  Param,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { MercadoPagoService } from '../../infrastructure/external/mercadopago.service';
import { MercadoPagoNotification } from '../../domain/entities/mercadopago-payment.entity';
import { PaymentStatus } from '../../domain/entities';
import { NotifyPaymentStatusCommand } from '../../application/commands/notify-payment-status.command';
import { CancelPaymentCommand } from '../../application/commands/cancel-payment.command';
import { GetPaymentWorkflowStateQuery } from '../../application/queries/get-payment-workflow-state.query';
import { GetActiveWorkflowsQuery } from '../../application/queries/get-active-workflows.query';

@Controller('webhooks/mercadopago')
export class MercadoPagoWebhookController {
  private readonly logger = new Logger(MercadoPagoWebhookController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  @Post('notifications')
  @HttpCode(HttpStatus.OK)
  async handleNotification(
    @Body() notification: MercadoPagoNotification,
  ): Promise<{ status: string }> {
    try {
      this.logger.log(`Received MercadoPago notification: ${JSON.stringify(notification)}`);

      // Validar se é uma notificação de pagamento
      if (notification.type !== 'payment') {
        this.logger.warn(`Ignoring non-payment notification: ${notification.type}`);
        return { status: 'ignored' };
      }

      // Buscar informações detalhadas do pagamento
      const paymentStatus = await this.mercadoPagoService.getPaymentStatus(notification.data.id);

      if (!paymentStatus) {
        this.logger.error(`Payment not found in MercadoPago: ${notification.data.id}`);
        throw new BadRequestException('Payment not found');
      }

      // Mapear status do MercadoPago para nosso enum
      const mappedStatus = this.mercadoPagoService.mapMercadoPagoStatusToPaymentStatus(paymentStatus.status);

      // Notificar o workflow do Temporal via Command
      const notifyCommand = new NotifyPaymentStatusCommand(
        paymentStatus.external_reference, // nosso paymentId
        mappedStatus as PaymentStatus,
        paymentStatus.id
      );

      await this.commandBus.execute(notifyCommand);

      this.logger.log(
        `Payment status notification sent to Temporal workflow: ${paymentStatus.external_reference} -> ${mappedStatus}`
      );

      return { status: 'processed' };
    } catch (error) {
      this.logger.error(`Error processing MercadoPago notification: ${error.message}`, error.stack);

      // Retornar 200 mesmo em caso de erro para evitar reenvios desnecessários
      // mas logar o erro para investigação
      return { status: 'error' };
    }
  }

  @Get('payment-status/:paymentId')
  async getPaymentWorkflowStatus(@Param('paymentId') paymentId: string) {
    try {
      this.logger.log(`Getting workflow status for payment: ${paymentId}`);

      const query = new GetPaymentWorkflowStateQuery(paymentId);
      const workflowState = await this.queryBus.execute(query);

      if (!workflowState) {
        return {
          paymentId,
          status: 'not_found',
          message: 'Payment workflow not found'
        };
      }

      return {
        paymentId: workflowState.paymentId,
        status: workflowState.status,
        mercadoPagoPreferenceUrl: workflowState.mercadoPagoPreferenceUrl,
        mercadoPagoPaymentId: workflowState.mercadoPagoPaymentId,
        lastUpdated: workflowState.lastUpdated,
        error: workflowState.error
      };
    } catch (error) {
      this.logger.error(`Error getting payment workflow status: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to get payment status');
    }
  }

  @Post('cancel-payment/:paymentId')
  @HttpCode(HttpStatus.OK)
  async cancelPayment(@Param('paymentId') paymentId: string): Promise<{ status: string }> {
    try {
      this.logger.log(`Cancelling payment: ${paymentId}`);

      const cancelCommand = new CancelPaymentCommand(paymentId);
      await this.commandBus.execute(cancelCommand);

      return { status: 'cancelled' };
    } catch (error) {
      this.logger.error(`Error cancelling payment: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to cancel payment');
    }
  }

  @Get('active-workflows')
  async getActiveWorkflows() {
    try {
      const query = new GetActiveWorkflowsQuery();
      const activeWorkflows = await this.queryBus.execute(query);

      return {
        count: activeWorkflows.length,
        workflows: activeWorkflows.map(workflow => ({
          paymentId: workflow.paymentId,
          status: workflow.status,
          lastUpdated: workflow.lastUpdated,
          mercadoPagoPreferenceUrl: workflow.mercadoPagoPreferenceUrl
        }))
      };
    } catch (error) {
      this.logger.error(`Error listing active workflows: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to list active workflows');
    }
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }

}
