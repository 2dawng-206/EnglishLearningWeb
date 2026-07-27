import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWords } from '../../features/words/words-api';
import { deleteWord } from '../../features/words/words-admin-api';
import { getErrorMessage } from '../../utils/get-error-message';
import type { Word, WordDifficulty } from '../../types/word';

const DIFFICULTY_OPTIONS: Array<{ label: string; value: WordDifficulty | '' }> = [
  { label: 'Any difficulty', value: '' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const PAGE_SIZE = 20;

export function AdminWordsPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<WordDifficulty | ''>('');
  const [page, setPage] = useState(1);
  const [words, setWords] = useState<Word[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // Any change to the filters should reset back to page 1.
  useEffect(() => {
    setPage(1);
  }, [search, difficulty]);

  useEffect(() => {
    const debounceId = setTimeout(() => {
      setIsLoading(true);
      setError(null);
      fetchWords({
        search: search || undefined,
        difficulty: difficulty || undefined,
        page,
        limit: PAGE_SIZE,
      })
        .then((result) => {
          setWords(result.items);
          setTotalPages(result.totalPages);
        })
        .catch((err) => setError(getErrorMessage(err, 'Could not load words.')))
        .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(debounceId);
  }, [search, difficulty, page]);

  async function handleDelete(word: Word) {
    if (!window.confirm(`Delete "${word.word}"? This can't be undone.`)) return;

    setPendingDeleteId(word.id);
    try {
      await deleteWord(word.id);
      setWords((current) => current.filter((item) => item.id !== word.id));
    } catch (err) {
      setError(getErrorMessage(err, `Could not delete "${word.word}".`));
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-950">Manage vocabulary</h1>
          <p className="mt-1 font-body text-ink-700">
            Create, edit, and remove words from the vocabulary bank.
          </p>
        </div>
        <Link
          to="/admin/words/new"
          className="shrink-0 rounded-lg bg-amber-600 px-4 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          + Add word
        </Link>
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
        <div className="overflow-hidden rounded-xl border border-paper-300 bg-white">
          <table className="w-full text-left font-body text-sm">
            <thead>
              <tr className="border-b border-paper-300 text-ink-700">
                <th className="px-5 py-3 font-medium">Word</th>
                <th className="px-5 py-3 font-medium">Difficulty</th>
                <th className="px-5 py-3 font-medium">CEFR</th>
                <th className="px-5 py-3 font-medium">Definitions</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {words.map((word) => (
                <tr key={word.id} className="border-b border-paper-300 last:border-0">
                  <td className="px-5 py-3 font-medium text-ink-950">{word.word}</td>
                  <td className="px-5 py-3 capitalize text-ink-800">{word.difficulty}</td>
                  <td className="px-5 py-3 text-ink-800">{word.cefrLevel ?? '—'}</td>
                  <td className="px-5 py-3 text-ink-800">{word.definitions.length}</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        word.isPublished
                          ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800'
                          : 'rounded-full bg-paper-200 px-2.5 py-1 text-xs font-medium text-ink-700'
                      }
                    >
                      {word.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/words/${word.id}/edit`}
                        className="rounded-lg border border-ink-600 px-3 py-1.5 font-medium text-ink-800 transition-colors hover:bg-ink-950/5"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={pendingDeleteId === word.id}
                        onClick={() => handleDelete(word)}
                        className="rounded-lg border border-red-600 px-3 py-1.5 font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingDeleteId === word.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border border-ink-600 px-3 py-1.5 font-body text-sm font-medium text-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="font-body text-sm text-ink-700">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-ink-600 px-3 py-1.5 font-body text-sm font-medium text-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}