// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/conversations/mappers/conversation-list.mapper.ts
import { BadGatewayException } from '@nestjs/common';
import { ConversationItemDto, ConversationListResponseDto } from '../dto/conversation-list.response';
import {
  Conversation,
  ConversationList,
} from '../interfaces/orchestrator-conversation.interface';

export class ConversationListMapper {
  static toDomain(payload: unknown): ConversationList {
    const record = asRecord(payload);
    if (record === null) {
      throw new BadGatewayException('AI Orchestrator returned an invalid conversation list');
    }

    const rows = record['data'];
    if (!Array.isArray(rows)) {
      throw new BadGatewayException('AI Orchestrator returned an invalid conversation list');
    }

    const hasMore = record['has_more'];
    const limit = record['limit'];
    if (typeof hasMore !== 'boolean' || typeof limit !== 'number') {
      throw new BadGatewayException('AI Orchestrator returned an invalid conversation list');
    }

    return {
      data: rows.map((row) => toConversation(row)),
      has_more: hasMore,
      limit,
    };
  }

  static toConversationDomain(payload: unknown): Conversation {
    return toConversation(payload);
  }

  static toConversationResponse(domain: Conversation): ConversationItemDto {
    return {
      id: domain.id,
      name: domain.name,
      status: domain.status,
      inputs: domain.inputs,
      introduction: domain.introduction,
      created_at: domain.created_at,
      updated_at: domain.updated_at,
    };
  }

  static toResponse(domain: ConversationList): ConversationListResponseDto {
    return {
      data: domain.data,
      has_more: domain.has_more,
      limit: domain.limit,
    };
  }
}

function toConversation(value: unknown): Conversation {
  const record = asRecord(value);
  if (record === null) {
    throw new BadGatewayException('AI Orchestrator returned an invalid conversation');
  }

  const id = record['id'];
  const name = record['name'];
  const status = record['status'];
  if (typeof id !== 'string' || typeof name !== 'string' || typeof status !== 'string') {
    throw new BadGatewayException('AI Orchestrator returned an invalid conversation');
  }

  return {
    id,
    name,
    status,
    inputs: toInputs(record['inputs']),
    introduction: toNullableString(record['introduction']),
    created_at: toNullableNumber(record['created_at']),
    updated_at: toNullableNumber(record['updated_at']),
  };
}

function toInputs(value: unknown): Record<string, unknown> {
  const record = asRecord(value);
  return record ?? {};
}

function toNullableString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new BadGatewayException('AI Orchestrator returned an invalid conversation');
  }
  return value;
}

function toNullableNumber(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'number') {
    throw new BadGatewayException('AI Orchestrator returned an invalid conversation');
  }
  return value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
