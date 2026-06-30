import { PaymentRepository } from '../repositories/PaymentRepository';
import { Result, QueryOptions, PaginatedResult } from '../types';

export class PaymentService {
  static async listPayments(
    workspaceId: string,
    options: QueryOptions = {}
  ): Promise<Result<PaginatedResult<any>>> {
    try {
      const data = await PaymentRepository.getAll(workspaceId, options);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }
}
export default PaymentService;
