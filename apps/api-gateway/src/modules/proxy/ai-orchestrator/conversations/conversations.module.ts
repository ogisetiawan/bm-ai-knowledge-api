// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/conversations/conversations.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module';
import { AiOrchestratorModule } from '../ai-orchestrator.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [AuthModule, AiOrchestratorModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
