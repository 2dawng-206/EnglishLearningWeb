import { IsInt, Min } from 'class-validator';

export class SessionCompleteDto {
  @IsInt()
  @Min(0)
  durationMs: number;
}
