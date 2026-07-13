import { PartialType } from '@nestjs/mapped-types';
import { CreateWordDto } from './create-word.dto';

// NOTE: if `definitions`/`synonyms`/`antonyms`/`tags` are included in a
// PATCH body, WordsService replaces the *entire* existing collection rather
// than diffing/merging individual items — see WordsService.update() comment.
export class UpdateWordDto extends PartialType(CreateWordDto) {}
