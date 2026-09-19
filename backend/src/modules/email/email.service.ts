import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailTemplatesService } from './email-templates.service';
import {
  SendEmailOptions,
  SendEmailResult,
  OrderConfirmationData,
  RefundConfirmationData,
  AbandonedCartData,
  WelcomeEmailData,
  PasswordResetEmailData,
  StaffCreatedEmailData,
  StaffStatusEmailData,
  StaffUpdatedEmailData,
} from './email.types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger('EmailService');
  private readonly resendApiKey: string | undefined;
  private readonly fromEmail: string;
  private readonly smtpTransporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly templatesService: EmailTemplatesService,
  ) {
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY');

    // Configure SMTP if credentials are provided
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const smtpHost = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = Number(this.configService.get<number>('SMTP_PORT') || 465);
    const smtpSecure = this.configService.get<string>('SMTP_SECURE', 'true') === 'true';

    // Đảm bảo MAIL_FROM trùng khớp với tài khoản gửi SMTP để Google ký DKIM/SPF hợp lệ (tránh bị Gmail chặn hoặc vào spam)
    const defaultFrom = smtpUser
      ? `KTD Store <${smtpUser}>`
      : 'KTD Store <domjnhkhoa@gmail.com>';
    this.fromEmail = this.configService.get<string>('MAIL_FROM') || defaultFrom;

    if (smtpUser && smtpPass && !smtpPass.includes('placeholder')) {
      try {
        this.smtpTransporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 5000,
          greetingTimeout: 5000,
          socketTimeout: 7000,
        });
        this.logger.log(`SMTP configured successfully with ${smtpHost}:${smtpPort} (User: ${smtpUser})`);
      } catch (err: any) {
        this.logger.error(`Failed to initialize SMTP transporter: ${err.message}`);
      }
    }
  }

  getStatus() {
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const maskedUser = smtpUser ? smtpUser.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') : null;
    const hasResend = !!(this.resendApiKey && !this.resendApiKey.includes('placeholder'));
    const preferred = this.configService.get<string>('EMAIL_PROVIDER', hasResend ? 'resend' : 'smtp');
    return {
      smtp_configured: !!this.smtpTransporter,
      smtp_host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      smtp_port: Number(this.configService.get<number>('SMTP_PORT') || 465),
      smtp_user: maskedUser,
      resend_configured: hasResend,
      mail_from: this.fromEmail,
      active_provider: (preferred === 'resend' && hasResend) ? 'resend' : (this.smtpTransporter ? 'smtp' : (hasResend ? 'resend' : 'mock')),
      timestamp: new Date().toISOString(),
    };
  }

  async verifyConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!this.smtpTransporter) {
      return { success: false, error: 'SMTP transporter chưa được khởi tạo (thiếu biến môi trường)' };
    }
    return new Promise((resolve) => {
      this.smtpTransporter!.verify((error, success) => {
        if (error) {
          resolve({ success: false, error: error.message });
        } else {
          resolve({ success: true, message: 'Kết nối máy chủ Gmail SMTP thành công 100%' });
        }
      });
    });
  }

  async sendTestEmail(targetEmail: string = 'domjnhkhoa@gmail.com') {
    const subject = `[KTD Store] Email kiểm tra kết nối hệ thống - ${new Date().toLocaleTimeString('vi-VN')}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 500px;">
        <h2 style="color: #d97706; margin-top: 0;">✅ Kết nối Email KTD Store hoạt động tốt!</h2>
        <p>Email này được gửi tự động từ máy chủ để xác nhận tính năng gửi thư đang hoạt động bình thường.</p>
        <ul style="color: #475569; font-size: 14px;">
          <li><b>Người gửi:</b> ${this.fromEmail}</li>
          <li><b>Thời gian:</b> ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</li>
        </ul>
        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-bottom: 0;">
          KTD Store Management System
        </p>
      </div>
    `;
    return this.send({
      to: targetEmail,
      subject,
      html,
    });
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const from = options.from || this.fromEmail;
    const to = Array.isArray(options.to) ? options.to : [options.to];

    const hasResend = !!(this.resendApiKey && !this.resendApiKey.includes('placeholder'));
    const preferredProvider = this.configService.get<string>('EMAIL_PROVIDER', hasResend ? 'resend' : 'smtp');

    // Ưu tiên Resend API nếu được chỉ định hoặc có key (gửi qua HTTPS 443 không lo bị Render chặn cổng)
    if (preferredProvider === 'resend' && hasResend) {
      const res = await this.sendViaResend(options, from, to);
      if (res.success) return res;

      // Nếu Resend lỗi, dự phòng sang SMTP
      if (this.smtpTransporter) {
        this.logger.warn(`Resend failed, attempting fallback to SMTP...`);
        return this.sendViaSmtp(options, from, to);
      }
      return res;
    }

    // Mode 2: SMTP (Gmail / Custom SMTP)
    if (this.smtpTransporter) {
      const res = await this.sendViaSmtp(options, from, to);
      if (res.success) return res;

      // Nếu SMTP lỗi (ví dụ Render chặn port 465), tự động chuyển sang Resend
      if (hasResend) {
        this.logger.warn(`SMTP failed, falling back to Resend API for ${to.join(', ')}...`);
        return this.sendViaResend(options, from, to);
      }
      return res;
    }

    // Mode 3: Resend API nếu chưa xử lý ở trên
    if (hasResend) {
      return this.sendViaResend(options, from, to);
    }

    // Mode 4: Dev Mock / Local Simulation
    this.logger.log(
      `[DEV EMAIL SIMULATION] To: ${to.join(', ')} | Subject: "${options.subject}" | Provider: mock`,
    );
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      provider: 'mock',
    };
  }

  private async sendViaSmtp(options: SendEmailOptions, from: string, to: string[]): Promise<SendEmailResult> {
    try {
      const info = await this.smtpTransporter!.sendMail({
        from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent successfully via SMTP to ${to.join(', ')} (ID: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
        provider: 'smtp',
      };
    } catch (err: any) {
      this.logger.error(`Error sending email via SMTP: ${err.message}`);
      return {
        success: false,
        provider: 'smtp',
        error: err.message,
      };
    }
  }

  private async sendViaResend(options: SendEmailOptions, from: string, to: string[]): Promise<SendEmailResult> {
    try {
      // Khi dùng Resend với domain mặc định chưa verify, sender dùng 'KTD Store <onboarding@resend.dev>'
      let resendFrom = this.configService.get<string>('RESEND_FROM') || 'KTD Store <onboarding@resend.dev>';
      if (from && !from.includes('@gmail.com') && !from.includes('localhost')) {
        resendFrom = from;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Resend API failed: ${response.status} - ${errorBody}`);
        return {
          success: false,
          provider: 'resend',
          error: `HTTP ${response.status}: ${errorBody}`,
        };
      }

      const data: any = await response.json();
      this.logger.log(`Email sent successfully via Resend to ${to.join(', ')} (ID: ${data.id})`);
      return {
        success: true,
        messageId: data.id,
        provider: 'resend',
      };
    } catch (err: any) {
      this.logger.error(`Error sending email via Resend: ${err.message}`);
      return {
        success: false,
        provider: 'resend',
        error: err.message,
      };
    }
  }

  async sendOrderConfirmation(data: OrderConfirmationData): Promise<SendEmailResult> {
    const { subject, html } = this.templatesService.generateOrderConfirmation(data);
    return this.send({
      to: data.customerEmail,
      subject,
      html,
    });
  }

  async sendRefundConfirmation(data: RefundConfirmationData): Promise<SendEmailResult> {
    const { subject, html } = this.templatesService.generateRefundConfirmation(data);
    return this.send({
      to: data.customerEmail,
      subject,
      html,
    });
  }

  async sendAbandonedCartReminder(data: AbandonedCartData): Promise<SendEmailResult> {
    const { subject, html } = this.templatesService.generateAbandonedCartReminder(data);
    return this.send({
      to: data.customerEmail,
      subject,
      html,
    });
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<SendEmailResult> {
    const { subject, html } = this.templatesService.generateWelcomeEmail(data);
    return this.send({
      to: data.customerEmail,
      subject,
      html,
    });
  }

  async sendPasswordReset(data: PasswordResetEmailData): Promise<SendEmailResult> {
    const { subject, html } = this.templatesService.generatePasswordReset(data);
    return this.send({
      to: data.customerEmail,
      subject,
      html,
    });
  }

  async sendStaffCreatedEmail(data: StaffCreatedEmailData): Promise<SendEmailResult> {
    const { subject, html } = this.templatesService.generateStaffWelcomeEmail(data);
    return this.send({
      to: data.staffEmail,
      subject,
      html,
    });
  }

  async sendStaffStatusEmail(data: StaffStatusEmailData): Promise<SendEmailResult> {
    const { subject, html } = this.templatesService.generateStaffStatusEmail(data);
    return this.send({
      to: data.staffEmail,
      subject,
      html,
    });
  }

  async sendStaffUpdatedEmail(data: StaffUpdatedEmailData): Promise<SendEmailResult> {
    const { subject, html } = this.templatesService.generateStaffUpdatedEmail(data);
    return this.send({
      to: data.staffEmail,
      subject,
      html,
    });
  }
}



