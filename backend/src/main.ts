import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as pg from 'pg';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Fix PostgreSQL timestamp without time zone (OID 1114) parsing:
// Database stores timestamps in UTC. Adding 'Z' ensures Node Date parses them as UTC instead of host local time.
pg.types.setTypeParser(1114, (str: string) => (str ? new Date(str + 'Z') : null));

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // [HIGH-2] Security headers via Helmet
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to be served cross-origin
  }));

  // Body size limit — reasonable cap, images should use presigned URL upload
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  // [HIGH-1] CORS — whitelist specific origins, not wildcard
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  const allowedOrigins = frontendUrl
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin "${origin}" not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  // Task T1.5: Register global exception filter for structured errors & logging
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = configService.get<number>('PORT', 3000);

  const logger = new Logger('Bootstrap');
  await app.listen(port);
  logger.log(`🚀 Server MenWear Hub backend đang chạy tại: http://localhost:${port}`);
  logger.log(`🔒 CORS allowed origins: ${allowedOrigins.join(', ')}`);
}

bootstrap();

