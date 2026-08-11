import { Controller, Post, Get, Body, Query, Req, Res, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('vnpay/create-url')
  createVnpayUrl(
    @Body('orderId') orderId: string,
    @Body('amount') amount: number,
    @Body('bankCode') bankCode: string,
    @Req() req: any,
  ) {
    if (!orderId || !amount) {
      throw new BadRequestException('Mã đơn hàng và số tiền là bắt buộc.');
    }
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    return this.paymentsService.createVnpayPaymentUrl(orderId, Number(amount), String(ipAddr), bankCode);
  }

  @Get('vnpay/callback')
  async vnpayCallback(@Query() query: Record<string, any>, @Res() res: any) {
    const result = this.paymentsService.verifyVnpayCallback(query);
    if (!result.isValid) {
      return res.status(400).json({ success: false, message: 'Chữ ký VNPay không hợp lệ' });
    }

    if (result.isSuccess && result.orderId) {
      await this.paymentsService.handlePaymentSuccess(
        result.orderId,
        query['vnp_TransactionNo'] || query['vnp_TxnRef'] || 'VNPAY_TXN',
        'VNPAY',
      );
      return res.redirect(`http://localhost:5173/orders/${result.orderId}?payment_success=1`);
    }

    return res.redirect(`http://localhost:5173/orders/${result.orderId || ''}?payment_error=1`);
  }

  @Get('vnpay/ipn')
  async vnpayIpn(@Query() query: Record<string, any>) {
    const result = this.paymentsService.verifyVnpayCallback(query);
    if (!result.isValid) {
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    if (result.isSuccess && result.orderId) {
      try {
        await this.paymentsService.handlePaymentSuccess(
          result.orderId,
          query['vnp_TransactionNo'] || query['vnp_TxnRef'] || 'VNPAY_IPN',
          'VNPAY',
        );
        return { RspCode: '00', Message: 'Confirm Success' };
      } catch (err: any) {
        return { RspCode: '01', Message: err.message || 'Order Not Found' };
      }
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  }
}
