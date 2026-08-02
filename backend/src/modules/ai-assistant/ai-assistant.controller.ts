import { Controller, Post, Body } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { ChatAiDto } from './dto/chat-ai.dto';

@Controller('ai-assistant')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('chat')
  chat(@Body() dto: ChatAiDto) {
    return this.aiAssistantService.chat(dto);
  }
}
