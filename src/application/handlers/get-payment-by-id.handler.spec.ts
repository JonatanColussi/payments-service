import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetPaymentByIdHandler } from './get-payment-by-id.handler';
import { GetPaymentByIdQuery } from '../queries';
import { IPaymentRepository } from '../../domain/interfaces';
import { Payment, PaymentMethod, PaymentStatus, CPF, Money } from '../../domain';
import { PaymentResponseDto } from '../dtos';

describe('GetPaymentByIdHandler', () => {
  let handler: GetPaymentByIdHandler;
  let paymentRepository: jest.Mocked<IPaymentRepository>;

  const mockPaymentRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findByFilters: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPaymentByIdHandler,
        {
          provide: IPaymentRepository,
          useValue: mockPaymentRepository,
        },
      ],
    }).compile();

    handler = module.get<GetPaymentByIdHandler>(GetPaymentByIdHandler);
    paymentRepository = module.get(IPaymentRepository);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const paymentId = 'test-payment-id';
    const validCPF = new CPF('33258752036');
    const validAmount = new Money(100.00);
    const createdAt = new Date('2023-01-01');
    const updatedAt = new Date('2023-01-02');

    it('should successfully return payment by ID', async () => {
      // Arrange
      const payment = new Payment(
        paymentId,
        validCPF,
        'Test payment description',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PENDING,
        createdAt,
        updatedAt
      );

      const query = new GetPaymentByIdQuery(paymentId);
      paymentRepository.findById.mockResolvedValue(payment);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(paymentRepository.findById).toHaveBeenCalledWith(paymentId);
      expect(paymentRepository.findById).toHaveBeenCalledTimes(1);

      expect(result).toBeInstanceOf(PaymentResponseDto);
      expect(result.id).toBe(paymentId);
      expect(result.cpf).toBe('33258752036');
      expect(result.description).toBe('Test payment description');
      expect(result.amount).toBe(100.00);
      expect(result.paymentMethod).toBe(PaymentMethod.PIX);
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.createdAt).toBe(createdAt);
      expect(result.updatedAt).toBe(updatedAt);
    });

    it('should return PAID payment correctly', async () => {
      // Arrange
      const payment = new Payment(
        paymentId,
        validCPF,
        'Paid payment',
        new Money(250.75),
        PaymentMethod.CREDIT_CARD,
        PaymentStatus.PAID,
        createdAt,
        updatedAt
      );

      const query = new GetPaymentByIdQuery(paymentId);
      paymentRepository.findById.mockResolvedValue(payment);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.status).toBe(PaymentStatus.PAID);
      expect(result.amount).toBe(250.75);
      expect(result.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
    });

    it('should return FAILED payment correctly', async () => {
      // Arrange
      const payment = new Payment(
        paymentId,
        validCPF,
        'Failed payment',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.FAIL,
        createdAt,
        updatedAt
      );

      const query = new GetPaymentByIdQuery(paymentId);
      paymentRepository.findById.mockResolvedValue(payment);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.status).toBe(PaymentStatus.FAIL);
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      // Arrange
      const query = new GetPaymentByIdQuery('non-existent-id');
      paymentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        new NotFoundException('Payment with ID non-existent-id not found')
      );

      expect(paymentRepository.findById).toHaveBeenCalledWith('non-existent-id');
    });

    it('should handle repository errors', async () => {
      // Arrange
      const query = new GetPaymentByIdQuery(paymentId);
      const repositoryError = new Error('Database connection failed');

      paymentRepository.findById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow('Database connection failed');
    });

    it('should handle different CPF formats in returned data', async () => {
      // Arrange
      const differentCPF = new CPF('33258752036');
      const payment = new Payment(
        paymentId,
        differentCPF,
        'Payment with different CPF',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PENDING,
        createdAt,
        updatedAt
      );

      const query = new GetPaymentByIdQuery(paymentId);
      paymentRepository.findById.mockResolvedValue(payment);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.cpf).toBe('33258752036');
    });

    it('should handle different payment amounts', async () => {
      // Arrange
      const largeAmount = new Money(99999.99);
      const payment = new Payment(
        paymentId,
        validCPF,
        'Large amount payment',
        largeAmount,
        PaymentMethod.CREDIT_CARD,
        PaymentStatus.PENDING,
        createdAt,
        updatedAt
      );

      const query = new GetPaymentByIdQuery(paymentId);
      paymentRepository.findById.mockResolvedValue(payment);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.amount).toBe(99999.99);
    });

    it('should handle special characters in description', async () => {
      // Arrange
      const specialDescription = 'Payment for order #123 - R$ 100,50 (tax included) ção';
      const payment = new Payment(
        paymentId,
        validCPF,
        specialDescription,
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PENDING,
        createdAt,
        updatedAt
      );

      const query = new GetPaymentByIdQuery(paymentId);
      paymentRepository.findById.mockResolvedValue(payment);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.description).toBe(specialDescription);
    });

    it('should preserve exact date values', async () => {
      // Arrange
      const preciseCreatedAt = new Date('2023-01-01T10:30:45.123Z');
      const preciseUpdatedAt = new Date('2023-01-01T15:45:30.456Z');

      const payment = new Payment(
        paymentId,
        validCPF,
        'Date precision test',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PENDING,
        preciseCreatedAt,
        preciseUpdatedAt
      );

      const query = new GetPaymentByIdQuery(paymentId);
      paymentRepository.findById.mockResolvedValue(payment);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.createdAt).toBe(preciseCreatedAt);
      expect(result.updatedAt).toBe(preciseUpdatedAt);
    });
  });
});
