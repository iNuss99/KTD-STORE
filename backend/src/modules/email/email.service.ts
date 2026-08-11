import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailTemplatesService } from './email-templates.service';
import {
  SendEmailOptions,
  SendEmailResult,
  OrderConfirmationData,
  RefundConfirmationData,
  AbandonedCartData,
  WelcomeEmailData,
  PasswordResetEmailData,
} from './email.types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger('EmailService');
  private readonly resendApiKey: string | undefined;
  private readonly fromEmail: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly templatesService: EmailTemplatesService,
  ) {
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail =
      this.configService.get<string>('MAIL_FROM') || 'MenWear Hub <notifications@menwearhub.vn>';
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const from = options.from || this.fromEmail;
    const to = Array.isArray(options.to) ? options.to : [options.to];

    // Mode 1: Resend API
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

    // Mode 2: Dev Mock / Local Simulation
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
}
