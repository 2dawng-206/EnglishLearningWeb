import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { SessionCompleteDto } from './dto/session-complete.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('session-complete')
  recordSessionComplete(@CurrentUser() user: RequestUser, @Body() dto: SessionCompleteDto) {
    return this.gamificationService.recordSessionComplete(user.userId, dto.durationMs);
  }

  @Get('weekly-activity')
  getWeeklyActivity(@CurrentUser() user: RequestUser) {
    return this.gamificationService.getWeeklyActivity(user.userId);
  }
}
