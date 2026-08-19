import { Order } from './order.types';

export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';

export interface ReturnRequest {
  id: string;
  order_id: string;
  order?: Order;
  user_id: string;
  user?: { full_name: string; email: string; phone: string };
  reason: string;
  status: ReturnStatus;
  approved_by?: string;
  approved_by_user?: { full_name: string };
  rejection_reason?: string;
  refund_amount?: number;
  created_at: string;
  resolved_at?: string;
}
