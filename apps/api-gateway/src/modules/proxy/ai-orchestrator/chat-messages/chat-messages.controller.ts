// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/chat-messages/chat-messages.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
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
import { ChatMessagesService } from './chat-messages.service';
import { ChatMessageResponseDto } from './dto/chat-message.response';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { SuggestedQuestionsResponseDto } from './dto/suggested-questions.response';
import { ChatMessageMapper } from './mappers/chat-message.mapper';
import { SuggestedQuestionsMapper } from './mappers/suggested-questions.mapper';

/**
 * Proxies chat message routes to bm-ai-orchestrator.
 * Client sends a Core Bearer token. Gateway calls the orchestrator with
 * `AI_ORCHESTRATOR_API_KEY` and scopes `user` from Core profile `userId`.
 *
 * Guard order: CoreBearerGuard (controller) → MenuPermissionGuard (APP_GUARD).
 * Core menu: `chat` / permission: `show-list-data` (only permission exposed by Core today).
 */
@ApiTags('Chat Messages')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing or invalid Core bearer token' })
@ApiForbiddenResponse({ description: 'Missing menu permission' })
@MenuKey(AI_CHAT_MENU_KEY)
@Controller()
@UseGuards(CoreBearerGuard)
export class ChatMessagesController {
  constructor(private readonly chatMessages: ChatMessagesService) {}

  @Post('chat-messages')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('show-list-data')
  @ApiOperation({
    summary: 'Send a chat message',
    description:
      'Forwards to bm-ai-orchestrator `POST /chat-messages` in blocking mode. `user` is taken from Core profile, not from the body.',
  })
  @ApiOkResponse({ type: ChatMessageResponseDto })
  async create(
    @Req() req: Request,
    @Body() dto: CreateChatMessageDto,
  ): Promise<ChatMessageResponseDto> {
    const result = await this.chatMessages.create(req, dto);
    return ChatMessageMapper.toResponse(result);
  }

  @Get('chat-messages/:message_id/suggested')
  @RequirePermission('show-list-data')
  @ApiOperation({
    summary: 'Get next suggested questions',
    description:
      'Forwards to bm-ai-orchestrator `GET /messages/{message_id}/suggested`. `user` is taken from Core profile, not from the query string.',
  })
  @ApiParam({
    name: 'message_id',
    example: '6bdac479-0884-4baf-990f-319b2a629417',
  })
  @ApiOkResponse({ type: SuggestedQuestionsResponseDto })
  async suggestedQuestions(
    @Req() req: Request,
    @Param('message_id') messageId: string,
  ): Promise<SuggestedQuestionsResponseDto> {
    const result = await this.chatMessages.suggestedQuestions(req, messageId);
    return SuggestedQuestionsMapper.toResponse(result);
  }
}
