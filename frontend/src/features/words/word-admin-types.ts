// Client-side mirror of backend/src/modules/words/dto/create-word.dto.ts.
// Kept separate from types/word.ts (which is public-read only) since these
// shapes are only ever used on the admin create/edit form.

import type { CefrLevel, WordDifficulty } from "../../types/word";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "preposition"
  | "conjunction"
  | "pronoun"
  | "interjection"
  | "phrase"
  | "other";

export interface WordDefinitionInput {
  partOfSpeech: PartOfSpeech;
  definition: string;
  example?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export interface WordFormPayload {
  word: string;
  phoneticUk?: string;
  phoneticUs?: string;
  audioUrlUk?: string;
  audioUrlUs?: string;
  etymology?: string;
  mnemonic?: string;
  difficulty?: WordDifficulty;
  cefrLevel?: CefrLevel;
  frequencyRank?: number;
  isPublished?: boolean;
  definitions: WordDefinitionInput[];
  // NOTE: UpdateWordDto is a PartialType of CreateWordDto, and the backend
  // *replaces* the entire synonyms/antonyms/tags collection whenever the
  // key is present in the PATCH body — it does not diff/merge. Only include
  // these keys in an update payload if the user actually edited that field;
  // sending an empty array would wipe existing data. See AdminWordFormPage.
  synonyms?: string[];
  antonyms?: string[];
  tags?: string[];
}
