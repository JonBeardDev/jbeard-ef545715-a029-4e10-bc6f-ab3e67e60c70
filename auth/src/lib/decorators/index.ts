import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { IRequestUser, RoleType } from '@workspace/data';

// Custom decorator to get current user from request
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IRequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);

// Decorator to specify required roles
export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);

// Decorator to specify minimum role level
export const MIN_ROLE_LEVEL_KEY = 'minRoleLevel';
export const MinRoleLevel = (level: number) => SetMetadata(MIN_ROLE_LEVEL_KEY, level);

// Decorator to allow access to resource owner
export const ALLOW_RESOURCE_OWNER_KEY = 'allowResourceOwner';
export const AllowResourceOwner = () => SetMetadata(ALLOW_RESOURCE_OWNER_KEY, true);

// Decorator to specify if endpoint is public (no auth required)
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Decorator to skip audit logging
export const SKIP_AUDIT_KEY = 'skipAudit';
export const SkipAudit = () => SetMetadata(SKIP_AUDIT_KEY, true);