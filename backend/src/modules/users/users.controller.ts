import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: RequestUser) {
    const found = await this.usersService.findById(user.userId);
    if (!found) throw new NotFoundException('User not found');
    return found;
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: RequestUser, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.updateProfile(user.userId, dto);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  // 204 No Content - khong co gi de tra ve, va tranh vo tinh gui lai password
  // hash trong response body.
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('me/password')
  async changePassword(@CurrentUser() user: RequestUser, @Body() dto: ChangePasswordDto) {
    await this.usersService.changePassword(user.userId, dto);
  }
}
