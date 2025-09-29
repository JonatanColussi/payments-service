import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CancelPaymentHandler } from './cancel-payment.handler';
import { CancelPaymentCommand } from '../commands/cancel-payment.command';
import { IPaymentWorkflowService } from '../interfaces/payment-workflow.interface';

describe('CancelPaymentHandler', () => {
  let handler: CancelPaymentHandler;
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
        CancelPaymentHandler,
        {
          provide: IPaymentWorkflowService,
          useValue: mockPaymentWorkflowService,
        },
      ],
    }).compile();

    handler = module.get<CancelPaymentHandler>(CancelPaymentHandler);
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
    it('should cancel payment successfully', async () => {
      // Arrange
      const command = new CancelPaymentCommand('test-payment-id');
      mockPaymentWorkflowService.cancelPayment.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(paymentWorkflowService.cancelPayment).toHaveBeenCalledWith('test-payment-id');
      expect(paymentWorkflowService.cancelPayment).toHaveBeenCalledTimes(1);
      expect(logger.log).toHaveBeenCalledWith('Cancelling payment: test-payment-id');
      expect(logger.log).toHaveBeenCalledWith('Payment cancellation request sent: test-payment-id');
    });

    it('should handle workflow service errors', async () => {
      // Arrange
      const command = new CancelPaymentCommand('test-payment-id');
      const workflowError = new Error('Payment not found in workflow');
      mockPaymentWorkflowService.cancelPayment.mockRejectedValue(workflowError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Payment not found in workflow');
      expect(paymentWorkflowService.cancelPayment).toHaveBeenCalledWith('test-payment-id');
      expect(logger.log).toHaveBeenCalledWith('Cancelling payment: test-payment-id');
      expect(logger.log).not.toHaveBeenCalledWith('Payment cancellation request sent: test-payment-id');
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      const command = new CancelPaymentCommand('test-payment-id');
      const timeoutError = new Error('Request timeout');
      mockPaymentWorkflowService.cancelPayment.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Request timeout');
      expect(paymentWorkflowService.cancelPayment).toHaveBeenCalledWith('test-payment-id');
    });

    it('should handle empty payment ID gracefully', async () => {
      // Arrange
      const command = new CancelPaymentCommand('');
      mockPaymentWorkflowService.cancelPayment.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(paymentWorkflowService.cancelPayment).toHaveBeenCalledWith('');
      expect(logger.log).toHaveBeenCalledWith('Cancelling payment: ');
    });
  });
});