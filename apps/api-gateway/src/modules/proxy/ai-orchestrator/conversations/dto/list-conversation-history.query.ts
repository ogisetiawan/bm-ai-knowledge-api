// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/conversations/dto/list-conversation-history.query.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  value === '' ? undefined : value;

export class ListConversationHistoryQueryDto {
  @ApiProperty({
    description: 'Conversation id whose history should be loaded',
    example: '202e779a-a8d2-4800-b05c-521cb94f916c',
  })
  @IsString()
  @IsNotEmpty()
  conversation_id!: string;

  @ApiPropertyOptional({
    description: 'Cursor from the previous page (`data[].id`)',
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  first_id?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20, example: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
