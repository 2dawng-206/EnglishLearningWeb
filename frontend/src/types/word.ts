// Mirrors backend/src/modules/words/entities/*.ts (public-read shape only —
// admin-only fields like `source` aren't needed client-side yet).

export type WordDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'pronoun'
  | 'interjection'
  | 'phrase'
  | 'other';

export interface Definition {
  id: number;
  wordId: number;
  partOfSpeech: PartOfSpeech;
  definition: string;
  example: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface Word {
  id: number;
  word: string;
  phoneticUk: string | null;
  phoneticUs: string | null;
  audioUrlUk: string | null;
  audioUrlUs: string | null;
  etymology: string | null;
  mnemonic: string | null;
  difficulty: WordDifficulty;
  cefrLevel: CefrLevel | null;
  frequencyRank: number | null;
  isPublished: boolean;
  definitions: Definition[];
}

export interface PaginatedWords {
  items: Word[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WordQuery {
  search?: string;
  difficulty?: WordDifficulty;
  cefrLevel?: CefrLevel;
  tag?: string;
  page?: number;
  limit?: number;
}
