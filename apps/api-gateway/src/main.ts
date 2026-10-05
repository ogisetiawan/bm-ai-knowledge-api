// FILE: apps/api-gateway/src/main.ts
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'api/docs*', method: RequestMethod.ALL }],
  });

  const nodeEnv = config.getOrThrow<string>('nodeEnv');
  const swaggerEnabled =
    nodeEnv !== 'production' || config.get<boolean>('swagger.enabled') === true;
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BM Knowledge Assistant - API Gateway')
      .setDescription('API Gateway for BM Knowledge Assistant ( BM Orchestrator & BM Web Core )')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:'Copy access token your web',
        },
        'bearer',
      )
      .addServer('/api/v1')
      .addServer('/api/v2')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      ignoreGlobalPrefix: true,
    });
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    });
  }

  const port = config.getOrThrow<number>('gateway.port');
  await app.listen(port);
  console.log(`Docs: http://localhost:${port}/api/docs`);
}

void bootstrap();
