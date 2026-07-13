import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateProgressFlagsDto {
  @IsOptional()
  @IsBoolean()
  isFavorited?: boolean;

  @IsOptional()
  @IsBoolean()
  isIgnored?: boolean;
}
