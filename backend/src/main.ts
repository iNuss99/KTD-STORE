import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as pg from 'pg';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Fix PostgreSQL timestamp without time zone (OID 1114) parsing:
// Database stores timestamps in UTC. Adding 'Z' ensures Node Date parses them as UTC instead of host local time.
pg.types.setTypeParser(1114, (str: string) => (str ? new Date(str + 'Z') : null));

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tăng giới hạn body size để hỗ trợ upload ảnh Base64 (nhiều ảnh)
  app.use(require('express').json({ limit: '50mb' }));
  app.use(require('express').urlencoded({ limit: '50mb', extended: true }));

  app.enableCors();
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

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  const logger = new Logger('Bootstrap');
  await app.listen(port);
  logger.log(`🚀 Server MenWear Hub backend đang chạy tại: http://localhost:${port}`);
}

bootstrap();
