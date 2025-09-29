import { Payment } from './payment.entity';
import { PaymentStatus, PaymentMethod } from './enums';
import { CPF, Money } from '../value-objects';
import { PaymentCreatedEvent, PaymentStatusUpdatedEvent } from '../events';

describe('Payment Entity', () => {
  const validCPF = new CPF('33258752036');
  const validAmount = new Money(100.00);
  const validDescription = 'Test payment';
  const paymentId = 'test-payment-id';

  describe('Constructor', () => {
    it('should create a payment with default PENDING status', () => {
      const payment = new Payment(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX
      );

      expect(payment.id).toBe(paymentId);
      expect(payment.cpf).toBe(validCPF);
      expect(payment.description).toBe(validDescription);
      expect(payment.amount).toBe(validAmount);
      expect(payment.paymentMethod).toBe(PaymentMethod.PIX);
      expect(payment.status).toBe(PaymentStatus.PENDING);
      expect(payment.createdAt).toBeInstanceOf(Date);
      expect(payment.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a payment with custom status', () => {
      const payment = new Payment(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.CREDIT_CARD,
        PaymentStatus.PAID
      );

      expect(payment.status).toBe(PaymentStatus.PAID);
    });

    it('should create a payment with custom dates', () => {
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');

      const payment = new Payment(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PENDING,
        createdAt,
        updatedAt
      );

      expect(payment.createdAt).toBe(createdAt);
      expect(payment.updatedAt).toBe(updatedAt);
    });
  });

  describe('create static method', () => {
    it('should create a payment and apply PaymentCreatedEvent', () => {
      const payment = Payment.create(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX
      );

      expect(payment.status).toBe(PaymentStatus.PENDING);

      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentCreatedEvent);

      const event = events[0] as PaymentCreatedEvent;
      expect(event.paymentId).toBe(paymentId);
      expect(event.cpf).toBe(validCPF.getValue());
      expect(event.amount).toBe(validAmount.getAmount());
      expect(event.paymentMethod).toBe(PaymentMethod.PIX);
      expect(event.description).toBe(validDescription);
    });
  });

  describe('updateStatus', () => {
    it('should update status from PENDING to PAID', () => {
      const payment = Payment.create(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX
      );

      const initialUpdatedAt = payment.updatedAt;

      // Wait a bit to ensure timestamp difference
      jest.advanceTimersByTime(1000);

      payment.updateStatus(PaymentStatus.PAID);

      expect(payment.status).toBe(PaymentStatus.PAID);
      expect(payment.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());

      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(2); // Created + StatusUpdated
      expect(events[1]).toBeInstanceOf(PaymentStatusUpdatedEvent);
    });

    it('should update status from PENDING to FAIL', () => {
      const payment = Payment.create(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX
      );

      payment.updateStatus(PaymentStatus.FAIL);

      expect(payment.status).toBe(PaymentStatus.FAIL);
    });

    it('should not update if status is the same', () => {
      const payment = Payment.create(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX
      );

      const initialUpdatedAt = payment.updatedAt;

      payment.updateStatus(PaymentStatus.PENDING);

      expect(payment.status).toBe(PaymentStatus.PENDING);
      expect(payment.updatedAt).toBe(initialUpdatedAt);

      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(1); // Only created event
    });

    it('should throw error for invalid status transition from PAID', () => {
      const payment = new Payment(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PAID
      );

      expect(() => payment.updateStatus(PaymentStatus.PENDING))
        .toThrow('Invalid status transition from PAID to PENDING');
    });

    it('should throw error for invalid status transition from FAIL', () => {
      const payment = new Payment(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.FAIL
      );

      expect(() => payment.updateStatus(PaymentStatus.PAID))
        .toThrow('Invalid status transition from FAIL to PAID');
    });
  });

  describe('markAsPaid', () => {
    it('should mark payment as paid', () => {
      const payment = Payment.create(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX
      );

      payment.markAsPaid();

      expect(payment.status).toBe(PaymentStatus.PAID);
      expect(payment.isPaid()).toBe(true);
    });
  });

  describe('markAsFailed', () => {
    it('should mark payment as failed', () => {
      const payment = Payment.create(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX
      );

      payment.markAsFailed();

      expect(payment.status).toBe(PaymentStatus.FAIL);
      expect(payment.isFailed()).toBe(true);
    });
  });

  describe('status check methods', () => {
    it('should correctly identify pending payment', () => {
      const payment = Payment.create(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX
      );

      expect(payment.isPending()).toBe(true);
      expect(payment.isPaid()).toBe(false);
      expect(payment.isFailed()).toBe(false);
    });

    it('should correctly identify paid payment', () => {
      const payment = new Payment(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PAID
      );

      expect(payment.isPending()).toBe(false);
      expect(payment.isPaid()).toBe(true);
      expect(payment.isFailed()).toBe(false);
    });

    it('should correctly identify failed payment', () => {
      const payment = new Payment(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.FAIL
      );

      expect(payment.isPending()).toBe(false);
      expect(payment.isPaid()).toBe(false);
      expect(payment.isFailed()).toBe(true);
    });
  });

  describe('canBeProcessed', () => {
    it('should return true for pending payment', () => {
      const payment = Payment.create(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX
      );

      expect(payment.canBeProcessed()).toBe(true);
    });

    it('should return false for paid payment', () => {
      const payment = new Payment(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PAID
      );

      expect(payment.canBeProcessed()).toBe(false);
    });

    it('should return false for failed payment', () => {
      const payment = new Payment(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.FAIL
      );

      expect(payment.canBeProcessed()).toBe(false);
    });
  });

  describe('toPlainObject', () => {
    it('should return plain object representation', () => {
      const payment = Payment.create(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.PIX
      );

      const plainObject = payment.toPlainObject();

      expect(plainObject).toEqual({
        id: paymentId,
        cpf: validCPF.getValue(),
        description: validDescription,
        amount: validAmount.getAmount(),
        paymentMethod: PaymentMethod.PIX,
        status: PaymentStatus.PENDING,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      });
    });
  });

  describe('getters', () => {
    it('should provide access to all properties via getters', () => {
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');

      const payment = new Payment(
        paymentId,
        validCPF,
        validDescription,
        validAmount,
        PaymentMethod.CREDIT_CARD,
        PaymentStatus.PAID,
        createdAt,
        updatedAt
      );

      expect(payment.id).toBe(paymentId);
      expect(payment.cpf).toBe(validCPF);
      expect(payment.description).toBe(validDescription);
      expect(payment.amount).toBe(validAmount);
      expect(payment.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(payment.status).toBe(PaymentStatus.PAID);
      expect(payment.createdAt).toBe(createdAt);
      expect(payment.updatedAt).toBe(updatedAt);
    });
  });
});

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});
