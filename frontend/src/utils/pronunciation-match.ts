/**
 * Loose match: lowercase, strip punctuation/whitespace at the edges. Speech
 * recognition often appends punctuation ("hello." for "hello") or returns
 * multi-word phrases for a single word, so exact equality is too strict —
 * this checks whether the target word appears as one of the transcribed
 * words, not just as an exact full-string match.
 */
export function isPronunciationMatch(transcript: string, targetWord: string): boolean {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z\s]/g, '').trim();

  const normalizedTarget = normalize(targetWord);
  const normalizedTranscript = normalize(transcript);

  if (!normalizedTranscript) return false;
  if (normalizedTranscript === normalizedTarget) return true;

  return normalizedTranscript.split(/\s+/).includes(normalizedTarget);
}
