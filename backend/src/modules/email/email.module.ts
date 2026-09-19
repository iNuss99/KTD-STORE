import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailTemplatesService } from './email-templates.service';
import { EmailConsumer } from './email.consumer';
import { AbandonedCartService } from './abandoned-cart.service';
import { EmailController } from './email.controller';

@Module({
  imports: [ConfigModule],
  controllers: [EmailController],
  providers: [EmailService, EmailTemplatesService, EmailConsumer, AbandonedCartService],
  exports: [EmailService, EmailTemplatesService, AbandonedCartService],
})
export class EmailModule {}
