// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/ai-orchestrator.constants.ts

export const AI_ORCHESTRATOR_TIMEOUT_MS = 5000;
export const AI_ORCHESTRATOR_CHAT_TIMEOUT_MS = 60_000;
export const AI_ORCHESTRATOR_RETRY_ATTEMPTS = 3;

/** Core `menu_key` for AI Chat routes (`GET /auth/menupermissions` → `chat`). */
export const AI_CHAT_MENU_KEY = 'chat';
