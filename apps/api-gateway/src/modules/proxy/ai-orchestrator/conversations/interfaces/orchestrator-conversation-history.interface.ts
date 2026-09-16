// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/conversations/interfaces/orchestrator-conversation-history.interface.ts

export interface ListConversationHistoryQuery {
  user: string;
  conversation_id: string;
  first_id?: string;
  limit?: number;
}

export interface ConversationHistoryMessage {
  id: string;
  conversation_id: string;
  query: string;
  answer: string;
  status: string | null;
  inputs: Record<string, unknown>;
  error: string | null;
  parent_message_id: string | null;
  created_at: number | null;
  message_files: unknown[];
  retriever_resources: unknown[];
}

export interface ConversationHistory {
  data: ConversationHistoryMessage[];
  has_more: boolean;
  limit: number;
}
