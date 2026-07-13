import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { CefrLevel, WordDifficulty } from '../entities/word.entity';

export class QueryWordDto {
  // Uses the `ft_word` FULLTEXT index (MATCH...AGAINST) — see
  // WordsService.findAll(). Very short/common terms may return nothing due
  // to InnoDB's built-in min-token-length and stopword filtering.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(WordDifficulty)
  difficulty?: WordDifficulty;

  @IsOptional()
  @IsEnum(CefrLevel)
  cefrLevel?: CefrLevel;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
