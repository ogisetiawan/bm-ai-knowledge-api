// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/chat-messages/dto/suggested-questions.response.ts
import { ApiProperty } from '@nestjs/swagger';

export class SuggestedQuestionsResponseDto {
  @ApiProperty({ example: 'success' })
  result!: string;

  @ApiProperty({
    type: [String],
    example: ['What is the SDS classification?', 'Is it flammable?'],
  })
  data!: string[];
}
