// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/ai-orchestrator.client.ts
import {
  BadGatewayException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { HEADERS } from '@common/index';
import {
  AI_ORCHESTRATOR_CHAT_TIMEOUT_MS,
  AI_ORCHESTRATOR_RETRY_ATTEMPTS,
  AI_ORCHESTRATOR_TIMEOUT_MS,
} from './ai-orchestrator.constants';
import {
  CreateChatMessageRequest,
  GetSuggestedQuestionsRequest,
} from './chat-messages/interfaces/orchestrator-chat-message.interface';
import { ListConversationHistoryQuery } from './conversations/interfaces/orchestrator-conversation-history.interface';
import {
  DeleteConversationRequest,
  ListConversationsQuery,
  RenameConversationRequest,
} from './conversations/interfaces/orchestrator-conversation.interface';

/**
 * HTTP client for bm-ai-orchestrator (`https://ai.behnmeyer.com/v1`).
 * Auth to the orchestrator is the server-side app API key — never the Core user JWT.
 */
@Injectable()
export class AiOrchestratorClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = config
      .getOrThrow<string>('aiOrchestrator.baseUrl')
      .replace(/\/+$/, '');
    this.apiKey = config.getOrThrow<string>('aiOrchestrator.apiKey');
  }

  async getConversations(query: ListConversationsQuery): Promise<unknown> {
    return this.request(
      {
        method: 'GET',
        url: `${this.baseUrl}/conversations`,
        params: this.toQueryParams(query),
        headers: this.downstreamHeaders(),
        timeout: AI_ORCHESTRATOR_TIMEOUT_MS,
      },
      AI_ORCHESTRATOR_RETRY_ATTEMPTS,
    );
  }

  async getMessages(query: ListConversationHistoryQuery): Promise<unknown> {
    return this.request(
      {
        method: 'GET',
        url: `${this.baseUrl}/messages`,
        params: this.toMessageQueryParams(query),
        headers: this.downstreamHeaders(),
        timeout: AI_ORCHESTRATOR_TIMEOUT_MS,
      },
      AI_ORCHESTRATOR_RETRY_ATTEMPTS,
    );
  }

  async renameConversation(
    payload: RenameConversationRequest,
  ): Promise<unknown> {
    const body: Record<string, unknown> = {
      user: payload.user,
      auto_generate: payload.auto_generate ?? false,
    };
    if (payload.name !== undefined) {
      body['name'] = payload.name;
    }

    return this.request(
      {
        method: 'POST',
        url: `${this.baseUrl}/conversations/${encodeURIComponent(payload.conversation_id)}/name`,
        data: body,
        headers: {
          ...this.downstreamHeaders(),
          'content-type': 'application/json',
        },
        timeout: AI_ORCHESTRATOR_TIMEOUT_MS,
      },
      AI_ORCHESTRATOR_RETRY_ATTEMPTS,
    );
  }

  async deleteConversation(
    payload: DeleteConversationRequest,
  ): Promise<void> {
    // DELETE is not retried: a timeout after the orchestrator accepted the
    // request would look like a 404 on retry.
    await this.request(
      {
        method: 'DELETE',
        url: `${this.baseUrl}/conversations/${encodeURIComponent(payload.conversation_id)}`,
        data: { user: payload.user },
        headers: {
          ...this.downstreamHeaders(),
          accept: 'application/json',
          'content-type': 'application/json',
        },
        timeout: AI_ORCHESTRATOR_TIMEOUT_MS,
      },
      1,
    );
  }

  async createChatMessage(payload: CreateChatMessageRequest): Promise<unknown> {
    // POST is not retried: a timeout after the orchestrator accepted the
    // request would duplicate the user message.
    return this.request(
      {
        method: 'POST',
        url: `${this.baseUrl}/chat-messages`,
        data: payload,
        headers: {
          ...this.downstreamHeaders(),
          'content-type': 'application/json',
        },
        timeout: AI_ORCHESTRATOR_CHAT_TIMEOUT_MS,
      },
      1,
    );
  }

  async getSuggestedQuestions(
    payload: GetSuggestedQuestionsRequest,
  ): Promise<unknown> {
    return this.request(
      {
        method: 'GET',
        url: `${this.baseUrl}/messages/${encodeURIComponent(payload.message_id)}/suggested`,
        params: { user: payload.user },
        headers: {
          ...this.downstreamHeaders(),
          'content-type': 'application/json',
        },
        timeout: AI_ORCHESTRATOR_TIMEOUT_MS,
      },
      AI_ORCHESTRATOR_RETRY_ATTEMPTS,
    );
  }

  private downstreamHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      [HEADERS.REQUEST_ID]: randomUUID(),
    };
  }

  private toQueryParams(
    query: ListConversationsQuery,
  ): Record<string, string | number> {
    const params: Record<string, string | number> = { user: query.user };
    if (query.last_id !== undefined && query.last_id.length > 0) {
      params['last_id'] = query.last_id;
    }
    if (query.limit !== undefined) {
      params['limit'] = query.limit;
    }
    if (query.sort_by !== undefined) {
      params['sort_by'] = query.sort_by;
    }
    return params;
  }

  private toMessageQueryParams(
    query: ListConversationHistoryQuery,
  ): Record<string, string | number> {
    const params: Record<string, string | number> = {
      user: query.user,
      conversation_id: query.conversation_id,
    };
    if (query.first_id !== undefined && query.first_id.length > 0) {
      params['first_id'] = query.first_id;
    }
    if (query.limit !== undefined) {
      params['limit'] = query.limit;
    }
    return params;
  }

  private async request(
    config: AxiosRequestConfig,
    retryAttempts: number,
  ): Promise<unknown> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const response = await firstValueFrom(
          this.http.request<unknown>(config),
        );
        return response.data;
      } catch (error) {
        lastError = error;
        if (error instanceof AxiosError && error.response) {
          throw this.toHttpException(error);
        }
        if (attempt === retryAttempts) {
          break;
        }
      }
    }
    throw this.toHttpException(lastError);
  }

  private toHttpException(error: unknown): HttpException {
    if (error instanceof AxiosError && error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        return new BadGatewayException('AI Orchestrator rejected the API key');
      }
      return new HttpException(
        (error.response.data ?? 'AI Orchestrator error') as object | string,
        status,
      );
    }
    return new ServiceUnavailableException('AI Orchestrator is unavailable');
  }
}
