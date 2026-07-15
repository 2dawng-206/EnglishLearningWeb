import { useEffect, useState } from 'react';
import { fetchWords } from '../../features/words/words-api';
import { startLearning } from '../../features/progress/progress-api';
import { SpeakerButton } from '../../components/common/SpeakerButton';
import { getErrorMessage } from '../../utils/get-error-message';
import type { Word, WordDifficulty } from '../../types/word';

const DIFFICULTY_OPTIONS: Array<{ label: string; value: WordDifficulty | '' }> = [
  { label: 'Any difficulty', value: '' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export function VocabularyPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<WordDifficulty | ''>('');
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedWordIds, setAddedWordIds] = useState<Set<number>>(new Set());
  const [pendingWordId, setPendingWordId] = useState<number | null>(null);

  useEffect(() => {
    const debounceId = setTimeout(() => {
      setIsLoading(true);
      setError(null);
      fetchWords({ search: search || undefined, difficulty: difficulty || undefined, limit: 20 })
        .then((page) => setWords(page.items))
        .catch((err) => setError(getErrorMessage(err, 'Could not load words.')))
        .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(debounceId);
  }, [search, difficulty]);

  async function handleAddToList(word: Word) {
    setPendingWordId(word.id);
    try {
      await startLearning(word.id);
      setAddedWordIds((current) => new Set(current).add(word.id));
    } catch (err) {
      setError(getErrorMessage(err, `Could not add "${word.word}".`));
    } finally {
      setPendingWordId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink-950">Vocabulary</h1>
        <p className="mt-1 font-body text-ink-700">
          Add words here — they'll show up on the Study page once they're due.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Search words…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="flex-1 rounded-lg border border-paper-300 px-3.5 py-2.5 font-body outline-none focus:border-amber-600"
        />
        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value as WordDifficulty | '')}
          className="rounded-lg border border-paper-300 px-3.5 py-2.5 font-body outline-none focus:border-amber-600"
        >
          {DIFFICULTY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="font-body text-sm text-red-600">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="font-body text-sm text-ink-700">Loading…</p>
      ) : words.length === 0 ? (
        <p className="font-body text-sm text-ink-700">No words match that search.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {words.map((word) => {
            const isAdded = addedWordIds.has(word.id);
            const firstDefinition = word.definitions[0];
            return (
              <li
                key={word.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-paper-300 bg-white px-5 py-4"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-semibold text-ink-950">
                      {word.word}
                    </span>
                    {word.phoneticUs && (
                      <span className="font-mono text-sm text-ink-700">/{word.phoneticUs}/</span>
                    )}
                    <SpeakerButton word={word} />
                  </div>
                  {firstDefinition && (
                    <p className="font-body text-sm text-ink-800">
                      <span className="italic text-ink-700">{firstDefinition.partOfSpeech}</span>{' '}
                      {firstDefinition.definition}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={isAdded || pendingWordId === word.id}
                  onClick={() => handleAddToList(word)}
                  className="shrink-0 rounded-lg border border-ink-600 px-4 py-2 font-body text-sm font-medium text-ink-800 transition-colors hover:bg-ink-950/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAdded ? '✓ Added' : pendingWordId === word.id ? 'Adding…' : 'Add to my list'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
