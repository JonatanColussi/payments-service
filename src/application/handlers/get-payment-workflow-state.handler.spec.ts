import { Test, TestingModule } from '@nestjs/testing';
import { GetPaymentWorkflowStateHandler } from './get-payment-workflow-state.handler';
import { GetPaymentWorkflowStateQuery } from '../queries/get-payment-workflow-state.query';
import { IPaymentWorkflowService, PaymentWorkflowState } from '../interfaces/payment-workflow.interface';
import { PaymentStatus } from '../../domain/entities';

describe('GetPaymentWorkflowStateHandler', () => {
  let handler: GetPaymentWorkflowStateHandler;
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
        GetPaymentWorkflowStateHandler,
        {
          provide: IPaymentWorkflowService,
          useValue: mockPaymentWorkflowService,
        },
      ],
    }).compile();

    handler = module.get<GetPaymentWorkflowStateHandler>(GetPaymentWorkflowStateHandler);
    paymentWorkflowService = module.get(IPaymentWorkflowService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return payment workflow state when found', async () => {
      // Arrange
      const query = new GetPaymentWorkflowStateQuery('test-payment-id');
      
      const mockWorkflowState: PaymentWorkflowState = {
        paymentId: 'test-payment-id',
        status: PaymentStatus.PENDING,
        mercadoPagoPreferenceUrl: 'https://mercadopago.com/preference/123',
        mercadoPagoPaymentId: 'mp-payment-456',
        lastUpdated: new Date('2023-01-01T12:00:00Z'),
      };

      mockPaymentWorkflowService.getPaymentWorkflowState.mockResolvedValue(mockWorkflowState);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(paymentWorkflowService.getPaymentWorkflowState).toHaveBeenCalledWith('test-payment-id');
      expect(paymentWorkflowService.getPaymentWorkflowState).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockWorkflowState);
    });

    it('should return null when workflow state not found', async () => {
      // Arrange
      const query = new GetPaymentWorkflowStateQuery('non-existent-payment');
      mockPaymentWorkflowService.getPaymentWorkflowState.mockResolvedValue(null);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(paymentWorkflowService.getPaymentWorkflowState).toHaveBeenCalledWith('non-existent-payment');
      expect(result).toBeNull();
    });

    it('should return workflow state with error information', async () => {
      // Arrange
      const query = new GetPaymentWorkflowStateQuery('failed-payment-id');
      
      const mockWorkflowState: PaymentWorkflowState = {
        paymentId: 'failed-payment-id',
        status: PaymentStatus.FAIL,
        error: 'Payment processing timeout',
        lastUpdated: new Date('2023-01-01T12:00:00Z'),
      };

      mockPaymentWorkflowService.getPaymentWorkflowState.mockResolvedValue(mockWorkflowState);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(mockWorkflowState);
      expect(result?.error).toBe('Payment processing timeout');
      expect(result?.status).toBe(PaymentStatus.FAIL);
    });

    it('should handle workflow service errors', async () => {
      // Arrange
      const query = new GetPaymentWorkflowStateQuery('test-payment-id');
      const workflowError = new Error('Workflow service unavailable');
      mockPaymentWorkflowService.getPaymentWorkflowState.mockRejectedValue(workflowError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow('Workflow service unavailable');
      expect(paymentWorkflowService.getPaymentWorkflowState).toHaveBeenCalledWith('test-payment-id');
    });

    it('should handle all payment statuses in workflow state', async () => {
      // Arrange & Act & Assert for each status
      const statuses = [
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        PaymentStatus.FAIL,
        PaymentStatus.FAIL
      ];

      for (const status of statuses) {
        const query = new GetPaymentWorkflowStateQuery(`payment-${status.toLowerCase()}`);
        const mockState: PaymentWorkflowState = {
          paymentId: `payment-${status.toLowerCase()}`,
          status,
          lastUpdated: new Date(),
        };

        mockPaymentWorkflowService.getPaymentWorkflowState.mockResolvedValue(mockState);

        const result = await handler.execute(query);

        expect(result?.status).toBe(status);
        expect(result?.paymentId).toBe(`payment-${status.toLowerCase()}`);
      }
    });
  });
});