import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom ThrottlerGuard để xử lý requests từ proxy
 * Lấy IP thực từ X-Forwarded-For header thay vì connection IP
 */
@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    if (realIp) {
      return realIp;
    }

    // Fallback to connection IP
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  /**
   * Override để cho phép skip throttling cho một số routes
   * hoặc customize behavior dựa trên context
   */
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    // Có thể thêm logic skip cho internal requests, health checks, etc.
    const request = context.switchToHttp().getRequest();
    const path = request.path;

    // Skip throttling cho health check endpoints
    if (path === '/api/health' || path === '/health') {
      return true;
    }

    return false;
  }
}
