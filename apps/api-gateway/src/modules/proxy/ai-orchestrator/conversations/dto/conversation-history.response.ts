// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/conversations/dto/conversation-history.response.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConversationHistoryMessageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  conversation_id!: string;

  @ApiProperty()
  query!: string;

  @ApiProperty()
  answer!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  status!: string | null;

  @ApiProperty({ type: 'object', additionalProperties: true })
  inputs!: Record<string, unknown>;

  @ApiPropertyOptional({ nullable: true, type: String })
  error!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  parent_message_id!: string | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  created_at!: number | null;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  message_files!: unknown[];

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  retriever_resources!: unknown[];
}

export class ConversationHistoryResponseDto {
  @ApiProperty({ type: [ConversationHistoryMessageDto] })
  data!: ConversationHistoryMessageDto[];

  @ApiProperty()
  has_more!: boolean;

  @ApiProperty()
  limit!: number;
}
