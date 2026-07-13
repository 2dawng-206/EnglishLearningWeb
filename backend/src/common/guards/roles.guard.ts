import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';

/**
 * Runs AFTER the global JwtAuthGuard (which populates request.user) — this
 * guard only checks role, it does not itself verify the token. Always pair
 * with @Roles(...) on the route; without that metadata it allows everyone
 * through (fail-open by design, since routes with no @Roles() aren't meant
 * to be role-restricted at all).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    const allowed = !!user && requiredRoles.includes(user.role);
    if (!allowed) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
    return true;
  }
}
