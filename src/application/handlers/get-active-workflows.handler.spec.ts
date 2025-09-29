import { Test, TestingModule } from '@nestjs/testing';
import { GetActiveWorkflowsHandler } from './get-active-workflows.handler';
import { IPaymentWorkflowService, PaymentWorkflowState } from '../interfaces/payment-workflow.interface';
import { PaymentStatus } from '../../domain/entities';

describe('GetActiveWorkflowsHandler', () => {
  let handler: GetActiveWorkflowsHandler;
  let paymentWorkflowService: jest.Mocked<IPaymentWorkflowService>;

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
        GetActiveWorkflowsHandler,
        {
          provide: IPaymentWorkflowService,
          useValue: mockPaymentWorkflowService,
        },
      ],
    }).compile();

    handler = module.get<GetActiveWorkflowsHandler>(GetActiveWorkflowsHandler);
    paymentWorkflowService = module.get(IPaymentWorkflowService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return list of active workflows', async () => {
      // Arrange
      const mockActiveWorkflows: PaymentWorkflowState[] = [
        {
          paymentId: 'payment-1',
          status: PaymentStatus.PENDING,
          mercadoPagoPreferenceUrl: 'https://mercadopago.com/preference/1',
          lastUpdated: new Date('2023-01-01T12:00:00Z'),
        },
        {
          paymentId: 'payment-2',
          status: PaymentStatus.PENDING,
          mercadoPagoPreferenceUrl: 'https://mercadopago.com/preference/2',
          lastUpdated: new Date('2023-01-01T12:05:00Z'),
        },
      ];

      mockPaymentWorkflowService.listActivePaymentWorkflows.mockResolvedValue(mockActiveWorkflows);

      // Act
      const result = await handler.execute();

      // Assert
      expect(paymentWorkflowService.listActivePaymentWorkflows).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockActiveWorkflows);
      expect(result).toHaveLength(2);
      expect(result[0].paymentId).toBe('payment-1');
      expect(result[1].paymentId).toBe('payment-2');
    });

    it('should return empty array when no active workflows', async () => {
      // Arrange
      mockPaymentWorkflowService.listActivePaymentWorkflows.mockResolvedValue([]);

      // Act
      const result = await handler.execute();

      // Assert
      expect(paymentWorkflowService.listActivePaymentWorkflows).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return workflows with different statuses', async () => {
      // Arrange
      const mockActiveWorkflows: PaymentWorkflowState[] = [
        {
          paymentId: 'payment-pending',
          status: PaymentStatus.PENDING,
          lastUpdated: new Date('2023-01-01T12:00:00Z'),
        },
        {
          paymentId: 'payment-processing',
          status: PaymentStatus.PENDING,
          mercadoPagoPaymentId: 'mp-123',
          lastUpdated: new Date('2023-01-01T12:05:00Z'),
        },
      ];

      mockPaymentWorkflowService.listActivePaymentWorkflows.mockResolvedValue(mockActiveWorkflows);

      // Act
      const result = await handler.execute();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(PaymentStatus.PENDING);
      expect(result[1].status).toBe(PaymentStatus.PENDING);
      expect(result[1].mercadoPagoPaymentId).toBe('mp-123');
    });

    it('should handle workflow service errors', async () => {
      // Arrange
      const workflowError = new Error('Failed to retrieve active workflows');
      mockPaymentWorkflowService.listActivePaymentWorkflows.mockRejectedValue(workflowError);

      // Act & Assert
      await expect(handler.execute()).rejects.toThrow('Failed to retrieve active workflows');
      expect(paymentWorkflowService.listActivePaymentWorkflows).toHaveBeenCalledTimes(1);
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      mockPaymentWorkflowService.listActivePaymentWorkflows.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(handler.execute()).rejects.toThrow('Request timeout');
    });

    it('should return workflows with error information', async () => {
      // Arrange
      const mockActiveWorkflows: PaymentWorkflowState[] = [
        {
          paymentId: 'payment-with-error',
          status: PaymentStatus.PENDING,
          error: 'Temporary network error',
          lastUpdated: new Date('2023-01-01T12:00:00Z'),
        },
      ];

      mockPaymentWorkflowService.listActivePaymentWorkflows.mockResolvedValue(mockActiveWorkflows);

      // Act
      const result = await handler.execute();

      // Assert
      expect(result[0].error).toBe('Temporary network error');
      expect(result[0].status).toBe(PaymentStatus.PENDING);
    });
  });
});
