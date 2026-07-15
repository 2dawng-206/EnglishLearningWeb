import { apiClient } from '../../services/api-client';
import type { PaginatedWords, Word, WordQuery } from '../../types/word';

export async function fetchWords(query: WordQuery = {}): Promise<PaginatedWords> {
  const { data } = await apiClient.get<PaginatedWords>('/words', { params: query });
  return data;
}

export async function fetchWord(id: number): Promise<Word> {
  const { data } = await apiClient.get<Word>(`/words/${id}`);
  return data;
}
