// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/chat-messages/mappers/chat-message.mapper.ts
import { BadGatewayException } from '@nestjs/common';
import { ChatMessageResponseDto } from '../dto/chat-message.response';
import { ChatMessage } from '../interfaces/orchestrator-chat-message.interface';

export class ChatMessageMapper {
  static toDomain(payload: unknown): ChatMessage {
    const record = asRecord(payload);
    if (record === null) {
      throw new BadGatewayException('AI Orchestrator returned an invalid chat message');
    }

    const answer = record['answer'];
    const conversationId = record['conversation_id'];
    if (typeof answer !== 'string' || typeof conversationId !== 'string') {
      throw new BadGatewayException('AI Orchestrator returned an invalid chat message');
    }

    return {
      event: toNullableString(record['event']),
      task_id: toNullableString(record['task_id']),
      id: toNullableString(record['id']),
      message_id: toNullableString(record['message_id']),
      conversation_id: conversationId,
      mode: toNullableString(record['mode']),
      answer,
      metadata: toNullableRecord(record['metadata']),
      created_at: toNullableNumber(record['created_at']),
    };
  }

  static toResponse(domain: ChatMessage): ChatMessageResponseDto {
    return {
      event: domain.event,
      task_id: domain.task_id,
      id: domain.id,
      message_id: domain.message_id,
      conversation_id: domain.conversation_id,
      mode: domain.mode,
      answer: domain.answer,
      metadata: domain.metadata,
      created_at: domain.created_at,
    };
  }
}

function toNullableString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new BadGatewayException('AI Orchestrator returned an invalid chat message');
  }
  return value;
}

function toNullableNumber(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'number') {
    throw new BadGatewayException('AI Orchestrator returned an invalid chat message');
  }
  return value;
}

function toNullableRecord(value: unknown): Record<string, unknown> | null {
  if (value === undefined || value === null) {
    return null;
  }
  const record = asRecord(value);
  if (record === null) {
    throw new BadGatewayException('AI Orchestrator returned an invalid chat message');
  }
  return record;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
