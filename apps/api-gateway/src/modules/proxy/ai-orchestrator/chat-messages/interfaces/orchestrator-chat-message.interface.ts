// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/chat-messages/interfaces/orchestrator-chat-message.interface.ts

export interface CreateChatMessageRequest {
  user: string;
  query: string;
  inputs: Record<string, unknown>;
  conversation_id: string;
  response_mode: 'blocking';
}

export interface ChatMessage {
  event: string | null;
  task_id: string | null;
  id: string | null;
  message_id: string | null;
  conversation_id: string;
  mode: string | null;
  answer: string;
  metadata: Record<string, unknown> | null;
  created_at: number | null;
}

export interface GetSuggestedQuestionsRequest {
  message_id: string;
  user: string;
}

export interface SuggestedQuestions {
  result: string;
  data: string[];
}
