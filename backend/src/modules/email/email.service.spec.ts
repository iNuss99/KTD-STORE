import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailTemplatesService } from './email-templates.service';
import {
  OrderConfirmationData,
  RefundConfirmationData,
  AbandonedCartData,
  WelcomeEmailData,
  PasswordResetEmailData,
  StaffCreatedEmailData,
  StaffStatusEmailData,
} from './email.types';

describe('EmailService & EmailTemplatesService', () => {
  let emailService: EmailService;
  let templatesService: EmailTemplatesService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        EmailTemplatesService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'MAIL_FROM') return 'MenWear Hub <notifications@menwearhub.vn>';
              if (key === 'RESEND_API_KEY') return undefined; // Mock dev mode
              return null;
            }),
          },
        },
      ],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
    templatesService = module.get<EmailTemplatesService>(EmailTemplatesService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('EmailTemplatesService', () => {
    it('Scenario 1: should generate valid Order Confirmation HTML and subject', () => {
      const data: OrderConfirmationData = {
        orderId: 'order-uuid-123',
        orderNumber: 'MW-2026-001',
        customerName: 'Nguyễn Văn A',
        customerEmail: 'customer@example.com',
        items: [
          {
            name: 'Áo Polo Pique Cotton',
            size: 'L',
            color: 'Đen',
            sku: 'MW-POLO-L-BLK',
            quantity: 2,
            price: 299000,
          },
        ],
        subtotal: 598000,
        discountAmount: 50000,
        shippingFee: 0,
        total: 548000,
        shippingAddress: {
          receiverName: 'Nguyễn Văn A',
          phoneNumber: '0987654321',
          addressLine: '123 Đường Lê Lợi',
          ward: 'Phường Bến Nghé',
          district: 'Quận 1',
          city: 'TP. Hồ Chí Minh',
        },
        paymentMethod: 'COD',
        orderDate: '10/08/2026',
      };

      const result = templatesService.generateOrderConfirmation(data);

      expect(result.subject).toContain('#MW-2026-001');
      expect(result.html).toContain('Nguyễn Văn A');
      expect(result.html).toContain('Áo Polo Pique Cotton');
      expect(result.html).toContain('123 Đường Lê Lợi');
      expect(result.html).toContain('548.000');
    });

    it('Scenario 2: should generate valid Refund Confirmation HTML and subject', () => {
      const data: RefundConfirmationData = {
        refundId: 'ref-123',
        orderNumber: 'MW-2026-001',
        customerName: 'Trần Thị B',
        customerEmail: 'b@example.com',
        reason: 'Không vừa size',
        refundAmount: 299000,
        refundMethod: 'Chuyển khoản ngân hàng',
        processedDate: '10/08/2026',
      };

      const result = templatesService.generateRefundConfirmation(data);

      expect(result.subject).toContain('#MW-2026-001');
      expect(result.html).toContain('Trần Thị B');
      expect(result.html).toContain('Không vừa size');
      expect(result.html).toContain('299.000');
    });

    it('Scenario 3: should generate valid Abandoned Cart Reminder HTML with 5% voucher', () => {
      const data: AbandonedCartData = {
        customerName: 'Lê Hoàng C',
        customerEmail: 'c@example.com',
        items: [
          {
            name: 'Quần Jean Slim Fit',
            price: 450000,
            quantity: 1,
          },
        ],
        totalAmount: 450000,
        recoveryUrl: 'http://localhost:5173/cart?restore=cart-123',
        discountCode: 'COMEBACK5',
      };

      const result = templatesService.generateAbandonedCartReminder(data);

      expect(result.subject).toContain('giỏ hàng');
      expect(result.html).toContain('Lê Hoàng C');
      expect(result.html).toContain('Quần Jean Slim Fit');
      expect(result.html).toContain('COMEBACK5');
      expect(result.html).toContain('http://localhost:5173/cart?restore=cart-123');
    });

    it('Scenario 4: should generate valid Welcome Email HTML', () => {
      const data: WelcomeEmailData = {
        customerName: 'Phạm Minh D',
        customerEmail: 'd@example.com',
        welcomeVoucherCode: 'HELLOMENWEAR',
      };

      const result = templatesService.generateWelcomeEmail(data);

      expect(result.subject).toContain('Chào mừng');
      expect(result.html).toContain('Phạm Minh D');
      expect(result.html).toContain('HELLOMENWEAR');
    });

    it('Scenario 5: should generate valid Password Reset Email HTML with OTP', () => {
      const data: PasswordResetEmailData = {
        customerName: 'Vũ Hoàng E',
        customerEmail: 'e@example.com',
        resetUrl: 'http://localhost:5173/reset-password?token=xyz',
        otpCode: '859402',
        expiresInMinutes: 15,
      };

      const result = templatesService.generatePasswordReset(data);

      expect(result.subject).toContain('đặt lại mật khẩu');
      expect(result.html).toContain('Vũ Hoàng E');
      expect(result.html).toContain('859402');
      expect(result.html).toContain('15 phút');
    });

    it('Scenario 6: should generate valid Staff Welcome Email HTML and subject', () => {
      const data: StaffCreatedEmailData = {
        staffName: 'Nguyễn Văn Staff',
        staffEmail: 'staff.test@ktdstore.vn',
        initialPassword: 'StaffPassword123!',
        role: 'STAFF',
        loginUrl: 'http://localhost:5173/admin/login',
      };

      const result = templatesService.generateStaffWelcomeEmail(data);

      expect(result.subject).toContain('Nguyễn Văn Staff');
      expect(result.html).toContain('Nguyễn Văn Staff');
      expect(result.html).toContain('staff.test@ktdstore.vn');
      expect(result.html).toContain('StaffPassword123!');
      expect(result.html).toContain('Nhân viên vận hành (Staff)');
      expect(result.html).toContain('http://localhost:5173/admin/login');
    });

    it('Scenario 7: should generate valid Staff Locked Email HTML and subject', () => {
      const lockData: StaffStatusEmailData = {
        staffName: 'Lê Văn Khóa',
        staffEmail: 'lock.test@ktdstore.vn',
        role: 'STAFF',
        isLocked: true,
        updatedAt: '20:00:00 05/09/2026',
      };

      const result = templatesService.generateStaffStatusEmail(lockData);

      expect(result.subject).toContain('tạm khóa');
      expect(result.html).toContain('Lê Văn Khóa');
      expect(result.html).toContain('TÀI KHOẢN TẠM KHÓA');
      expect(result.html).toContain('lock.test@ktdstore.vn');
    });

    it('Scenario 8: should generate valid Staff Unlocked Email HTML and subject', () => {
      const unlockData: StaffStatusEmailData = {
        staffName: 'Lê Văn Mở',
        staffEmail: 'unlock.test@ktdstore.vn',
        role: 'MANAGER',
        isLocked: false,
        updatedAt: '20:05:00 05/09/2026',
        loginUrl: 'http://localhost:5173/admin/login',
      };

      const result = templatesService.generateStaffStatusEmail(unlockData);

      expect(result.subject).toContain('mở khóa');
      expect(result.html).toContain('Lê Văn Mở');
      expect(result.html).toContain('TÀI KHOẢN ĐÃ MỞ KHÓA');
      expect(result.html).toContain('unlock.test@ktdstore.vn');
    });
  });

  describe('EmailService', () => {
    it('should successfully send email via dev mock provider', async () => {
      const result = await emailService.sendOrderConfirmation({
        orderId: 'ord-1',
        orderNumber: 'MW-001',
        customerName: 'Khách test',
        customerEmail: 'test@example.com',
        items: [{ name: 'Sản phẩm test', quantity: 1, price: 100000 }],
        subtotal: 100000,
        discountAmount: 0,
        shippingFee: 0,
        total: 100000,
        shippingAddress: {
          receiverName: 'Khách test',
          phoneNumber: '0123456789',
          addressLine: 'Hà Nội',
        },
        paymentMethod: 'COD',
        orderDate: '10/08/2026',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('mock');
      expect(result.messageId).toBeDefined();
    });

    it('should successfully send staff created email via dev mock provider', async () => {
      const result = await emailService.sendStaffCreatedEmail({
        staffName: 'Trần Quản Lý',
        staffEmail: 'manager@ktdstore.vn',
        initialPassword: 'SecretPassword999',
        role: 'MANAGER',
        loginUrl: 'http://localhost:5173/admin/login',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('mock');
      expect(result.messageId).toBeDefined();
    });

    it('should successfully send staff status changed email via dev mock provider', async () => {
      const result = await emailService.sendStaffStatusEmail({
        staffName: 'Trần Nhân Viên',
        staffEmail: 'staff@ktdstore.vn',
        role: 'STAFF',
        isLocked: true,
        updatedAt: '20:10:00 05/09/2026',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('mock');
      expect(result.messageId).toBeDefined();
    });
  });
});


