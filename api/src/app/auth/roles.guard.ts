import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, MIN_ROLE_LEVEL_KEY } from '@workspace/auth';
import { RoleType, IRequestUser } from '@workspace/data';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Get minimum role level from decorator
    const minRoleLevel = this.reflector.getAllAndOverride<number>(MIN_ROLE_LEVEL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or level specified, allow access
    if (!requiredRoles && !minRoleLevel) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: IRequestUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check specific roles
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(user.roleName);
      if (!hasRole) {
        throw new ForbiddenException(
          `Access denied. Required roles: ${requiredRoles.join(', ')}`
        );
      }
    }

    // Check minimum role level
    if (minRoleLevel !== undefined && minRoleLevel !== null) {
      if (user.roleLevel < minRoleLevel) {
        throw new ForbiddenException(
          `Access denied. Insufficient role level. Required: ${minRoleLevel}, Current: ${user.roleLevel}`
        );
      }
    }

    return true;
  }
}