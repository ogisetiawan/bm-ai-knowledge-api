// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/conversations/interfaces/orchestrator-conversation.interface.ts

export type ConversationSortBy =
  | '-created_at'
  | '-updated_at'
  | 'created_at'
  | 'updated_at';

export interface ListConversationsQuery {
  user: string;
  last_id?: string;
  limit?: number;
  sort_by?: ConversationSortBy;
}

export interface Conversation {
  id: string;
  name: string;
  status: string;
  inputs: Record<string, unknown>;
  introduction: string | null;
  created_at: number | null;
  updated_at: number | null;
}

export interface ConversationList {
  data: Conversation[];
  has_more: boolean;
  limit: number;
}

export interface RenameConversationRequest {
  conversation_id: string;
  user: string;
  name?: string;
  auto_generate?: boolean;
}

export interface DeleteConversationRequest {
  conversation_id: string;
  user: string;
}
