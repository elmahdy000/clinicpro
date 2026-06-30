import { Injectable, CanActivate, ExecutionContext, SetMetadata, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Marker to explicitly allow any authenticated user (bypass role check) */
export const IS_PUBLIC_FOR_AUTH = 'isPublicForAuth';
export const AllowAllRoles = () => SetMetadata(IS_PUBLIC_FOR_AUTH, true);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // Check if endpoint is explicitly marked as open to all authenticated users
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_FOR_AUTH, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no @Roles() decorator is present, deny by default (safe by default)
    if (!requiredRoles || requiredRoles.length === 0) {
      throw new ForbiddenException('Access denied: no roles defined for this endpoint');
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Access denied: no authenticated user');

    return requiredRoles.includes(user.role as UserRole);
  }
}
