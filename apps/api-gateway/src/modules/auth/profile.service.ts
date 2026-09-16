// FILE: apps/api-gateway/src/modules/auth/profile.service.ts
import {
  BadGatewayException,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import {
  unwrapCoreProfile,
  UserData,
} from './interfaces/core-profile.interface';

const CORE_TIMEOUT_MS = 5000;

/**
 * Fetches the user profile from Core. Returns the RAW Core response —
 * mapping to AuthContext happens in AuthContextMapper.
 */
@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly baseUrl: string;
  private readonly isDev: boolean;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = config.getOrThrow<string>('core.baseUrl').replace(/\/+$/, '');
    this.isDev = config.get<string>('nodeEnv') !== 'production';
  }

  /** GET {CORE_BASE_URL}/auth/profile with the user's Bearer token. */
  async getProfile(userJwt: string): Promise<UserData> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<unknown>(`${this.baseUrl}/auth/profile`, {
          headers: { Authorization: `Bearer ${userJwt}` },
          timeout: CORE_TIMEOUT_MS,
        }),
      );

      // Dev-only shape confirmation (§7.3: no PII in logs — keys only).
      if (this.isDev) {
        this.logger.debug(
          `Core profile raw response keys: ${this.topLevelKeys(data)}`,
        );
      }

      const user = unwrapCoreProfile(data);
      if (!user) {
        throw new BadGatewayException(
          'Core profile response is missing user data',
        );
      }
      return user;
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  private topLevelKeys(data: unknown): string {
    return typeof data === 'object' && data !== null
      ? Object.keys(data).join(', ')
      : typeof data;
  }

  private toHttpException(error: unknown): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    if (error instanceof AxiosError && error.response) {
      if (error.response.status === 401) {
        return new UnauthorizedException('Core rejected the bearer token');
      }
      return new HttpException(
        'Core profile request failed',
        error.response.status,
      );
    }
    return new ServiceUnavailableException('Core service is unavailable');
  }
}
