import { Controller, Get, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('status')
  getStatus() {
    return this.emailService.getStatus();
  }

  @Get('verify')
  async verify() {
    return this.emailService.verifyConnection();
  }

  @Post('test')
  async sendTest(@Body('email') email?: string) {
    return this.emailService.sendTestEmail(email || 'domjnhkhoa45@gmail.com');
  }
}
