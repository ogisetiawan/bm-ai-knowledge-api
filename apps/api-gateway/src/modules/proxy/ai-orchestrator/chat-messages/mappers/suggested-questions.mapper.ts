// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/chat-messages/mappers/suggested-questions.mapper.ts
import { BadGatewayException } from '@nestjs/common';
import { SuggestedQuestionsResponseDto } from '../dto/suggested-questions.response';
import { SuggestedQuestions } from '../interfaces/orchestrator-chat-message.interface';

export class SuggestedQuestionsMapper {
  static toDomain(payload: unknown): SuggestedQuestions {
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      throw new BadGatewayException(
        'AI Orchestrator returned invalid suggested questions',
      );
    }

    const record = payload as Record<string, unknown>;
    const result = record['result'];
    const data = record['data'];
    if (typeof result !== 'string' || !Array.isArray(data)) {
      throw new BadGatewayException(
        'AI Orchestrator returned invalid suggested questions',
      );
    }

    if (!data.every((item): item is string => typeof item === 'string')) {
      throw new BadGatewayException(
        'AI Orchestrator returned invalid suggested questions',
      );
    }

    return { result, data };
  }

  static toResponse(domain: SuggestedQuestions): SuggestedQuestionsResponseDto {
    return {
      result: domain.result,
      data: domain.data,
    };
  }
}
