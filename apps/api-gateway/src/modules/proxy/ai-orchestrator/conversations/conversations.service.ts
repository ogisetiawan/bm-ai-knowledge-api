// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/conversations/conversations.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../../auth/auth.service';
import { AiOrchestratorClient } from '../ai-orchestrator.client';
import { ListConversationHistoryQueryDto } from './dto/list-conversation-history.query';
import { ListConversationsQueryDto } from './dto/list-conversations.query';
import { RenameConversationDto } from './dto/rename-conversation.dto';
import { ConversationHistory } from './interfaces/orchestrator-conversation-history.interface';
import {
  Conversation,
  ConversationList,
} from './interfaces/orchestrator-conversation.interface';
import { ConversationHistoryMapper } from './mappers/conversation-history.mapper';
import { ConversationListMapper } from './mappers/conversation-list.mapper';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly auth: AuthService,
    private readonly orchestrator: AiOrchestratorClient,
  ) {}

  async list(
    req: Request,
    query: ListConversationsQueryDto,
  ): Promise<ConversationList> {
    const userId = await this.requireUserId(req);
    const raw = await this.orchestrator.getConversations({
      user: userId,
      last_id: query.last_id,
      limit: query.limit,
      sort_by: query.sort_by,
    });

    return ConversationListMapper.toDomain(raw);
  }

  async history(
    req: Request,
    query: ListConversationHistoryQueryDto,
  ): Promise<ConversationHistory> {
    const userId = await this.requireUserId(req);
    const raw = await this.orchestrator.getMessages({
      user: userId,
      conversation_id: query.conversation_id,
      first_id: query.first_id,
      limit: query.limit,
    });

    return ConversationHistoryMapper.toDomain(raw);
  }

  async rename(
    req: Request,
    conversationId: string,
    dto: RenameConversationDto,
  ): Promise<Conversation> {
    const userId = await this.requireUserId(req);
    const raw = await this.orchestrator.renameConversation({
      conversation_id: conversationId,
      user: userId,
      name: dto.name,
      auto_generate: dto.auto_generate,
    });

    return ConversationListMapper.toConversationDomain(raw);
  }

  async remove(req: Request, conversationId: string): Promise<void> {
    const userId = await this.requireUserId(req);
    await this.orchestrator.deleteConversation({
      conversation_id: conversationId,
      user: userId,
    });
  }

  private async requireUserId(req: Request): Promise<string> {
    const authContext = await this.auth.getAuthContext(req);
    if (!authContext.userId) {
      throw new UnauthorizedException('Core profile is missing userId');
    }
    return authContext.userId;
  }
}
