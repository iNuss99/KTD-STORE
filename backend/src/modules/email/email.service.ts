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
    this.fromEmail =
      this.configService.get<string>('MAIL_FROM') || 'KTD Store <support@ktdstore.vn>';

    // Configure SMTP if credentials are provided
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const smtpHost = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = Number(this.configService.get<number>('SMTP_PORT') || 465);
    const smtpSecure = this.configService.get<string>('SMTP_SECURE', 'true') === 'true';

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
        });
        this.logger.log(`SMTP configured successfully with ${smtpHost}:${smtpPort} (User: ${smtpUser})`);
      } catch (err: any) {
        this.logger.error(`Failed to initialize SMTP transporter: ${err.message}`);
      }
    }
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const from = options.from || this.fromEmail;
    const to = Array.isArray(options.to) ? options.to : [options.to];

    // Mode 1: SMTP (Gmail / Custom SMTP)
    if (this.smtpTransporter) {
      try {
        const info = await this.smtpTransporter.sendMail({
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

    // Mode 2: Resend API
    if (this.resendApiKey && !this.resendApiKey.includes('placeholder')) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
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

    // Mode 3: Dev Mock / Local Simulation
    this.logger.log(
      `[DEV EMAIL SIMULATION] To: ${to.join(', ')} | Subject: "${options.subject}" | Provider: mock`,
    );
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      provider: 'mock',
    };
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
}


