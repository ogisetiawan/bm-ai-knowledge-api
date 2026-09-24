// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/conversations/conversations.controller.ts
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { MenuKey } from '../../../auth/decorators/menu-key.decorator';
import { RequirePermission } from '../../../auth/decorators/require-permission.decorator';
import { CoreBearerGuard } from '../../../auth/guards/core-bearer.guard';
import { AI_CHAT_MENU_KEY } from '../ai-orchestrator.constants';
import { ConversationsService } from './conversations.service';
import { ConversationHistoryResponseDto } from './dto/conversation-history.response';
import {
  ConversationItemDto,
  ConversationListResponseDto,
} from './dto/conversation-list.response';
import { ListConversationHistoryQueryDto } from './dto/list-conversation-history.query';
import { ListConversationsQueryDto } from './dto/list-conversations.query';
import { RenameConversationDto } from './dto/rename-conversation.dto';
import { ConversationHistoryMapper } from './mappers/conversation-history.mapper';
import { ConversationListMapper } from './mappers/conversation-list.mapper';

/**
 * Proxies conversation routes to bm-ai-orchestrator.
 * Client sends a Core Bearer token. Gateway calls the orchestrator with
 * `AI_ORCHESTRATOR_API_KEY` and scopes `user` from Core profile `userId`.
 *
 * Guard order: CoreBearerGuard (controller) → MenuPermissionGuard (APP_GUARD).
 * Core menu: `chat` / permission: `show-list-data` (only permission exposed by Core today).
 */
@ApiTags('Conversations')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing or invalid Core bearer token' })
@ApiForbiddenResponse({ description: 'Missing menu permission' })
@MenuKey(AI_CHAT_MENU_KEY)
@Controller()
@UseGuards(CoreBearerGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get('conversations')
  @RequirePermission('show-list-data')
  @ApiOperation({
    summary: 'List AI conversations',
    description:
      'Forwards to bm-ai-orchestrator `GET /conversations`. `user` is taken from Core profile, not from the query string.',
  })
  @ApiOkResponse({ type: ConversationListResponseDto })
  async list(
    @Req() req: Request,
    @Query() query: ListConversationsQueryDto,
  ): Promise<ConversationListResponseDto> {
    const result = await this.conversations.list(req, query);
    return ConversationListMapper.toResponse(result);
  }

  @Get('conversations-history')
  @RequirePermission('show-list-data')
  @ApiOperation({
    summary: 'List conversation message history',
    description:
      'Forwards to bm-ai-orchestrator `GET /messages`. `user` is taken from Core profile, not from the query string.',
  })
  @ApiOkResponse({ type: ConversationHistoryResponseDto })
  async history(
    @Req() req: Request,
    @Query() query: ListConversationHistoryQueryDto,
  ): Promise<ConversationHistoryResponseDto> {
    const result = await this.conversations.history(req, query);
    return ConversationHistoryMapper.toResponse(result);
  }

  @Post('conversations/:conversation_id/name')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('show-list-data')
  @ApiOperation({
    summary: 'Rename a conversation',
    description:
      'Forwards to bm-ai-orchestrator `POST /conversations/{id}/name`. `user` is taken from Core profile, not from the body.',
  })
  @ApiParam({
    name: 'conversation_id',
    example: '202e779a-a8d2-4800-b05c-521cb94f916c',
  })
  @ApiOkResponse({ type: ConversationItemDto })
  async rename(
    @Req() req: Request,
    @Param('conversation_id') conversationId: string,
    @Body() dto: RenameConversationDto,
  ): Promise<ConversationItemDto> {
    const result = await this.conversations.rename(req, conversationId, dto);
    return ConversationListMapper.toConversationResponse(result);
  }

  @Delete('conversations/:conversation_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('show-list-data')
  @ApiOperation({
    summary: 'Delete a conversation',
    description:
      'Forwards to bm-ai-orchestrator `DELETE /conversations/{id}`. `user` is taken from Core profile, not from the body.',
  })
  @ApiParam({
    name: 'conversation_id',
    example: '202e779a-a8d2-4800-b05c-521cb94f916c',
  })
  @ApiNoContentResponse({ description: 'Conversation deleted' })
  async remove(
    @Req() req: Request,
    @Param('conversation_id') conversationId: string,
  ): Promise<void> {
    await this.conversations.remove(req, conversationId);
  }
}
