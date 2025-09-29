import { Money } from './money.value-object';

describe('Money Value Object', () => {
  describe('Constructor', () => {
    it('should create a valid money object with amount and default currency', () => {
      const money = new Money(100.50);

      expect(money.getAmount()).toBe(100.50);
      expect(money.getCurrency()).toBe('BRL');
    });

    it('should create a valid money object with amount and custom currency', () => {
      const money = new Money(100.50, 'USD');

      expect(money.getAmount()).toBe(100.50);
      expect(money.getCurrency()).toBe('USD');
    });

    it('should round amount to 2 decimal places', () => {
      const money = new Money(100.123);

      expect(money.getAmount()).toBe(100.12);
    });

    it('should throw error for negative amount', () => {
      expect(() => new Money(-10)).toThrow('Amount cannot be negative');
    });

    it('should throw error for invalid amount', () => {
      expect(() => new Money(NaN)).toThrow('Amount must be a valid number');
      expect(() => new Money(Infinity)).toThrow('Amount must be a valid number');
    });

    it('should handle zero amount', () => {
      const money = new Money(0);

      expect(money.getAmount()).toBe(0);
    });
  });

  describe('add', () => {
    it('should add two money objects with same currency', () => {
      const money1 = new Money(100.50, 'BRL');
      const money2 = new Money(50.25, 'BRL');

      const result = money1.add(money2);

      expect(result.getAmount()).toBe(150.75);
      expect(result.getCurrency()).toBe('BRL');
    });

    it('should throw error when adding different currencies', () => {
      const money1 = new Money(100, 'BRL');
      const money2 = new Money(50, 'USD');

      expect(() => money1.add(money2)).toThrow('Cannot operate on different currencies');
    });
  });

  describe('subtract', () => {
    it('should subtract two money objects with same currency', () => {
      const money1 = new Money(100.50, 'BRL');
      const money2 = new Money(50.25, 'BRL');

      const result = money1.subtract(money2);

      expect(result.getAmount()).toBe(50.25);
      expect(result.getCurrency()).toBe('BRL');
    });

    it('should throw error when result would be negative', () => {
      const money1 = new Money(50, 'BRL');
      const money2 = new Money(100, 'BRL');

      expect(() => money1.subtract(money2)).toThrow('Amount cannot be negative');
    });

    it('should throw error when subtracting different currencies', () => {
      const money1 = new Money(100, 'BRL');
      const money2 = new Money(50, 'USD');

      expect(() => money1.subtract(money2)).toThrow('Cannot operate on different currencies');
    });
  });

  describe('multiply', () => {
    it('should multiply money by a factor', () => {
      const money = new Money(100, 'BRL');

      const result = money.multiply(2.5);

      expect(result.getAmount()).toBe(250);
      expect(result.getCurrency()).toBe('BRL');
    });

    it('should handle multiplication by zero', () => {
      const money = new Money(100, 'BRL');

      const result = money.multiply(0);

      expect(result.getAmount()).toBe(0);
    });

    it('should handle multiplication by decimal', () => {
      const money = new Money(100, 'BRL');

      const result = money.multiply(0.5);

      expect(result.getAmount()).toBe(50);
    });
  });

  describe('equals', () => {
    it('should return true for equal money objects', () => {
      const money1 = new Money(100, 'BRL');
      const money2 = new Money(100, 'BRL');

      expect(money1.equals(money2)).toBe(true);
    });

    it('should return false for different amounts', () => {
      const money1 = new Money(100, 'BRL');
      const money2 = new Money(200, 'BRL');

      expect(money1.equals(money2)).toBe(false);
    });

    it('should return false for different currencies', () => {
      const money1 = new Money(100, 'BRL');
      const money2 = new Money(100, 'USD');

      expect(money1.equals(money2)).toBe(false);
    });
  });

  describe('isGreaterThan', () => {
    it('should return true when amount is greater', () => {
      const money1 = new Money(200, 'BRL');
      const money2 = new Money(100, 'BRL');

      expect(money1.isGreaterThan(money2)).toBe(true);
    });

    it('should return false when amount is less', () => {
      const money1 = new Money(100, 'BRL');
      const money2 = new Money(200, 'BRL');

      expect(money1.isGreaterThan(money2)).toBe(false);
    });

    it('should return false when amounts are equal', () => {
      const money1 = new Money(100, 'BRL');
      const money2 = new Money(100, 'BRL');

      expect(money1.isGreaterThan(money2)).toBe(false);
    });

    it('should throw error for different currencies', () => {
      const money1 = new Money(100, 'BRL');
      const money2 = new Money(100, 'USD');

      expect(() => money1.isGreaterThan(money2)).toThrow('Cannot operate on different currencies');
    });
  });

  describe('isLessThan', () => {
    it('should return true when amount is less', () => {
      const money1 = new Money(100, 'BRL');
      const money2 = new Money(200, 'BRL');

      expect(money1.isLessThan(money2)).toBe(true);
    });

    it('should return false when amount is greater', () => {
      const money1 = new Money(200, 'BRL');
      const money2 = new Money(100, 'BRL');

      expect(money1.isLessThan(money2)).toBe(false);
    });

    it('should return false when amounts are equal', () => {
      const money1 = new Money(100, 'BRL');
      const money2 = new Money(100, 'BRL');

      expect(money1.isLessThan(money2)).toBe(false);
    });

    it('should throw error for different currencies', () => {
      const money1 = new Money(100, 'BRL');
      const money2 = new Money(100, 'USD');

      expect(() => money1.isLessThan(money2)).toThrow('Cannot operate on different currencies');
    });
  });

  describe('toString', () => {
    it('should return formatted string representation', () => {
      const money = new Money(100.5, 'BRL');

      expect(money.toString()).toBe('BRL 100.50');
    });

    it('should format with two decimal places', () => {
      const money = new Money(100, 'USD');

      expect(money.toString()).toBe('USD 100.00');
    });
  });
});
