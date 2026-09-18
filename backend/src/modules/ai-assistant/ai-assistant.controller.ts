import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiAssistantService } from './ai-assistant.service';
import { ChatAiDto } from './dto/chat-ai.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai-assistant')
@UseGuards(JwtAuthGuard)
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  // Rate limit: 10 yêu cầu / phút / user — ngăn spam AI
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('chat')
  chat(@Body() dto: ChatAiDto) {
    return this.aiAssistantService.chat(dto);
  }
}

