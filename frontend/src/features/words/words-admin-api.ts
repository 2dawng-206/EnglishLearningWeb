import { apiClient } from '../../services/api-client';
import type { Word } from '../../types/word';
import type { WordFormPayload } from './word-admin-types';

export async function createWord(payload: WordFormPayload): Promise<Word> {
  const { data } = await apiClient.post<Word>('/words', payload);
  return data;
}

export async function updateWord(id: number, payload: Partial<WordFormPayload>): Promise<Word> {
  const { data } = await apiClient.patch<Word>(`/words/${id}`, payload);
  return data;
}

export async function deleteWord(id: number): Promise<void> {
  await apiClient.delete(`/words/${id}`);
}