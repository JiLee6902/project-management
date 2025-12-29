import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = this.getErrorResponse(exception, status);

    // Only log server errors (5xx) with full details
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${errorResponse.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400 && status !== 404) {
      // Log client errors (4xx) except 404 - brief log
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${errorResponse.message}`,
      );
    }
    // Skip logging 404 errors to reduce noise

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...errorResponse,
    });
  }

  private getErrorResponse(exception: unknown, status: number): { message: string; error: string } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'object' && response !== null && 'message' in response) {
        return {
          message: String((response as any).message),
          error: (response as any).error || 'Error',
        };
      }

      if (typeof response === 'string') {
        return {
          message: response,
          error: 'Error',
        };
      }

      return {
        message: 'An error occurred',
        error: 'Error',
      };
    }

    return {
      message: exception instanceof Error ? exception.message : 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
