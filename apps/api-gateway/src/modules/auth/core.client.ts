// FILE: apps/api-gateway/src/modules/auth/core.client.ts
import {
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import { CoreLoginResponse } from './interfaces/core-login.interface';

const CORE_TIMEOUT_MS = 5000;
const CORE_RETRY_ATTEMPTS = 3;

/**
 * Thin HTTP client for the Core (WEB Core) API.
 * Encapsulates Core endpoint paths + `app_code` injection and returns RAW
 * Core responses — mapping to DTOs happens in mappers, never here.
 */
@Injectable()
export class CoreClient {
  private readonly logger = new Logger(CoreClient.name);
  private readonly baseUrl: string;
  private readonly appCode: string;
  private readonly isDev: boolean;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = config.getOrThrow<string>('core.baseUrl').replace(/\/+$/, '');
    this.appCode = config.getOrThrow<string>('core.appCode');
    this.isDev = config.get<string>('nodeEnv') !== 'production';
  }

  /** POST {CORE_BASE_URL}/auth/login — returns the raw Core response. */
  async login(dto: LoginDto): Promise<CoreLoginResponse> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<CoreLoginResponse>(
          `${this.baseUrl}/auth/login`,
          { email: dto.email, password: dto.password, app_code: this.appCode },
          { timeout: CORE_TIMEOUT_MS },
        ),
      );

      // Dev-only shape confirmation. Token redacted — never log secrets/PII (§7.3).
      if (this.isDev) {
        this.logger.debug(
          `Core login raw response: ${JSON.stringify({ ...data, access_token: '[redacted]' })}`,
        );
      }

      return data;
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  /** GET {CORE_BASE_URL}/auth/menus — raw Core body. */
  fetchMenus(userJwt: string): Promise<unknown> {
    return this.fetchAuthorized('/auth/menus', userJwt);
  }

  /** GET {CORE_BASE_URL}/auth/menupermissions — raw Core body. */
  fetchMenuPermissions(userJwt: string): Promise<unknown> {
    return this.fetchAuthorized('/auth/menupermissions', userJwt);
  }

  private async fetchAuthorized(path: string, userJwt: string): Promise<unknown> {
    try {
      const data = await this.request({
        method: 'GET',
        url: `${this.baseUrl}${path}`,
        headers: { Authorization: `Bearer ${userJwt}` },
        timeout: CORE_TIMEOUT_MS,
      });

      if (this.isDev) {
        this.logger.debug(`Core ${path} response keys: ${this.topLevelKeys(data)}`);
      }

      return data;
    } catch (error) {
      throw this.toResourceException(error);
    }
  }

  /**
   * Network failures retry up to 3 times. An HTTP response from Core is final.
   */
  private async request(config: AxiosRequestConfig): Promise<unknown> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= CORE_RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await firstValueFrom(this.http.request<unknown>(config));
        return response.data;
      } catch (error) {
        lastError = error;
        if (error instanceof AxiosError && error.response) {
          throw error;
        }
        if (attempt === CORE_RETRY_ATTEMPTS) {
          break;
        }
      }
    }
    throw lastError;
  }

  private topLevelKeys(data: unknown): string {
    return typeof data === 'object' && data !== null
      ? Object.keys(data).join(', ')
      : typeof data;
  }

  private toResourceException(error: unknown): HttpException {
    if (error instanceof AxiosError && error.response) {
      if (error.response.status === 401) {
        return new UnauthorizedException('Core rejected the bearer token');
      }
      return new HttpException('Core request failed', error.response.status);
    }
    return new ServiceUnavailableException('Core service is unavailable');
  }

  private toHttpException(error: unknown): HttpException {
    if (error instanceof AxiosError && error.response) {
      // Upstream answered (e.g. 401 invalid credentials) — propagate its status.
      return new HttpException('Core authentication failed', error.response.status);
    }
    // Network failure / timeout / unexpected error.
    return new ServiceUnavailableException('Core service is unavailable');
  }
}
