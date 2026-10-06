// FILE: apps/api-gateway/src/modules/auth/session.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { SessionResponseDto } from './dto/session.response';
import { CoreBearerGuard } from './guards/core-bearer.guard';
import { SessionMapper } from './mappers/session.mapper';
import { SessionService } from './session.service';

/**
 * One call for the signed-in client: trimmed Core profile plus menus
 * and menu-permissions `data`.
 */
@ApiTags('Sessions')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing or invalid Core bearer token' })
@Controller('sessions')
@UseGuards(CoreBearerGuard)
export class SessionController {
  constructor(private readonly session: SessionService) {}

  @Get()
  @ApiOperation({
    summary: 'Load the signed-in session',
    description:
      'Calls Core GET /auth/profile, GET /auth/menus, and GET /auth/menupermissions with the caller Bearer token. Profile is reduced to auth_user_applications (first application_code), auth_user_roles (first role_name), user_id, and employee. Menus and menu permissions are the Core response data property.',
  })
  @ApiOkResponse({ type: SessionResponseDto })
  async getSession(@Req() req: Request): Promise<SessionResponseDto> {
    const sources = await this.session.load(req);
    return SessionMapper.toResponse(sources);
  }
}
