// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/conversations/dto/rename-conversation.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  value === '' ? undefined : value;

export class RenameConversationDto {
  @ApiPropertyOptional({
    example: 'Rename Conversations',
    description: 'Required unless `auto_generate` is true',
  })
  @Transform(emptyToUndefined)
  @ValidateIf((dto: RenameConversationDto) => dto.auto_generate !== true)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'When true, the orchestrator generates the conversation name',
  })
  @IsOptional()
  @IsBoolean()
  auto_generate?: boolean;
}
