import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaymentController } from './payment.controller';
import {
  CreatePaymentDto,
  UpdatePaymentStatusDto,
  PaymentResponseDto,
  CreatePaymentCommand,
  UpdatePaymentStatusCommand,
  GetPaymentByIdQuery,
  GetPaymentsByFiltersQuery
} from '../../application';
import { PaymentStatus, PaymentMethod } from '../../domain/entities';

describe('PaymentController', () => {
  let controller: PaymentController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockQueryBus = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      // Arrange
      const createPaymentDto: CreatePaymentDto = {
        cpf: '33258752036',
        description: 'Test payment',
        amount: 100.00,
        paymentMethod: PaymentMethod.PIX,
      };

      const expectedResponse = new PaymentResponseDto(
        'payment-id',
        '33258752036',
        'Test payment',
        100.00,
        PaymentMethod.PIX,
        PaymentStatus.PENDING,
        new Date(),
        new Date()
      );

      commandBus.execute.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.createPayment(createPaymentDto);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreatePaymentCommand)
      );

      const command = commandBus.execute.mock.calls[0][0] as CreatePaymentCommand;
      expect(command.cpf).toBe('33258752036');
      expect(command.description).toBe('Test payment');
      expect(command.amount).toBe(100.00);
      expect(command.paymentMethod).toBe(PaymentMethod.PIX);

      expect(result).toBe(expectedResponse);
    });

    it('should create credit card payment successfully', async () => {
      // Arrange
      const createPaymentDto: CreatePaymentDto = {
        cpf: '33258752036',
        description: 'Credit card payment',
        amount: 250.75,
        paymentMethod: PaymentMethod.CREDIT_CARD,
      };

      const expectedResponse = new PaymentResponseDto(
        'payment-id-cc',
        '33258752036',
        'Credit card payment',
        250.75,
        PaymentMethod.CREDIT_CARD,
        PaymentStatus.PENDING,
        new Date(),
        new Date()
      );

      commandBus.execute.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.createPayment(createPaymentDto);

      // Assert
      const command = commandBus.execute.mock.calls[0][0] as CreatePaymentCommand;
      expect(command.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(command.amount).toBe(250.75);
      expect(result).toBe(expectedResponse);
    });

    it('should handle command bus errors', async () => {
      // Arrange
      const createPaymentDto: CreatePaymentDto = {
        cpf: '33258752036',
        description: 'Test payment',
        amount: 100.00,
        paymentMethod: PaymentMethod.PIX,
      };

      const error = new Error('Command execution failed');
      commandBus.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.createPayment(createPaymentDto)).rejects.toThrow('Command execution failed');
    });
  });

  describe('getPaymentById', () => {
    it('should get payment by ID successfully', async () => {
      // Arrange
      const paymentId = 'test-payment-id';
      const expectedResponse = new PaymentResponseDto(
        paymentId,
        '33258752036',
        'Test payment',
        100.00,
        PaymentMethod.PIX,
        PaymentStatus.PAID,
        new Date(),
        new Date()
      );

      queryBus.execute.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.getPaymentById(paymentId);

      // Assert
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetPaymentByIdQuery)
      );

      const query = queryBus.execute.mock.calls[0][0] as GetPaymentByIdQuery;
      expect(query.paymentId).toBe(paymentId);

      expect(result).toBe(expectedResponse);
    });

    it('should handle query bus errors for non-existent payment', async () => {
      // Arrange
      const paymentId = 'non-existent-id';
      const error = new Error('Payment not found');
      queryBus.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getPaymentById(paymentId)).rejects.toThrow('Payment not found');
    });
  });

  describe('getPayments', () => {
    it('should get payments with no filters (default to PENDING)', async () => {
      // Arrange
      const expectedResponse = [
        new PaymentResponseDto(
          'payment-1',
          '33258752036',
          'Payment 1',
          100.00,
          PaymentMethod.PIX,
          PaymentStatus.PENDING,
          new Date(),
          new Date()
        ),
        new PaymentResponseDto(
          'payment-2',
          '33258752036',
          'Payment 2',
          200.00,
          PaymentMethod.CREDIT_CARD,
          PaymentStatus.PENDING,
          new Date(),
          new Date()
        ),
      ];

      queryBus.execute.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.getPayments();

      // Assert
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetPaymentsByFiltersQuery)
      );

      const query = queryBus.execute.mock.calls[0][0] as GetPaymentsByFiltersQuery;
      expect(query.filters.cpf).toBeUndefined();
      expect(query.filters.status).toBeUndefined();

      expect(result).toBe(expectedResponse);
    });

    it('should get payments filtered by CPF only', async () => {
      // Arrange
      const cpf = '33258752036';
      const expectedResponse = [
        new PaymentResponseDto(
          'payment-1',
          cpf,
          'Payment 1',
          100.00,
          PaymentMethod.PIX,
          PaymentStatus.PENDING,
          new Date(),
          new Date()
        ),
      ];

      queryBus.execute.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.getPayments(cpf);

      // Assert
      const query = queryBus.execute.mock.calls[0][0] as GetPaymentsByFiltersQuery;
      expect(query.filters.cpf).toBe(cpf);
      expect(query.filters.status).toBeUndefined();

      expect(result).toBe(expectedResponse);
    });

    it('should get payments filtered by status only', async () => {
      // Arrange
      const status = PaymentStatus.PAID;
      const expectedResponse = [
        new PaymentResponseDto(
          'payment-1',
          '33258752036',
          'Payment 1',
          100.00,
          PaymentMethod.PIX,
          PaymentStatus.PAID,
          new Date(),
          new Date()
        ),
      ];

      queryBus.execute.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.getPayments(undefined, status);

      // Assert
      const query = queryBus.execute.mock.calls[0][0] as GetPaymentsByFiltersQuery;
      expect(query.filters.cpf).toBeUndefined();
      expect(query.filters.status).toBe(status);

      expect(result).toBe(expectedResponse);
    });

    it('should get payments filtered by both CPF and status', async () => {
      // Arrange
      const cpf = '33258752036';
      const status = PaymentStatus.PAID;
      const expectedResponse = [
        new PaymentResponseDto(
          'payment-1',
          cpf,
          'Payment 1',
          100.00,
          PaymentMethod.PIX,
          PaymentStatus.PAID,
          new Date(),
          new Date()
        ),
      ];

      queryBus.execute.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.getPayments(cpf, status);

      // Assert
      const query = queryBus.execute.mock.calls[0][0] as GetPaymentsByFiltersQuery;
      expect(query.filters.cpf).toBe(cpf);
      expect(query.filters.status).toBe(status);

      expect(result).toBe(expectedResponse);
    });

    it('should handle FAIL status filter', async () => {
      // Arrange
      const status = PaymentStatus.FAIL;
      const expectedResponse = [
        new PaymentResponseDto(
          'payment-failed',
          '33258752036',
          'Failed payment',
          100.00,
          PaymentMethod.PIX,
          PaymentStatus.FAIL,
          new Date(),
          new Date()
        ),
      ];

      queryBus.execute.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.getPayments(undefined, status);

      // Assert
      const query = queryBus.execute.mock.calls[0][0] as GetPaymentsByFiltersQuery;
      expect(query.filters.status).toBe(PaymentStatus.FAIL);
      expect(result).toBe(expectedResponse);
    });

    it('should return empty array when no payments found', async () => {
      // Arrange
      queryBus.execute.mockResolvedValue([]);

      // Act
      const result = await controller.getPayments('33258752036');

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle query bus errors', async () => {
      // Arrange
      const error = new Error('Query execution failed');
      queryBus.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getPayments()).rejects.toThrow('Query execution failed');
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status to PAID successfully', async () => {
      // Arrange
      const paymentId = 'test-payment-id';
      const updateStatusDto: UpdatePaymentStatusDto = {
        status: PaymentStatus.PAID,
      };

      const expectedResponse = new PaymentResponseDto(
        paymentId,
        '33258752036',
        'Test payment',
        100.00,
        PaymentMethod.PIX,
        PaymentStatus.PAID,
        new Date(),
        new Date()
      );

      commandBus.execute.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.updatePaymentStatus(paymentId, updateStatusDto);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdatePaymentStatusCommand)
      );

      const command = commandBus.execute.mock.calls[0][0] as UpdatePaymentStatusCommand;
      expect(command.paymentId).toBe(paymentId);
      expect(command.status).toBe(PaymentStatus.PAID);

      expect(result).toBe(expectedResponse);
    });

    it('should update payment status to FAIL successfully', async () => {
      // Arrange
      const paymentId = 'test-payment-id';
      const updateStatusDto: UpdatePaymentStatusDto = {
        status: PaymentStatus.FAIL,
      };

      const expectedResponse = new PaymentResponseDto(
        paymentId,
        '33258752036',
        'Test payment',
        100.00,
        PaymentMethod.PIX,
        PaymentStatus.FAIL,
        new Date(),
        new Date()
      );

      commandBus.execute.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.updatePaymentStatus(paymentId, updateStatusDto);

      // Assert
      const command = commandBus.execute.mock.calls[0][0] as UpdatePaymentStatusCommand;
      expect(command.status).toBe(PaymentStatus.FAIL);
      expect(result).toBe(expectedResponse);
    });

    it('should handle command bus errors for invalid status transition', async () => {
      // Arrange
      const paymentId = 'test-payment-id';
      const updateStatusDto: UpdatePaymentStatusDto = {
        status: PaymentStatus.PENDING,
      };

      const error = new Error('Invalid status transition');
      commandBus.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.updatePaymentStatus(paymentId, updateStatusDto)).rejects.toThrow('Invalid status transition');
    });

    it('should handle non-existent payment ID', async () => {
      // Arrange
      const paymentId = 'non-existent-id';
      const updateStatusDto: UpdatePaymentStatusDto = {
        status: PaymentStatus.PAID,
      };

      const error = new Error('Payment not found');
      commandBus.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.updatePaymentStatus(paymentId, updateStatusDto)).rejects.toThrow('Payment not found');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete payment flow', async () => {
      // Arrange - Create payment
      const createDto: CreatePaymentDto = {
        cpf: '33258752036',
        description: 'Integration test payment',
        amount: 100.00,
        paymentMethod: PaymentMethod.PIX,
      };

      const createdPayment = new PaymentResponseDto(
        'integration-payment-id',
        '33258752036',
        'Integration test payment',
        100.00,
        PaymentMethod.PIX,
        PaymentStatus.PENDING,
        new Date(),
        new Date()
      );

      commandBus.execute.mockResolvedValueOnce(createdPayment);

      // Act - Create payment
      const createResult = await controller.createPayment(createDto);

      // Assert creation
      expect(createResult.status).toBe(PaymentStatus.PENDING);

      // Arrange - Get payment by ID
      queryBus.execute.mockResolvedValueOnce(createResult);

      // Act - Get payment
      const getResult = await controller.getPaymentById(createResult.id);

      // Assert retrieval
      expect(getResult.id).toBe(createResult.id);

      // Arrange - Update status
      const updateDto: UpdatePaymentStatusDto = {
        status: PaymentStatus.PAID,
      };

      const updatedPayment = new PaymentResponseDto(
        createResult.id,
        createResult.cpf,
        createResult.description,
        createResult.amount,
        createResult.paymentMethod,
        PaymentStatus.PAID,
        createResult.createdAt,
        new Date()
      );

      commandBus.execute.mockResolvedValueOnce(updatedPayment);

      // Act - Update status
      const updateResult = await controller.updatePaymentStatus(createResult.id, updateDto);

      // Assert update
      expect(updateResult.status).toBe(PaymentStatus.PAID);
      expect(updateResult.id).toBe(createResult.id);
    });
  });
});
