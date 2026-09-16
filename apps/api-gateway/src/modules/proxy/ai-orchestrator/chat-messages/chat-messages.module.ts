// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/chat-messages/chat-messages.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module';
import { AiOrchestratorModule } from '../ai-orchestrator.module';
import { ChatMessagesController } from './chat-messages.controller';
import { ChatMessagesService } from './chat-messages.service';

@Module({
  imports: [AuthModule, AiOrchestratorModule],
  controllers: [ChatMessagesController],
  providers: [ChatMessagesService],
})
export class ChatMessagesModule {}
