export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'CANCELLED';

export type PaymentMethod = 'COD' | 'BANK_TRANSFER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  product_name: string;
  sku: string;
  size_name: string;
  color_name: string;
  price: number;
  quantity: number;
}

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  confirmed_by?: string;
  paid_at?: string;
  refund_amount?: number;
  refunded_at?: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  total: number;
  shipping_snapshot: {
    receiver_name: string;
    phone: string;
    address_line: string;
    ward?: string;
    district?: string;
    province?: string;
  };
  note?: string;
  delivered_at?: string;
  created_at: string;
  items: OrderItem[];
  payments: Payment[];
}
