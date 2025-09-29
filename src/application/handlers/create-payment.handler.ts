import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { CreatePaymentCommand } from '../commands';
import { Payment, CPF, Money, PaymentValidationService, PaymentMethod } from '../../domain';
import { IPaymentRepository } from '../../domain/interfaces';
import { PaymentResponseDto } from '../dtos';
import { IPaymentWorkflowService } from '../interfaces/payment-workflow.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
@CommandHandler(CreatePaymentCommand)
export class CreatePaymentHandler implements ICommandHandler<CreatePaymentCommand> {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly publisher: EventPublisher,
    private readonly paymentWorkflowService: IPaymentWorkflowService,
  ) {}

  async execute(command: CreatePaymentCommand): Promise<PaymentResponseDto> {
    const { cpf, description, amount, paymentMethod } = command;

    // Validate inputs using domain services
    const cpfVO = new CPF(cpf);
    const amountVO = new Money(amount);

    PaymentValidationService.validatePaymentMethod(paymentMethod);
    PaymentValidationService.validatePaymentAmount(amountVO, paymentMethod);
    PaymentValidationService.validateDescription(description);

    const paymentId = uuidv4();

    // Handle Credit Card payments with Temporal workflow
    if (paymentMethod === PaymentMethod.CREDIT_CARD) {
      return this.handleCreditCardPayment(paymentId, cpfVO, description, amountVO, paymentMethod);
    }

    // Handle PIX payments (direct processing)
    return this.handlePixPayment(paymentId, cpfVO, description, amountVO, paymentMethod);
  }

  private async handleCreditCardPayment(
    paymentId: string,
    cpf: CPF,
    description: string,
    amount: Money,
    paymentMethod: PaymentMethod
  ): Promise<PaymentResponseDto> {
    // Para pagamentos com cartão de crédito, iniciamos o workflow do Temporal
    // O pagamento será salvo no banco pelo workflow

    const workflowResult = await this.paymentWorkflowService.startCreditCardPaymentWorkflow({
      paymentId,
      cpf: cpf.getValue(),
      description,
      amount: amount.getAmount(),
      payer: {
        // Aqui poderíamos extrair email/nome do CPF ou de outros dados do comando
        email: undefined,
        name: undefined
      }
    });

    // Retornar resposta com informações do workflow
    // O status inicial será PENDING e será atualizado pelo workflow
    return new PaymentResponseDto(
      paymentId,
      cpf.getValue(),
      description,
      amount.getAmount(),
      paymentMethod,
      'PENDING' as any,
      new Date(),
      new Date(),
      // Incluir URL da preferência do Mercado Pago na resposta
      workflowResult.preferenceUrl
    );
  }

  private async handlePixPayment(
    paymentId: string,
    cpf: CPF,
    description: string,
    amount: Money,
    paymentMethod: PaymentMethod
  ): Promise<PaymentResponseDto> {
    // Para pagamentos PIX, processamento direto (como estava antes)

    // Create domain entity
    const payment = Payment.create(paymentId, cpf, description, amount, paymentMethod);

    // Save to repository
    const savedPayment = await this.paymentRepository.save(payment);

    // Publish domain events
    const paymentModel = this.publisher.mergeObjectContext(savedPayment);
    paymentModel.commit();

    // Return response DTO
    const plainObject = savedPayment.toPlainObject();
    return new PaymentResponseDto(
      plainObject.id,
      plainObject.cpf,
      plainObject.description,
      plainObject.amount,
      plainObject.paymentMethod,
      plainObject.status,
      plainObject.createdAt,
      plainObject.updatedAt,
    );
  }
}
