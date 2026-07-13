import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as exempt from the global JwtAuthGuard (register/login, etc).
 * Everything else requires a valid access token by default — safer than
 * opting routes IN one by one, where it's easy to forget one.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
