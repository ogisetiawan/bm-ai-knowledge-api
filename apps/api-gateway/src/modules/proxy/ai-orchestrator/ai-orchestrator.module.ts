// FILE: apps/api-gateway/src/modules/proxy/ai-orchestrator/ai-orchestrator.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiOrchestratorClient } from './ai-orchestrator.client';

@Module({
  imports: [HttpModule],
  providers: [AiOrchestratorClient],
  exports: [AiOrchestratorClient],
})
export class AiOrchestratorModule {}
