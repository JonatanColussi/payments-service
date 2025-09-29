import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { NotifyPaymentStatusHandler } from './notify-payment-status.handler';
import { NotifyPaymentStatusCommand } from '../commands/notify-payment-status.command';
import { IPaymentWorkflowService } from '../interfaces/payment-workflow.interface';
import { PaymentStatus } from '../../domain/entities';

describe('NotifyPaymentStatusHandler', () => {
  let handler: NotifyPaymentStatusHandler;
  let paymentWorkflowService: jest.Mocked<IPaymentWorkflowService>;
  let logger: jest.Mocked<Logger>;

  const mockPaymentWorkflowService = {
    startCreditCardPaymentWorkflow: jest.fn(),
    notifyPaymentStatus: jest.fn(),
    cancelPayment: jest.fn(),
    getPaymentWorkflowState: jest.fn(),
    listActivePaymentWorkflows: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotifyPaymentStatusHandler,
        {
          provide: IPaymentWorkflowService,
          useValue: mockPaymentWorkflowService,
        },
      ],
    }).compile();

    handler = module.get<NotifyPaymentStatusHandler>(NotifyPaymentStatusHandler);
    paymentWorkflowService = module.get(IPaymentWorkflowService);

    // Mock logger
    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;
    (handler as any).logger = logger;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should notify payment status successfully', async () => {
      // Arrange
      const command = new NotifyPaymentStatusCommand(
        'test-payment-id',
        PaymentStatus.PAID,
        'mercadopago-payment-123'
      );

      mockPaymentWorkflowService.notifyPaymentStatus.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(paymentWorkflowService.notifyPaymentStatus).toHaveBeenCalledWith(
        'test-payment-id',
        PaymentStatus.PAID,
        'mercadopago-payment-123'
      );
      expect(paymentWorkflowService.notifyPaymentStatus).toHaveBeenCalledTimes(1);
      expect(logger.log).toHaveBeenCalledWith('Notifying payment status: test-payment-id -> PAID');
      expect(logger.log).toHaveBeenCalledWith('Payment status notification sent successfully: test-payment-id');
    });

    it('should notify payment status without mercadoPagoPaymentId', async () => {
      // Arrange
      const command = new NotifyPaymentStatusCommand(
        'test-payment-id',
        PaymentStatus.FAIL
      );

      mockPaymentWorkflowService.notifyPaymentStatus.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(paymentWorkflowService.notifyPaymentStatus).toHaveBeenCalledWith(
        'test-payment-id',
        PaymentStatus.FAIL,
        undefined
      );
      expect(logger.log).toHaveBeenCalledWith('Notifying payment status: test-payment-id -> FAIL');
    });

    it('should handle workflow service errors', async () => {
      // Arrange
      const command = new NotifyPaymentStatusCommand(
        'test-payment-id',
        PaymentStatus.PAID
      );

      const workflowError = new Error('Workflow service unavailable');
      mockPaymentWorkflowService.notifyPaymentStatus.mockRejectedValue(workflowError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Workflow service unavailable');
      expect(paymentWorkflowService.notifyPaymentStatus).toHaveBeenCalledWith(
        'test-payment-id',
        PaymentStatus.PAID,
        undefined
      );
      expect(logger.log).toHaveBeenCalledWith('Notifying payment status: test-payment-id -> PAID');
      expect(logger.log).not.toHaveBeenCalledWith('Payment status notification sent successfully: test-payment-id');
    });

    it('should handle all payment statuses correctly', async () => {
      // Arrange & Act & Assert for each status
      const statuses = [
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        PaymentStatus.FAIL,
        PaymentStatus.FAIL
      ];

      for (const status of statuses) {
        const command = new NotifyPaymentStatusCommand('test-payment-id', status);
        mockPaymentWorkflowService.notifyPaymentStatus.mockResolvedValue(undefined);

        await handler.execute(command);

        expect(paymentWorkflowService.notifyPaymentStatus).toHaveBeenCalledWith(
          'test-payment-id',
          status,
          undefined
        );
      }

      expect(paymentWorkflowService.notifyPaymentStatus).toHaveBeenCalledTimes(4);
    });
  });
});