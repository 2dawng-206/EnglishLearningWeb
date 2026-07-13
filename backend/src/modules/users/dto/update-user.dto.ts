import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PreferredDifficulty, UserTheme } from '../entities/user.entity';

// Deliberately excludes username/email/password — those need their own
// flows (uniqueness re-check, re-verification) and aren't part of a plain
// profile/settings update.
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  settingDailyGoal?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  settingNewWordsPerDay?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  settingReviewsPerDay?: number;

  @IsOptional()
  @IsBoolean()
  settingNotificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  settingSoundEnabled?: boolean;

  @IsOptional()
  @IsEnum(UserTheme)
  settingTheme?: UserTheme;

  @IsOptional()
  @IsEnum(PreferredDifficulty)
  settingPreferredDifficulty?: PreferredDifficulty;
}
