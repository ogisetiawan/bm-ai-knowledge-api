// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/conversations/mappers/conversation-history.mapper.ts
import { BadGatewayException } from '@nestjs/common';
import { ConversationHistoryResponseDto } from '../dto/conversation-history.response';
import {
  ConversationHistory,
  ConversationHistoryMessage,
} from '../interfaces/orchestrator-conversation-history.interface';

export class ConversationHistoryMapper {
  static toDomain(payload: unknown): ConversationHistory {
    const record = asRecord(payload);
    if (record === null) {
      throw new BadGatewayException(
        'AI Orchestrator returned an invalid conversation history',
      );
    }

    const rows = record['data'];
    if (!Array.isArray(rows)) {
      throw new BadGatewayException(
        'AI Orchestrator returned an invalid conversation history',
      );
    }

    const hasMore = record['has_more'];
    const limit = record['limit'];
    if (typeof hasMore !== 'boolean' || typeof limit !== 'number') {
      throw new BadGatewayException(
        'AI Orchestrator returned an invalid conversation history',
      );
    }

    return {
      data: rows.map((row) => toMessage(row)),
      has_more: hasMore,
      limit,
    };
  }

  static toResponse(domain: ConversationHistory): ConversationHistoryResponseDto {
    return {
      data: domain.data,
      has_more: domain.has_more,
      limit: domain.limit,
    };
  }
}

function toMessage(value: unknown): ConversationHistoryMessage {
  const record = asRecord(value);
  if (record === null) {
    throw new BadGatewayException('AI Orchestrator returned an invalid message');
  }

  const id = record['id'];
  const conversationId = record['conversation_id'];
  const query = record['query'];
  const answer = record['answer'];
  if (
    typeof id !== 'string' ||
    typeof conversationId !== 'string' ||
    typeof query !== 'string' ||
    typeof answer !== 'string'
  ) {
    throw new BadGatewayException('AI Orchestrator returned an invalid message');
  }

  return {
    id,
    conversation_id: conversationId,
    query,
    answer,
    status: toNullableString(record['status']),
    inputs: toInputs(record['inputs']),
    error: toNullableString(record['error']),
    parent_message_id: toNullableString(record['parent_message_id']),
    created_at: toNullableNumber(record['created_at']),
    message_files: toUnknownArray(record['message_files']),
    retriever_resources: toUnknownArray(record['retriever_resources']),
  };
}

function toInputs(value: unknown): Record<string, unknown> {
  const record = asRecord(value);
  return record ?? {};
}

function toUnknownArray(value: unknown): unknown[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new BadGatewayException('AI Orchestrator returned an invalid message');
  }
  return value;
}

function toNullableString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new BadGatewayException('AI Orchestrator returned an invalid message');
  }
  return value;
}

function toNullableNumber(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'number') {
    throw new BadGatewayException('AI Orchestrator returned an invalid message');
  }
  return value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
