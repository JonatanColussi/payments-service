import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { MercadoPagoWebhookController } from './mercadopago-webhook.controller';
import { MercadoPagoService } from '../../infrastructure/external/mercadopago.service';
import { MercadoPagoNotification } from '../../domain/entities/mercadopago-payment.entity';
import { PaymentStatus } from '../../domain/entities';
import { GetActiveWorkflowsQuery } from '../../application/queries/get-active-workflows.query';
import { PaymentWorkflowState } from '../../application/interfaces/payment-workflow.interface';

describe('MercadoPagoWebhookController', () => {
  let controller: MercadoPagoWebhookController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let mercadoPagoService: jest.Mocked<MercadoPagoService>;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockQueryBus = {
    execute: jest.fn(),
  };

  const mockMercadoPagoService = {
    getPaymentStatus: jest.fn(),
    mapMercadoPagoStatusToPaymentStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MercadoPagoWebhookController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: MercadoPagoService,
          useValue: mockMercadoPagoService,
        },
      ],
    }).compile();

    controller = module.get<MercadoPagoWebhookController>(MercadoPagoWebhookController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
    mercadoPagoService = module.get(MercadoPagoService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('handleNotification', () => {
    const mockNotification: MercadoPagoNotification = {
      action: 'payment.updated',
      api_version: 'v1',
      application_id: 'app-123456',
      data: {
        id: 'mp-payment-123456',
      },
      date_created: '2023-01-01T12:00:00Z',
      id: '12345',
      live_mode: false,
      type: 'payment',
      user_id: '123456789',
      version: 1,
    };

    const mockPaymentStatus = {
      id: 'mp-payment-123456',
      status: 'approved' as const,
      status_detail: 'accredited',
      external_reference: 'payment-123',
      transaction_amount: 100.00,
      date_created: '2023-01-01T12:00:00Z',
      date_approved: '2023-01-01T12:01:00Z',
    };

    it('should process payment notification successfully', async () => {
      // Arrange
      mercadoPagoService.getPaymentStatus.mockResolvedValue(mockPaymentStatus);
      mercadoPagoService.mapMercadoPagoStatusToPaymentStatus.mockReturnValue('PAID');
      commandBus.execute.mockResolvedValue(undefined);

      // Act
      const result = await controller.handleNotification(mockNotification);

      // Assert
      expect(mercadoPagoService.getPaymentStatus).toHaveBeenCalledWith('mp-payment-123456');
      expect(mercadoPagoService.mapMercadoPagoStatusToPaymentStatus).toHaveBeenCalledWith('approved');
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: 'payment-123',
          status: 'PAID',
          mercadoPagoPaymentId: 'mp-payment-123456',
        })
      );
      expect(result).toEqual({ status: 'processed' });
    });

    it('should ignore non-payment notifications', async () => {
      // Arrange
      const nonPaymentNotification = {
        ...mockNotification,
        type: 'plan' as any,
      };

      // Act
      const result = await controller.handleNotification(nonPaymentNotification);

      // Assert
      expect(mercadoPagoService.getPaymentStatus).not.toHaveBeenCalled();
      expect(commandBus.execute).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'ignored' });
    });

    it('should handle payment not found in MercadoPago', async () => {
      // Arrange
      mercadoPagoService.getPaymentStatus.mockResolvedValue(null);

      // Act
      const result = await controller.handleNotification(mockNotification);

      // Assert
      expect(result).toEqual({ status: 'error' });
    });

    it('should handle MercadoPago service errors gracefully', async () => {
      // Arrange
      mercadoPagoService.getPaymentStatus.mockRejectedValue(new Error('MercadoPago API error'));

      // Act
      const result = await controller.handleNotification(mockNotification);

      // Assert
      expect(result).toEqual({ status: 'error' });
    });

    it('should handle command bus errors gracefully', async () => {
      // Arrange
      mercadoPagoService.getPaymentStatus.mockResolvedValue(mockPaymentStatus);
      mercadoPagoService.mapMercadoPagoStatusToPaymentStatus.mockReturnValue('PAID');
      commandBus.execute.mockRejectedValue(new Error('Command execution failed'));

      // Act
      const result = await controller.handleNotification(mockNotification);

      // Assert
      expect(result).toEqual({ status: 'error' });
    });
  });

  describe('getPaymentWorkflowStatus', () => {
    it('should return workflow status successfully', async () => {
      // Arrange
      const mockWorkflowState: PaymentWorkflowState = {
        paymentId: 'payment-123',
        status: PaymentStatus.PENDING,
        mercadoPagoPreferenceUrl: 'https://mercadopago.com/preference/123',
        mercadoPagoPaymentId: 'mp-payment-456',
        lastUpdated: new Date('2023-01-01T12:00:00Z'),
      };

      queryBus.execute.mockResolvedValue(mockWorkflowState);

      // Act
      const result = await controller.getPaymentWorkflowStatus('payment-123');

      // Assert
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: 'payment-123',
        })
      );
      expect(result).toEqual({
        paymentId: 'payment-123',
        status: PaymentStatus.PENDING,
        mercadoPagoPreferenceUrl: 'https://mercadopago.com/preference/123',
        mercadoPagoPaymentId: 'mp-payment-456',
        lastUpdated: new Date('2023-01-01T12:00:00Z'),
        error: undefined,
      });
    });

    it('should return not found when workflow state is null', async () => {
      // Arrange
      queryBus.execute.mockResolvedValue(null);

      // Act
      const result = await controller.getPaymentWorkflowStatus('non-existent-payment');

      // Assert
      expect(result).toEqual({
        paymentId: 'non-existent-payment',
        status: 'not_found',
        message: 'Payment workflow not found',
      });
    });

    it('should handle query bus errors', async () => {
      // Arrange
      queryBus.execute.mockRejectedValue(new Error('Query execution failed'));

      // Act & Assert
      await expect(
        controller.getPaymentWorkflowStatus('payment-123')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelPayment', () => {
    it('should cancel payment successfully', async () => {
      // Arrange
      commandBus.execute.mockResolvedValue(undefined);

      // Act
      const result = await controller.cancelPayment('payment-123');

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: 'payment-123',
        })
      );
      expect(result).toEqual({ status: 'cancelled' });
    });

    it('should handle command bus errors', async () => {
      // Arrange
      commandBus.execute.mockRejectedValue(new Error('Command execution failed'));

      // Act & Assert
      await expect(controller.cancelPayment('payment-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getActiveWorkflows', () => {
    it('should return active workflows successfully', async () => {
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
          lastUpdated: new Date('2023-01-01T12:05:00Z'),
        },
      ];

      queryBus.execute.mockResolvedValue(mockActiveWorkflows);

      // Act
      const result = await controller.getActiveWorkflows();

      // Assert
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetActiveWorkflowsQuery));
      expect(result).toEqual({
        count: 2,
        workflows: [
          {
            paymentId: 'payment-1',
            status: PaymentStatus.PENDING,
            lastUpdated: new Date('2023-01-01T12:00:00Z'),
            mercadoPagoPreferenceUrl: 'https://mercadopago.com/preference/1',
          },
          {
            paymentId: 'payment-2',
            status: PaymentStatus.PENDING,
            lastUpdated: new Date('2023-01-01T12:05:00Z'),
            mercadoPagoPreferenceUrl: undefined,
          },
        ],
      });
    });

    it('should return empty workflows list', async () => {
      // Arrange
      queryBus.execute.mockResolvedValue([]);

      // Act
      const result = await controller.getActiveWorkflows();

      // Assert
      expect(result).toEqual({
        count: 0,
        workflows: [],
      });
    });

    it('should handle query bus errors', async () => {
      // Arrange
      queryBus.execute.mockRejectedValue(new Error('Query execution failed'));

      // Act & Assert
      await expect(controller.getActiveWorkflows()).rejects.toThrow(BadRequestException);
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      // Act
      const result = await controller.healthCheck();

      // Assert
      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
      });
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });
});
