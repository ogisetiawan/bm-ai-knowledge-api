// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/chat-messages/chat-messages.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../../auth/auth.service';
import { AiOrchestratorClient } from '../ai-orchestrator.client';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import {
  ChatMessage,
  SuggestedQuestions,
} from './interfaces/orchestrator-chat-message.interface';
import { ChatMessageMapper } from './mappers/chat-message.mapper';
import { SuggestedQuestionsMapper } from './mappers/suggested-questions.mapper';

@Injectable()
export class ChatMessagesService {
  constructor(
    private readonly auth: AuthService,
    private readonly orchestrator: AiOrchestratorClient,
  ) {}

  async create(req: Request, dto: CreateChatMessageDto): Promise<ChatMessage> {
    const userId = await this.requireUserId(req);
    const raw = await this.orchestrator.createChatMessage({
      user: userId,
      query: dto.query,
      inputs: dto.inputs ?? {},
      conversation_id: dto.conversation_id ?? '',
      response_mode: dto.response_mode ?? 'blocking',
    });

    return ChatMessageMapper.toDomain(raw);
  }

  async suggestedQuestions(
    req: Request,
    messageId: string,
  ): Promise<SuggestedQuestions> {
    const userId = await this.requireUserId(req);
    const raw = await this.orchestrator.getSuggestedQuestions({
      message_id: messageId,
      user: userId,
    });

    return SuggestedQuestionsMapper.toDomain(raw);
  }

  private async requireUserId(req: Request): Promise<string> {
    const authContext = await this.auth.getAuthContext(req);
    if (!authContext.userId) {
      throw new UnauthorizedException('Core profile is missing userId');
    }
    return authContext.userId;
  }
}
