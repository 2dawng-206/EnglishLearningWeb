import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { StartLearningDto } from './dto/start-learning.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { UpdateProgressFlagsDto } from './dto/update-progress-flags.dto';
import { DueCardsQueryDto } from './dto/due-cards-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post()
  startLearning(@CurrentUser() user: RequestUser, @Body() dto: StartLearningDto) {
    return this.progressService.startLearning(user.userId, dto.wordId);
  }

  // IMPORTANT: this must come before @Get(':wordId') below — Nest/Express
  // match routes in declaration order, so 'due' would otherwise be captured
  // by :wordId and fail ParseIntPipe with "due" as the value.
  @Get('due')
  getDueCards(@CurrentUser() user: RequestUser, @Query() query: DueCardsQueryDto) {
    return this.progressService.findDueCards(user.userId, query.limit ?? 20);
  }

  @Get(':wordId')
  getOne(@CurrentUser() user: RequestUser, @Param('wordId', ParseIntPipe) wordId: number) {
    return this.progressService.getOne(user.userId, wordId);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':wordId/review')
  submitReview(
    @CurrentUser() user: RequestUser,
    @Param('wordId', ParseIntPipe) wordId: number,
    @Body() dto: SubmitReviewDto,
  ) {
    return this.progressService.submitReview(user.userId, wordId, dto);
  }

  @Patch(':wordId')
  updateFlags(
    @CurrentUser() user: RequestUser,
    @Param('wordId', ParseIntPipe) wordId: number,
    @Body() dto: UpdateProgressFlagsDto,
  ) {
    return this.progressService.setFlags(user.userId, wordId, dto);
  }
}
