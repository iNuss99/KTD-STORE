export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  provider: 'resend' | 'smtp' | 'mock';
  error?: string;
}

export interface OrderConfirmationData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    size?: string;
    color?: string;
    sku?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  shippingAddress: {
    receiverName: string;
    phoneNumber: string;
    addressLine: string;
    ward?: string;
    district?: string;
    city?: string;
  };
  paymentMethod: string;
  orderDate: string;
  trackingUrl?: string;
}

export interface RefundConfirmationData {
  refundId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  refundAmount: number;
  refundMethod: string;
  processedDate: string;
}

export interface AbandonedCartData {
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    imageUrl?: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  recoveryUrl: string;
  discountCode?: string;
}

export interface WelcomeEmailData {
  customerName: string;
  customerEmail: string;
  welcomeVoucherCode?: string;
  shopUrl?: string;
}

export interface PasswordResetEmailData {
  customerName: string;
  customerEmail: string;
  resetUrl: string;
  otpCode?: string;
  expiresInMinutes: number;
}

export interface StaffCreatedEmailData {
  staffName: string;
  staffEmail: string;
  initialPassword?: string;
  role: string;
  loginUrl: string;
}

export interface StaffStatusEmailData {
  staffName: string;
  staffEmail: string;
  role: string;
  isLocked: boolean;
  updatedAt: string;
  loginUrl?: string;
}

