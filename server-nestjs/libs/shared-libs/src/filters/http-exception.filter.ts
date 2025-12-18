import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = this.getErrorResponse(exception, status);

    console.error('Exception caught:', {
      path: request.url,
      method: request.method,
      status,
      error: errorResponse,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...errorResponse,
    });
  }

  private getErrorResponse(exception: unknown, status: number) {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'object' && 'message' in response) {
        return {
          message: (response as any).message,
          error: (response as any).error || 'Error',
        };
      }

      if (typeof response === 'string') {
        return {
          message: response,
          error: 'Error',
        };
      }

      return response;
    }

    return {
      message: exception instanceof Error ? exception.message : 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
