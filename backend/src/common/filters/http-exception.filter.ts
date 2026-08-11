import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let errorName = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        message = body.message || body;
        errorName = body.error || exception.name;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`[UnhandledException] ${exception.message}`, exception.stack);
      message = process.env.NODE_ENV === 'production' 
        ? 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.' 
        : exception.message;
      errorName = exception.name;
    }

    // Structured JSON response format
    const errorResponse = {
      statusCode: status,
      error: errorName,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    if (status >= 500) {
      this.logger.error(`HTTP ${status} on ${request.method} ${request.url}: ${JSON.stringify(message)}`);
      // Hook point for Sentry / APM if DSN is configured
      if (process.env.SENTRY_DSN) {
        // Capture exception via Sentry SDK when installed
      }
    } else if (status === 429) {
      this.logger.warn(`Rate limit exceeded on ${request.method} ${request.url} from IP: ${request.ip}`);
    }

    response.status(status).json(errorResponse);
  }
}
