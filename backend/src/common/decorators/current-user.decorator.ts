import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  userId: number;
  email?: string;
  role?: string;
  refreshToken?: string;
}

/**
 * Usage: getMe(@CurrentUser() user: RequestUser)
 * Populated by JwtStrategy.validate() / JwtRefreshStrategy.validate() — see
 * modules/auth/strategies.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
