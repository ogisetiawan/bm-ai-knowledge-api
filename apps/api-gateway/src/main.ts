// FILE: apps/api-gateway/src/main.ts
import { ValidationPipe } from '@nestjs/common';
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

  const nodeEnv = config.getOrThrow<string>('nodeEnv');
  const swaggerEnabled =
    nodeEnv !== 'production' || config.get<boolean>('swagger.enabled') === true;
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Knowledge Base API Gateway')
      .setDescription('API Gateway for Knowledge Base')
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
      .addServer('', 'Local')
      .addServer('/gateway', 'Public')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    });
  }

  const port = config.getOrThrow<number>('gateway.port');
  await app.listen(port);
  console.log(`Docs: http://localhost:${port}/api-docs`);
}

void bootstrap();
