import { Controller, Post, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('sepay')
  handleSepayWebhook(@Body() payload: any) {
    return this.ordersService.processSepayWebhook(payload);
  }
}
