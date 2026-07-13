import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CefrLevel, WordDifficulty } from '../entities/word.entity';
import { PartOfSpeech } from '../entities/definition.entity';

export class CreateDefinitionDto {
  @IsEnum(PartOfSpeech)
  partOfSpeech: PartOfSpeech;

  @IsString()
  definition: string;

  @IsOptional()
  @IsString()
  example?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateWordDto {
  @IsString()
  @MaxLength(100)
  word: string;

  @IsOptional() @IsString() @MaxLength(100) phoneticUk?: string;
  @IsOptional() @IsString() @MaxLength(100) phoneticUs?: string;
  @IsOptional() @IsUrl() audioUrlUk?: string;
  @IsOptional() @IsUrl() audioUrlUs?: string;
  @IsOptional() @IsString() etymology?: string;
  @IsOptional() @IsString() mnemonic?: string;

  @IsOptional()
  @IsEnum(WordDifficulty)
  difficulty?: WordDifficulty;

  @IsOptional()
  @IsEnum(CefrLevel)
  cefrLevel?: CefrLevel;

  @IsOptional()
  @IsInt()
  @Min(1)
  frequencyRank?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDefinitionDto)
  definitions: CreateDefinitionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  synonyms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  antonyms?: string[];

  // Tag names — matched to existing tags.name, or created if not found.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
