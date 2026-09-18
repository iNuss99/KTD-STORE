import { Controller, Post, Get, Body, Headers, Req, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { OrdersService } from './orders.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
  ) {}

  @Get('sepay')
  pingSepay() {
    return { success: true, message: 'SePay webhook endpoint active' };
  }

  @Post('sepay')
  handleSepayWebhook(
    @Body() payload: any,
    @Req() req: any,
    @Headers('x-sepay-signature') signature?: string,
  ) {
    const webhookSecret = this.configService.get<string>('SEPAY_WEBHOOK_SECRET');
    if (webhookSecret) {
      // Verify HMAC-SHA256 signature using raw body
      const rawBody: string = req.rawBody || JSON.stringify(payload);
      const computed = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');
      if (!signature || signature !== computed) {
        this.logger.warn(`[Sepay] Invalid webhook signature. Expected ${computed.slice(0, 8)}... got ${signature?.slice(0, 8) || 'none'}`);
        throw new UnauthorizedException('Invalid SePay webhook signature');
      }
    }
    return this.ordersService.processSepayWebhook(payload);
  }

  @Get('casso')
  pingCasso() {
    return { success: true, message: 'Casso webhook endpoint active' };
  }

  @Post('casso')
  handleCassoWebhook(
    @Body() payload: any,
    @Headers('secure-token') secureToken?: string,
    @Headers('x-casso-token') xCassoToken?: string,
  ) {
    const expectedToken = this.configService.get<string>('CASSO_SECURE_TOKEN');
    if (expectedToken) {
      const token = secureToken || xCassoToken;
      if (token !== expectedToken) {
        this.logger.warn('[Casso] Invalid secure token on webhook');
        throw new UnauthorizedException('Invalid Casso Secure Token');
      }
    }
    return this.ordersService.processCassoWebhook(payload);
  }

  @Get('payos')
  pingPayos() {
    return { success: true, message: 'PayOS webhook endpoint active' };
  }

  @Post('payos')
  handlePayosWebhook(
    @Body() payload: any,
    @Headers('x-payos-signature') signature?: string,
  ) {
    const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');
    if (checksumKey && payload?.data) {
      // PayOS signature: HMAC-SHA256 of the data object sorted keys
      const data = payload.data;
      const sortedKeys = Object.keys(data).sort();
      const signStr = sortedKeys
        .filter((k) => data[k] !== undefined && data[k] !== null)
        .map((k) => `${k}=${data[k]}`)
        .join('&');
      const computed = crypto
        .createHmac('sha256', checksumKey)
        .update(signStr)
        .digest('hex');
      if (signature && signature !== computed) {
        this.logger.warn('[PayOS] Invalid webhook signature');
        throw new UnauthorizedException('Invalid PayOS webhook signature');
      }
    }
    return this.ordersService.processPayosWebhook(payload);
  }
}

