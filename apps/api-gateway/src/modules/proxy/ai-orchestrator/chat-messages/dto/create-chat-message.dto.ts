// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/chat-messages/dto/create-chat-message.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  value === '' ? undefined : value;

export class CreateChatMessageDto {
  @ApiProperty({
    example: 'is SEPINOV EMT 10 classified as a hazardous chemical?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  query!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    default: {},
  })
  @IsOptional()
  @IsObject()
  inputs?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Empty or omitted starts a new conversation',
    example: '',
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  conversation_id?: string;

  @ApiPropertyOptional({
    enum: ['blocking'],
    default: 'blocking',
    description: 'Only blocking is supported on this gateway route',
  })
  @IsOptional()
  @IsIn(['blocking'])
  response_mode?: 'blocking';
}
