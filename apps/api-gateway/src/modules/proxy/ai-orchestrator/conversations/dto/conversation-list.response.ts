// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/conversations/dto/conversation-list.response.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConversationItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  inputs!: Record<string, unknown>;

  @ApiPropertyOptional({ nullable: true, type: String })
  introduction!: string | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  created_at!: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  updated_at!: number | null;
}

export class ConversationListResponseDto {
  @ApiProperty({ type: [ConversationItemDto] })
  data!: ConversationItemDto[];

  @ApiProperty()
  has_more!: boolean;

  @ApiProperty()
  limit!: number;
}
