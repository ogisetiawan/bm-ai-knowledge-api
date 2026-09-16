// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/chat-messages/dto/chat-message.response.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageResponseDto {
  @ApiPropertyOptional({ nullable: true, type: String })
  event!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  task_id!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  id!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  message_id!: string | null;

  @ApiProperty()
  conversation_id!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  mode!: string | null;

  @ApiProperty()
  answer!: string;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  metadata!: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  created_at!: number | null;
}
