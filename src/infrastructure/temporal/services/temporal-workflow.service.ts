import { Injectable, Logger, Inject } from '@nestjs/common';
import { WorkflowClient } from '@temporalio/client';
import { CreditCardPaymentInput, PaymentWorkflowState } from '../workflows';
import { PaymentStatus } from '../../../domain/entities';
import { IPaymentWorkflowService, CreditCardPaymentWorkflowInput, PaymentWorkflowResult } from '../../../application/interfaces/payment-workflow.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TemporalWorkflowService implements IPaymentWorkflowService {
  private readonly logger = new Logger(TemporalWorkflowService.name);

  constructor(
    @Inject('TEMPORAL_CLIENT') private readonly client: WorkflowClient,
  ) {}

  async startCreditCardPaymentWorkflow(input: CreditCardPaymentWorkflowInput): Promise<PaymentWorkflowResult> {
    try {
      const workflowId = `credit-card-payment-${input.paymentId}-${uuidv4()}`;

      this.logger.log(`Starting credit card payment workflow for payment ${input.paymentId}`);

      if (!this.client) {
        this.logger.warn('Temporal client not available, workflow will run in mock mode');
        return {
          workflowId,
          runId: 'mock-run-id',
        };
      }

      // Convert interface input to workflow input
      const workflowInput: CreditCardPaymentInput = {
        paymentId: input.paymentId,
        cpf: input.cpf,
        description: input.description,
        amount: input.amount,
        preferenceUrl: input.preferenceUrl,
        payer: input.payer
      };

      const handle = await this.client.start('creditCardPaymentWorkflow', {
        taskQueue: 'payment-queue',
        workflowId,
        args: [workflowInput],
      });

      this.logger.log(`Credit card payment workflow started: ${workflowId} (run: ${handle.firstExecutionRunId})`);

      return {
        workflowId,
        runId: handle.firstExecutionRunId,
      };
    } catch (error) {
      this.logger.error(`Failed to start credit card payment workflow: ${error.message}`, error.stack);
      throw error;
    }
  }

  async notifyPaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    mercadoPagoPaymentId?: string
  ): Promise<void> {
    try {
      this.logger.log(`Payment status notification received: ${paymentId} -> ${status} (MP ID: ${mercadoPagoPaymentId})`);

      // O workflow fará polling para verificar mudanças de status
      // Esta notificação é registrada para auditoria
      this.logger.log(`Payment status update logged for payment ${paymentId}`);

    } catch (error) {
      this.logger.error(`Failed to process payment status notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async cancelPayment(paymentId: string): Promise<void> {
    try {
      this.logger.log(`Payment cancellation requested: ${paymentId}`);
      // Em uma implementação real, sinalizaria o workflow correspondente
    } catch (error) {
      this.logger.error(`Failed to cancel payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPaymentWorkflowState(paymentId: string): Promise<PaymentWorkflowState | null> {
    try {
      // Retorna estado básico - em implementação real consultaria o workflow
      return {
        paymentId,
        status: PaymentStatus.PENDING,
        lastUpdated: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to get payment workflow state: ${error.message}`, error.stack);
      return null;
    }
  }

  async listActivePaymentWorkflows(): Promise<PaymentWorkflowState[]> {
    try {
      // Retorna lista vazia - em implementação real listaria workflows ativos
      return [];
    } catch (error) {
      this.logger.error(`Failed to list active payment workflows: ${error.message}`, error.stack);
      return [];
    }
  }
}
