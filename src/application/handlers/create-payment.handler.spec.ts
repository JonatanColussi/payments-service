import { Test, TestingModule } from '@nestjs/testing';
import { EventPublisher } from '@nestjs/cqrs';
import { CreatePaymentHandler } from './create-payment.handler';
import { CreatePaymentCommand } from '../commands';
import { IPaymentRepository } from '../../domain/interfaces';
import { CPF, Money, Payment, PaymentMethod, PaymentStatus } from '../../domain';
import { PaymentResponseDto } from '../dtos';

describe('CreatePaymentHandler', () => {
  let handler: CreatePaymentHandler;
  let paymentRepository: jest.Mocked<IPaymentRepository>;
  let eventPublisher: jest.Mocked<EventPublisher>;

  const mockPaymentRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findByCpf: jest.fn(),
    findByStatus: jest.fn(),
    findByCpfAndStatus: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockEventPublisher = {
    mergeObjectContext: jest.fn(),
  };

  const mockPaymentModel = {
    commit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePaymentHandler,
        {
          provide: IPaymentRepository,
          useValue: mockPaymentRepository,
        },
        {
          provide: EventPublisher,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    handler = module.get<CreatePaymentHandler>(CreatePaymentHandler);
    paymentRepository = module.get('IPaymentRepository');
    eventPublisher = module.get(EventPublisher);

    // Reset mocks
    jest.clearAllMocks();
    mockEventPublisher.mergeObjectContext.mockReturnValue(mockPaymentModel);
  });

  describe('execute', () => {
    const validCommand = new CreatePaymentCommand(
      '33258752036',
      'Test payment description',
      100.00,
      PaymentMethod.PIX
    );

    it('should successfully create a payment', async () => {
      // Arrange
      const cpfVO = new CPF(validCommand.cpf);
      const amountVO = new Money(validCommand.amount);

      const savedPayment = Payment.create(
        'test-id',
        cpfVO,
        validCommand.description,
        amountVO,
        validCommand.paymentMethod
      );

      paymentRepository.save.mockResolvedValue(savedPayment);

      // Act
      const result = await handler.execute(validCommand);

      // Assert
      expect(paymentRepository.save).toHaveBeenCalledTimes(1);
      expect(paymentRepository.save).toHaveBeenCalledWith(expect.any(Payment));

      expect(eventPublisher.mergeObjectContext).toHaveBeenCalledWith(savedPayment);
      expect(mockPaymentModel.commit).toHaveBeenCalledTimes(1);

      expect(result).toBeInstanceOf(PaymentResponseDto);
      expect(result.cpf).toBe('33258752036');
      expect(result.description).toBe('Test payment description');
      expect(result.amount).toBe(100.00);
      expect(result.paymentMethod).toBe(PaymentMethod.PIX);
      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should validate CPF and throw error for invalid CPF', async () => {
      // Arrange
      const invalidCommand = new CreatePaymentCommand(
        '12345678901', // Invalid CPF
        'Test payment description',
        100.00,
        PaymentMethod.PIX
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow('Invalid CPF format');
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should validate payment amount and throw error for amount below minimum', async () => {
      // Arrange
      const invalidCommand = new CreatePaymentCommand(
        '33258752036',
        'Test payment description',
        0, // Below minimum for PIX
        PaymentMethod.PIX
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow('Payment amount must be at least');
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should validate payment amount and throw error for amount above maximum', async () => {
      // Arrange
      const invalidCommand = new CreatePaymentCommand(
        '33258752036',
        'Test payment description',
        500001.00, // Above maximum for PIX
        PaymentMethod.PIX
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow('Payment amount cannot exceed');
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should validate description and throw error for empty description', async () => {
      // Arrange
      const invalidCommand = new CreatePaymentCommand(
        '33258752036',
        '', // Empty description
        100.00,
        PaymentMethod.PIX
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow('Payment description is required');
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should validate description and throw error for description too long', async () => {
      // Arrange
      const invalidCommand = new CreatePaymentCommand(
        '33258752036',
        'a'.repeat(501), // Too long description
        100.00,
        PaymentMethod.PIX
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow('Payment description cannot exceed 500 characters');
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should validate payment method and throw error for invalid method', async () => {
      // Arrange
      const invalidCommand = new CreatePaymentCommand(
        '33258752036',
        'Test payment description',
        100.00,
        'INVALID_METHOD' as PaymentMethod
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow('Invalid payment method');
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should handle credit card payments with correct validation', async () => {
      // Arrange
      const creditCardCommand = new CreatePaymentCommand(
        '33258752036',
        'Credit card payment',
        1000.00,
        PaymentMethod.CREDIT_CARD
      );

      const cpfVO = new CPF(creditCardCommand.cpf);
      const amountVO = new Money(creditCardCommand.amount);

      const savedPayment = Payment.create(
        'test-id',
        cpfVO,
        creditCardCommand.description,
        amountVO,
        creditCardCommand.paymentMethod
      );

      paymentRepository.save.mockResolvedValue(savedPayment);

      // Act
      const result = await handler.execute(creditCardCommand);

      // Assert
      expect(result.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(paymentRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle repository save error', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      paymentRepository.save.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow('Database connection failed');
      expect(eventPublisher.mergeObjectContext).not.toHaveBeenCalled();
    });

    it('should generate unique payment ID for each payment', async () => {
      // Arrange
      const cpfVO = new CPF(validCommand.cpf);
      const amountVO = new Money(validCommand.amount);

      const payment1 = Payment.create('id1', cpfVO, validCommand.description, amountVO, validCommand.paymentMethod);
      const payment2 = Payment.create('id2', cpfVO, validCommand.description, amountVO, validCommand.paymentMethod);

      paymentRepository.save
        .mockResolvedValueOnce(payment1)
        .mockResolvedValueOnce(payment2);

      // Act
      await handler.execute(validCommand);
      await handler.execute(validCommand);

      // Assert
      expect(paymentRepository.save).toHaveBeenCalledTimes(2);

      const firstCall = paymentRepository.save.mock.calls[0][0] as Payment;
      const secondCall = paymentRepository.save.mock.calls[1][0] as Payment;

      expect(firstCall.id).not.toBe(secondCall.id);
    });

    it('should preserve all input data in the created payment', async () => {
      // Arrange
      const testCommand = new CreatePaymentCommand(
        '33258752036',
        'Specific test payment description',
        250.75,
        PaymentMethod.CREDIT_CARD
      );

      const cpfVO = new CPF(testCommand.cpf);
      const amountVO = new Money(testCommand.amount);

      const savedPayment = Payment.create(
        'test-id',
        cpfVO,
        testCommand.description,
        amountVO,
        testCommand.paymentMethod
      );

      paymentRepository.save.mockResolvedValue(savedPayment);

      // Act
      const result = await handler.execute(testCommand);

      // Assert
      expect(result.cpf).toBe('33258752036');
      expect(result.description).toBe('Specific test payment description');
      expect(result.amount).toBe(250.75);
      expect(result.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
    });
  });
});
