import { proxyActivities, defineSignal, defineQuery, setHandler, condition } from '@temporalio/workflow';
import { PaymentStatus } from '../../../domain/entities';
import type * as activities from '../activities';

export interface CreditCardPaymentInput {
  paymentId: string;
  cpf: string;
  description: string;
  amount: number;
  payer?: {
    email?: string;
    name?: string;
  };
}

export interface PaymentWorkflowState {
  paymentId: string;
  status: PaymentStatus;
  mercadoPagoPreferenceUrl?: string;
  mercadoPagoPaymentId?: string;
  error?: string;
  lastUpdated: Date;
}

// Signals e Queries
export const paymentStatusSignal = defineSignal<[{ paymentId: string; status: PaymentStatus; mercadoPagoPaymentId?: string }]>('paymentStatus');
export const cancelPaymentSignal = defineSignal('cancelPayment');
export const getPaymentStateQuery = defineQuery<PaymentWorkflowState>('getPaymentState');

// Proxy das activities
const {
  savePaymentToDatabase,
  createMercadoPagoPreference,
  updatePaymentStatus,
  checkPaymentStatus,
  logActivity
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    initialInterval: '1s',
    maximumInterval: '30s',
    maximumAttempts: 3,
  },
});

export async function creditCardPaymentWorkflow(input: CreditCardPaymentInput): Promise<PaymentWorkflowState> {
  let workflowState: PaymentWorkflowState = {
    paymentId: input.paymentId,
    status: PaymentStatus.PENDING,
    lastUpdated: new Date()
  };

  let paymentCompleted = false;
  let paymentCancelled = false;

  // Configurar handlers para signals e queries
  setHandler(paymentStatusSignal, async ({ paymentId, status, mercadoPagoPaymentId }) => {
    if (paymentId === input.paymentId) {
      await logActivity(`Received payment status signal: ${status} for payment ${paymentId}`);

      workflowState.status = status;
      workflowState.mercadoPagoPaymentId = mercadoPagoPaymentId;
      workflowState.lastUpdated = new Date();

      if (status === PaymentStatus.PAID || status === PaymentStatus.FAIL) {
        paymentCompleted = true;
      }
    }
  });

  setHandler(cancelPaymentSignal, () => {
    paymentCancelled = true;
  });

  setHandler(getPaymentStateQuery, () => workflowState);

  try {
    // Etapa 1: Salvar pagamento no banco com status PENDING
    await logActivity(`Starting credit card payment workflow for payment ${input.paymentId}`);

    await savePaymentToDatabase({
      paymentId: input.paymentId,
      cpf: input.cpf,
      description: input.description,
      amount: input.amount,
      paymentMethod: 'CREDIT_CARD'
    });

    await logActivity(`Payment ${input.paymentId} saved to database with PENDING status`);

    // Etapa 2: Criar preferência no Mercado Pago
    const preferenceUrl = await createMercadoPagoPreference({
      paymentId: input.paymentId,
      items: [
        {
          title: input.description,
          description: input.description,
          quantity: 1,
          unit_price: input.amount,
          currency_id: 'BRL'
        }
      ],
      payer: input.payer
    });

    workflowState.mercadoPagoPreferenceUrl = preferenceUrl;
    workflowState.lastUpdated = new Date();

    await logActivity(`MercadoPago preference created for payment ${input.paymentId}: ${preferenceUrl}`);

    // Etapa 3: Aguardar callback ou fazer polling (com timeout)
    const timeoutMinutes = 30;
    const pollingIntervalMinutes = 2;
    const maxPollingAttempts = timeoutMinutes / pollingIntervalMinutes;

    let pollingAttempts = 0;

    while (!paymentCompleted && !paymentCancelled && pollingAttempts < maxPollingAttempts) {
      // Aguardar por signal ou timeout de polling
      const received = await condition(() => paymentCompleted || paymentCancelled, `${pollingIntervalMinutes}m`);

      if (!received) {
        // Timeout atingido, fazer polling
        pollingAttempts++;
        await logActivity(`Polling attempt ${pollingAttempts}/${maxPollingAttempts} for payment ${input.paymentId}`);

        const currentStatus = await checkPaymentStatus({ paymentId: input.paymentId });

        if (currentStatus && currentStatus !== PaymentStatus.PENDING) {
          workflowState.status = currentStatus;
          workflowState.lastUpdated = new Date();

          if (currentStatus === PaymentStatus.PAID || currentStatus === PaymentStatus.FAIL) {
            paymentCompleted = true;
            await logActivity(`Payment ${input.paymentId} status updated via polling: ${currentStatus}`);
          }
        }
      }
    }

    // Etapa 4: Verificar resultado final
    if (paymentCancelled) {
      workflowState.status = PaymentStatus.FAIL;
      workflowState.error = 'Payment cancelled by user';
      await logActivity(`Payment ${input.paymentId} was cancelled`);
    } else if (!paymentCompleted) {
      // Timeout atingido sem resolução
      workflowState.status = PaymentStatus.FAIL;
      workflowState.error = 'Payment timeout - no response from MercadoPago';
      await logActivity(`Payment ${input.paymentId} timed out after ${timeoutMinutes} minutes`);
    }

    // Etapa 5: Atualizar status final no banco de dados
    await updatePaymentStatus({
      paymentId: input.paymentId,
      status: workflowState.status,
      mercadoPagoPaymentId: workflowState.mercadoPagoPaymentId
    });

    workflowState.lastUpdated = new Date();

    await logActivity(`Credit card payment workflow completed for payment ${input.paymentId} with status: ${workflowState.status}`);

    return workflowState;

  } catch (error) {
    await logActivity(`Error in credit card payment workflow for payment ${input.paymentId}: ${error.message}`);

    workflowState.status = PaymentStatus.FAIL;
    workflowState.error = error.message;
    workflowState.lastUpdated = new Date();

    // Tentar atualizar status de erro no banco
    try {
      await updatePaymentStatus({
        paymentId: input.paymentId,
        status: PaymentStatus.FAIL
      });
    } catch (updateError) {
      await logActivity(`Failed to update error status in database: ${updateError.message}`);
    }

    return workflowState;
  }
}
