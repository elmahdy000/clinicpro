import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

/**
 * Global HTTP exception filter.
 * - Catches ALL exceptions (HttpException + unexpected errors).
 * - Returns consistent JSON error shape.
 * - Never exposes stack traces or internal details in production.
 * - Logs 5xx errors with full context for debugging.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    let status  = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error   = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message ?? message;
        error   = resObj.error   ?? HttpStatus[status] ?? error;
      }
    } else if (exception instanceof Error) {
      // Unexpected error — log full details server-side, return generic message
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
      message = 'An unexpected error occurred. Please try again later.';
      error   = 'Internal Server Error';
    }

    // Log 5xx errors (server bugs) — 4xx are normal client errors, skip noisy logging
    if (status >= 500) {
      this.logger.error(
        `${status} ${request.method} ${request.url} — ${
          Array.isArray(message) ? message.join(', ') : message
        }`,
      );
    }

    const body: ErrorResponse = {
      statusCode: status,
      message,
      error,
      path:      request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }
}
