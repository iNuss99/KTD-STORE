import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailTemplatesService } from './email-templates.service';
import { EmailConsumer } from './email.consumer';
import { AbandonedCartService } from './abandoned-cart.service';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, EmailTemplatesService, EmailConsumer, AbandonedCartService],
  exports: [EmailService, EmailTemplatesService, AbandonedCartService],
})
export class EmailModule {}
