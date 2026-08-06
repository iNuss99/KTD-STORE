import { Controller, Post, Get, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('sepay')
  pingSepay() {
    return { success: true, message: 'SePay webhook endpoint active' };
  }

  @Post('sepay')
  handleSepayWebhook(@Body() payload: any) {
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
    const expectedToken = process.env.CASSO_SECURE_TOKEN;
    if (expectedToken) {
      const token = secureToken || xCassoToken;
      if (token !== expectedToken) {
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
  handlePayosWebhook(@Body() payload: any) {
    return this.ordersService.processPayosWebhook(payload);
  }
}

