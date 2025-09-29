import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetActiveWorkflowsQuery } from '../queries/get-active-workflows.query';
import { IPaymentWorkflowService, PaymentWorkflowState } from '../interfaces/payment-workflow.interface';

@Injectable()
@QueryHandler(GetActiveWorkflowsQuery)
export class GetActiveWorkflowsHandler implements IQueryHandler<GetActiveWorkflowsQuery> {
  constructor(
    private readonly paymentWorkflowService: IPaymentWorkflowService,
  ) {}

  async execute(): Promise<PaymentWorkflowState[]> {
    return this.paymentWorkflowService.listActivePaymentWorkflows();
  }
}