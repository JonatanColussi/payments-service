import { CPF } from './cpf.value-object';

describe('CPF Value Object', () => {
  describe('Constructor', () => {
    it('should create a valid CPF with digits only', () => {
      const validCPF = '12345678909';
      const cpf = new CPF(validCPF);

      expect(cpf.getValue()).toBe('12345678909');
    });

    it('should create a valid CPF with formatting', () => {
      const formattedCPF = '123.456.789-09';
      const cpf = new CPF(formattedCPF);

      expect(cpf.getValue()).toBe('12345678909');
    });

    it('should create a valid CPF removing all non-digit characters', () => {
      const messyCPF = '123abc.456def.789-09xyz';
      const cpf = new CPF(messyCPF);

      expect(cpf.getValue()).toBe('12345678909');
    });

    it('should throw error for invalid CPF length', () => {
      const shortCPF = '123456789';

      expect(() => new CPF(shortCPF)).toThrow('Invalid CPF format');
    });

    it('should throw error for CPF with all same digits', () => {
      const invalidCPF = '11111111111';

      expect(() => new CPF(invalidCPF)).toThrow('Invalid CPF format');
    });

    it('should throw error for invalid check digits', () => {
      const invalidCPF = '12345678900'; // Invalid check digits

      expect(() => new CPF(invalidCPF)).toThrow('Invalid CPF format');
    });

    it('should accept known valid CPFs', () => {
      const validCPFs = [
        '33258752036', // Real valid CPF
        '33258752036', // Real valid CPF
        '12345678909'  // Real valid CPF
      ];

      validCPFs.forEach(cpfValue => {
        expect(() => new CPF(cpfValue)).not.toThrow();
      });
    });
  });

  describe('getValue', () => {
    it('should return the clean CPF value', () => {
      const cpf = new CPF('123.456.789-09');

      expect(cpf.getValue()).toBe('12345678909');
    });
  });

  describe('equals', () => {
    it('should return true for equal CPFs', () => {
      const cpf1 = new CPF('123.456.789-09');
      const cpf2 = new CPF('12345678909');

      expect(cpf1.equals(cpf2)).toBe(true);
    });

    it('should return false for different CPFs', () => {
      const cpf1 = new CPF('33258752036');
      const cpf2 = new CPF('00255032862');

      expect(cpf1.equals(cpf2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the clean CPF value as string', () => {
      const cpf = new CPF('123.456.789-09');

      expect(cpf.toString()).toBe('12345678909');
    });
  });

  describe('CPF Validation Algorithm', () => {
    it('should validate CPF check digits correctly', () => {
      // CPF: 111.444.777-35
      // First 9 digits: 111444777
      // Expected check digits: 35

      const validCPF = '33258752036';

      expect(() => new CPF(validCPF)).not.toThrow();
    });

    it('should reject CPF with wrong first check digit', () => {
      const invalidCPF = '11144477745'; // Wrong first check digit

      expect(() => new CPF(invalidCPF)).toThrow('Invalid CPF format');
    });

    it('should reject CPF with wrong second check digit', () => {
      const invalidCPF = '11144477734'; // Wrong second check digit

      expect(() => new CPF(invalidCPF)).toThrow('Invalid CPF format');
    });

    it('should handle edge cases in validation', () => {
      // Test some edge cases that might cause issues in validation algorithm
      const edgeCases = [
        '00000000000', // All zeros
        '12345678901', // Sequential numbers with wrong check digits
        '98765432112'  // Reverse sequential with wrong check digits
      ];

      edgeCases.forEach(cpfValue => {
        expect(() => new CPF(cpfValue)).toThrow('Invalid CPF format');
      });
    });
  });

  describe('Special Cases', () => {
    it('should handle empty string', () => {
      expect(() => new CPF('')).toThrow('Invalid CPF format');
    });

    it('should handle null/undefined input', () => {
      expect(() => new CPF(null as any)).toThrow();
      expect(() => new CPF(undefined as any)).toThrow();
    });

    it('should handle string with only non-digit characters', () => {
      expect(() => new CPF('abc.def.ghi-jk')).toThrow('Invalid CPF format');
    });
  });
});
