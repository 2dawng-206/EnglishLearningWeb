import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/entities/user.entity';

export const ROLES_KEY = 'roles';

/** Usage: @Roles(UserRole.ADMIN) @UseGuards(RolesGuard) */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
