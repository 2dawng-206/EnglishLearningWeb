import { apiClient } from "../../services/api-client";
import type { SubmitReviewPayload, UserProgress } from "../../types/progress";

export async function startLearning(wordId: number): Promise<UserProgress> {
  const { data } = await apiClient.post<UserProgress>("/progress", { wordId });
  return data;
}

export async function fetchDueCards(limit = 20): Promise<UserProgress[]> {
  const { data } = await apiClient.get<UserProgress[]>("/progress/due", {
    params: { limit },
  });
  return data;
}

export async function submitReview(
  wordId: number,
  payload: SubmitReviewPayload,
): Promise<UserProgress> {
  const { data } = await apiClient.post<UserProgress>(
    `/progress/${wordId}/review`,
    payload,
  );
  return data;
}
