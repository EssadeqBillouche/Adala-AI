import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/Interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Parse cookies for HTTP-only cookie auth
  app.use(cookieParser());

  // Security headers (X-Content-Type-Options, HSTS, X-Frame-Options, etc.)
  app.use(helmet());

  // CORS — restrict to allowed origins
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger/OpenAPI Documentation
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Adala AI API')
      .setDescription('Legal AI SaaS API - Multi-tenant platform for legal intelligence with credit-based billing')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & Registration')
      .addTag('projects', 'Project Management')
      .addTag('conversations', 'Conversation Management')
      .addTag('messages', 'Message Management')
      .addTag('legal-sources', 'Legal Source Management')
      .addTag('credit-ledger', 'Credit Ledger & Billing')
      .addTag('subscription', 'Subscription Management')
      .addTag('api-keys', 'API Key Management')
      .addTag('audit-logs', 'Audit Logs')
      .addTag('invitations', 'User Invitations')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      deepScanRoutes: true,
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    });
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Global filters & pipes
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(configService.get<number>('PORT') ?? 4000);
}
bootstrap();

