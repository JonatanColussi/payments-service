export class CPF {
  private readonly value: string;

  constructor(cpf: string) {
    if (!this.isValid(cpf)) {
      throw new Error('Invalid CPF format');
    }
    this.value = this.cleanCPF(cpf);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: CPF): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private cleanCPF(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  private isValid(cpf: string): boolean {
    const cleanedCPF = this.cleanCPF(cpf);
    
    if (cleanedCPF.length !== 11) {
      return false;
    }

    // Check for known invalid CPFs
    if (/^(\d)\1{10}$/.test(cleanedCPF)) {
      return false;
    }

    // Validate check digits
    return this.validateCheckDigits(cleanedCPF);
  }

  private validateCheckDigits(cpf: string): boolean {
    const digits = cpf.split('').map(Number);
    
    // First check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }
    const firstCheckDigit = ((sum * 10) % 11) % 10;
    
    if (firstCheckDigit !== digits[9]) {
      return false;
    }

    // Second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += digits[i] * (11 - i);
    }
    const secondCheckDigit = ((sum * 10) % 11) % 10;
    
    return secondCheckDigit === digits[10];
  }
}