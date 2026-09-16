// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/conversations/dto/list-conversations.query.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ConversationSortBy } from '../interfaces/orchestrator-conversation.interface';

const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  value === '' ? undefined : value;

export class ListConversationsQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor from the previous page (`data[].id`)',
    example: '',
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  last_id?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20, example: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    enum: ['-created_at', '-updated_at', 'created_at', 'updated_at'],
    default: '-updated_at',
  })
  @IsOptional()
  @IsIn(['-created_at', '-updated_at', 'created_at', 'updated_at'])
  sort_by?: ConversationSortBy;
}
