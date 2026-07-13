import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { SessionType } from '../entities/review-history.entity';

export class SubmitReviewDto {
  // SM-2 quality of recall — matches review_history's chk_quality CHECK (0–5).
  @IsInt()
  @Min(0)
  @Max(5)
  quality: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeTakenMs?: number;

  @IsOptional()
  @IsEnum(SessionType)
  sessionType?: SessionType;
}
