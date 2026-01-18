import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { POLICY_KEY, PolicyCheck, PolicyType } from '../decorators/check-policy.decorator';

export const POLICY_SERVICE = 'POLICY_SERVICE';

export interface IPolicyService {
  evaluatePolicy(
    userId: string,
    policyType: PolicyType,
    context: PolicyContext,
  ): Promise<boolean>;
}

export interface PolicyContext {
  resourceId?: string;
  workspaceId?: string;
  projectId?: string;
  resourceType?: string;
}

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(POLICY_SERVICE)
    private policyService: IPolicyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policies = this.reflector.getAllAndOverride<PolicyCheck[]>(POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No policies defined, allow access
    if (!policies || policies.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied: User not authenticated');
    }

    // Evaluate all policies - ALL must pass
    for (const policy of policies) {
      const policyContext: PolicyContext = {
        resourceId: this.extractParam(request, policy.resourceIdParam),
        workspaceId: this.extractParam(request, policy.workspaceIdParam),
        projectId: this.extractParam(request, policy.projectIdParam),
      };

      const passed = await this.policyService.evaluatePolicy(
        user.id,
        policy.type,
        policyContext,
      );

      if (!passed) {
        throw new ForbiddenException(
          `Access denied: Policy check failed (${policy.type})`,
        );
      }
    }

    return true;
  }

  private extractParam(request: any, paramName?: string): string | undefined {
    if (!paramName) return undefined;

    // Check params (URL parameters)
    if (request.params?.[paramName]) {
      return request.params[paramName];
    }

    // Check body
    if (request.body?.[paramName]) {
      return request.body[paramName];
    }

    // Check query
    if (request.query?.[paramName]) {
      return request.query[paramName];
    }

    return undefined;
  }
}
