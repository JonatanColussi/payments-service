import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetPaymentWorkflowStateQuery } from '../queries/get-payment-workflow-state.query';
import { IPaymentWorkflowService, PaymentWorkflowState } from '../interfaces/payment-workflow.interface';

@Injectable()
@QueryHandler(GetPaymentWorkflowStateQuery)
export class GetPaymentWorkflowStateHandler implements IQueryHandler<GetPaymentWorkflowStateQuery> {
  constructor(
    private readonly paymentWorkflowService: IPaymentWorkflowService,
  ) {}

  async execute(query: GetPaymentWorkflowStateQuery): Promise<PaymentWorkflowState | null> {
    const { paymentId } = query;

    return this.paymentWorkflowService.getPaymentWorkflowState(paymentId);
  }
}