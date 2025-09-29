import { Test, TestingModule } from '@nestjs/testing';
import { EventPublisher } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UpdatePaymentStatusHandler } from './update-payment-status.handler';
import { UpdatePaymentStatusCommand } from '../commands';
import { IPaymentRepository } from '../../domain/interfaces';
import { Payment, PaymentMethod, PaymentStatus, CPF, Money } from '../../domain';
import { PaymentResponseDto } from '../dtos';

describe('UpdatePaymentStatusHandler', () => {
  let handler: UpdatePaymentStatusHandler;
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
        UpdatePaymentStatusHandler,
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

    handler = module.get<UpdatePaymentStatusHandler>(UpdatePaymentStatusHandler);
    paymentRepository = module.get('IPaymentRepository');
    eventPublisher = module.get(EventPublisher);

    // Reset mocks
    jest.clearAllMocks();
    mockEventPublisher.mergeObjectContext.mockReturnValue(mockPaymentModel);
  });

  describe('execute', () => {
    const paymentId = 'test-payment-id';
    const validCPF = new CPF('33258752036');
    const validAmount = new Money(100.00);

    it('should successfully update payment status from PENDING to PAID', async () => {
      // Arrange
      const existingPayment = new Payment(
        paymentId,
        validCPF,
        'Test payment',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PENDING
      );

      const updatedPayment = new Payment(
        paymentId,
        validCPF,
        'Test payment',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PAID
      );

      const command = new UpdatePaymentStatusCommand(paymentId, PaymentStatus.PAID);

      paymentRepository.findById.mockResolvedValue(existingPayment);
      paymentRepository.update.mockResolvedValue(updatedPayment);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(paymentRepository.findById).toHaveBeenCalledWith(paymentId);
      expect(paymentRepository.update).toHaveBeenCalledWith(existingPayment);
      expect(eventPublisher.mergeObjectContext).toHaveBeenCalledWith(updatedPayment);
      expect(mockPaymentModel.commit).toHaveBeenCalledTimes(1);

      expect(result).toBeInstanceOf(PaymentResponseDto);
      expect(result.id).toBe(paymentId);
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('should successfully update payment status from PENDING to FAIL', async () => {
      // Arrange
      const existingPayment = new Payment(
        paymentId,
        validCPF,
        'Test payment',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PENDING
      );

      const updatedPayment = new Payment(
        paymentId,
        validCPF,
        'Test payment',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.FAIL
      );

      const command = new UpdatePaymentStatusCommand(paymentId, PaymentStatus.FAIL);

      paymentRepository.findById.mockResolvedValue(existingPayment);
      paymentRepository.update.mockResolvedValue(updatedPayment);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.status).toBe(PaymentStatus.FAIL);
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      // Arrange
      const command = new UpdatePaymentStatusCommand('non-existent-id', PaymentStatus.PAID);
      paymentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        new NotFoundException('Payment with ID non-existent-id not found')
      );

      expect(paymentRepository.update).not.toHaveBeenCalled();
      expect(eventPublisher.mergeObjectContext).not.toHaveBeenCalled();
    });

    it('should throw error for invalid status transition', async () => {
      // Arrange
      const existingPayment = new Payment(
        paymentId,
        validCPF,
        'Test payment',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PAID // Already paid
      );

      const command = new UpdatePaymentStatusCommand(paymentId, PaymentStatus.PENDING);

      paymentRepository.findById.mockResolvedValue(existingPayment);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Invalid status transition from PAID to PENDING'
      );

      expect(paymentRepository.update).not.toHaveBeenCalled();
      expect(eventPublisher.mergeObjectContext).not.toHaveBeenCalled();
    });

    it('should throw error when trying to change status from FAIL to PAID', async () => {
      // Arrange
      const existingPayment = new Payment(
        paymentId,
        validCPF,
        'Test payment',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.FAIL
      );

      const command = new UpdatePaymentStatusCommand(paymentId, PaymentStatus.PAID);

      paymentRepository.findById.mockResolvedValue(existingPayment);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Invalid status transition from FAIL to PAID'
      );
    });

    it('should handle same status update gracefully', async () => {
      // Arrange
      const existingPayment = new Payment(
        paymentId,
        validCPF,
        'Test payment',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PENDING
      );

      const command = new UpdatePaymentStatusCommand(paymentId, PaymentStatus.PENDING);

      paymentRepository.findById.mockResolvedValue(existingPayment);
      paymentRepository.update.mockResolvedValue(existingPayment);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(paymentRepository.update).toHaveBeenCalledWith(existingPayment);
    });

    it('should handle repository errors during find', async () => {
      // Arrange
      const command = new UpdatePaymentStatusCommand(paymentId, PaymentStatus.PAID);
      const repositoryError = new Error('Database connection failed');

      paymentRepository.findById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Database connection failed');
      expect(paymentRepository.update).not.toHaveBeenCalled();
    });

    it('should handle repository errors during update', async () => {
      // Arrange
      const existingPayment = new Payment(
        paymentId,
        validCPF,
        'Test payment',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PENDING
      );

      const command = new UpdatePaymentStatusCommand(paymentId, PaymentStatus.PAID);
      const repositoryError = new Error('Database save failed');

      paymentRepository.findById.mockResolvedValue(existingPayment);
      paymentRepository.update.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Database save failed');
      expect(eventPublisher.mergeObjectContext).not.toHaveBeenCalled();
    });

    it('should preserve all payment data except status and updatedAt', async () => {
      // Arrange
      const originalDate = new Date('2023-01-01');
      const existingPayment = new Payment(
        paymentId,
        validCPF,
        'Specific test description',
        new Money(250.75),
        PaymentMethod.CREDIT_CARD,
        PaymentStatus.PENDING,
        originalDate,
        originalDate
      );

      const updatedPayment = new Payment(
        paymentId,
        validCPF,
        'Specific test description',
        new Money(250.75),
        PaymentMethod.CREDIT_CARD,
        PaymentStatus.PAID,
        originalDate,
        new Date() // Updated timestamp
      );

      const command = new UpdatePaymentStatusCommand(paymentId, PaymentStatus.PAID);

      paymentRepository.findById.mockResolvedValue(existingPayment);
      paymentRepository.update.mockResolvedValue(updatedPayment);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.id).toBe(paymentId);
      expect(result.cpf).toBe('33258752036');
      expect(result.description).toBe('Specific test description');
      expect(result.amount).toBe(250.75);
      expect(result.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(result.status).toBe(PaymentStatus.PAID);
      expect(result.createdAt).toBe(originalDate);
      expect(result.updatedAt.getTime()).toBeGreaterThan(originalDate.getTime());
    });

    it('should call domain events correctly', async () => {
      // Arrange
      const existingPayment = new Payment(
        paymentId,
        validCPF,
        'Test payment',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PENDING
      );

      const updatedPayment = new Payment(
        paymentId,
        validCPF,
        'Test payment',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PAID
      );

      const command = new UpdatePaymentStatusCommand(paymentId, PaymentStatus.PAID);

      paymentRepository.findById.mockResolvedValue(existingPayment);
      paymentRepository.update.mockResolvedValue(updatedPayment);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventPublisher.mergeObjectContext).toHaveBeenCalledWith(updatedPayment);
      expect(mockPaymentModel.commit).toHaveBeenCalledTimes(1);
    });
  });
});
