import { IQuery } from '@nestjs/cqrs';

export class GetActiveWorkflowsQuery implements IQuery {
  constructor() {}
}