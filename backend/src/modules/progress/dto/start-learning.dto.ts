import { IsInt, Min } from 'class-validator';

export class StartLearningDto {
  @IsInt()
  @Min(1)
  wordId: number;
}
