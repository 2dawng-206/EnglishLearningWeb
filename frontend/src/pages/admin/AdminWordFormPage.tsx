import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchWord } from "../../features/words/words-api";
import { createWord, updateWord } from "../../features/words/words-admin-api";
import { getErrorMessage } from "../../utils/get-error-message";
import type { CefrLevel, WordDifficulty } from "../../types/word";
import type {
  PartOfSpeech,
  WordDefinitionInput,
  WordFormPayload,
} from "../../features/words/word-admin-types";

const DIFFICULTY_OPTIONS: WordDifficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
];
const CEFR_OPTIONS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const PART_OF_SPEECH_OPTIONS: PartOfSpeech[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "pronoun",
  "interjection",
  "phrase",
  "other",
];

function emptyDefinition(): WordDefinitionInput {
  return { partOfSpeech: "noun", definition: "", example: "", imageUrl: "" };
}

const inputClasses =
  "w-full rounded-lg border border-paper-300 px-3.5 py-2.5 font-body outline-none focus:border-amber-600";
const labelClasses = "font-body text-sm font-medium text-ink-800";

export function AdminWordFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [word, setWord] = useState("");
  const [phoneticUk, setPhoneticUk] = useState("");
  const [phoneticUs, setPhoneticUs] = useState("");
  const [audioUrlUk, setAudioUrlUk] = useState("");
  const [audioUrlUs, setAudioUrlUs] = useState("");
  const [etymology, setEtymology] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [difficulty, setDifficulty] = useState<WordDifficulty>("intermediate");
  const [cefrLevel, setCefrLevel] = useState<CefrLevel | "">("");
  const [frequencyRank, setFrequencyRank] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [definitions, setDefinitions] = useState<WordDefinitionInput[]>([
    emptyDefinition(),
  ]);

  // Comma-separated text inputs. Left blank on edit — see the note above
  // WordFormPayload: the backend replaces the whole collection on PATCH,
  // so these are only sent if the admin actually types something in.
  const [synonymsText, setSynonymsText] = useState("");
  const [antonymsText, setAntonymsText] = useState("");
  const [tagsText, setTagsText] = useState("");

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    setError(null);
    fetchWord(Number(id))
      .then((existing) => {
        setWord(existing.word);
        setPhoneticUk(existing.phoneticUk ?? "");
        setPhoneticUs(existing.phoneticUs ?? "");
        setAudioUrlUk(existing.audioUrlUk ?? "");
        setAudioUrlUs(existing.audioUrlUs ?? "");
        setEtymology(existing.etymology ?? "");
        setMnemonic(existing.mnemonic ?? "");
        setDifficulty(existing.difficulty);
        setCefrLevel(existing.cefrLevel ?? "");
        setFrequencyRank(
          existing.frequencyRank != null ? String(existing.frequencyRank) : "",
        );
        setIsPublished(existing.isPublished);
        setDefinitions(
          existing.definitions.length > 0
            ? existing.definitions
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((definition) => ({
                  partOfSpeech: definition.partOfSpeech,
                  definition: definition.definition,
                  example: definition.example ?? "",
                  imageUrl: definition.imageUrl ?? "",
                }))
            : [emptyDefinition()],
        );
      })
      .catch((err) =>
        setError(getErrorMessage(err, "Could not load this word.")),
      )
      .finally(() => setIsLoading(false));
  }, [id]);

  function updateDefinition(
    index: number,
    patch: Partial<WordDefinitionInput>,
  ) {
    setDefinitions((current) =>
      current.map((definition, i) =>
        i === index ? { ...definition, ...patch } : definition,
      ),
    );
  }

  function addDefinition() {
    setDefinitions((current) => [...current, emptyDefinition()]);
  }

  function removeDefinition(index: number) {
    setDefinitions((current) => current.filter((_, i) => i !== index));
  }

  function parseCommaList(text: string): string[] {
    return text
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!word.trim()) {
      setError("Word is required.");
      return;
    }
    if (
      definitions.length === 0 ||
      definitions.some((d) => !d.definition.trim())
    ) {
      setError(
        "Every definition needs at least the definition text, and there must be at least one.",
      );
      return;
    }

    const basePayload: WordFormPayload = {
      word: word.trim(),
      phoneticUk: phoneticUk.trim() || undefined,
      phoneticUs: phoneticUs.trim() || undefined,
      audioUrlUk: audioUrlUk.trim() || undefined,
      audioUrlUs: audioUrlUs.trim() || undefined,
      etymology: etymology.trim() || undefined,
      mnemonic: mnemonic.trim() || undefined,
      difficulty,
      cefrLevel: cefrLevel || undefined,
      frequencyRank: frequencyRank ? Number(frequencyRank) : undefined,
      isPublished,
      definitions: definitions.map((definition, index) => ({
        partOfSpeech: definition.partOfSpeech,
        definition: definition.definition.trim(),
        example: definition.example?.trim() || undefined,
        imageUrl: definition.imageUrl?.trim() || undefined,
        sortOrder: index,
      })),
    };

    // Only attach these if the admin actually typed something — an empty
    // array here would wipe an existing word's synonyms/antonyms/tags on
    // PATCH (see the WordFormPayload comment).
    const synonyms = parseCommaList(synonymsText);
    const antonyms = parseCommaList(antonymsText);
    const tags = parseCommaList(tagsText);
    if (synonyms.length > 0) basePayload.synonyms = synonyms;
    if (antonyms.length > 0) basePayload.antonyms = antonyms;
    if (tags.length > 0) basePayload.tags = tags;

    setIsSaving(true);
    try {
      if (isEditing && id) {
        await updateWord(Number(id), basePayload);
      } else {
        await createWord(basePayload);
      }
      navigate("/admin/words");
    } catch (err) {
      setError(getErrorMessage(err, "Could not save this word."));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="font-body text-sm text-ink-700">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink-950">
          {isEditing ? `Edit "${word}"` : "Add a new word"}
        </h1>
        <p className="mt-1 font-body text-ink-700">
          {isEditing
            ? "Update the details below, then save your changes."
            : "Fill in the word details and at least one definition."}
        </p>
      </div>

      {error && (
        <p role="alert" className="font-body text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Word *</span>
            <input
              value={word}
              onChange={(event) => setWord(event.target.value)}
              className={inputClasses}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Difficulty</span>
            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as WordDifficulty)
              }
              className={inputClasses}
            >
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>CEFR level</span>
            <select
              value={cefrLevel}
              onChange={(event) =>
                setCefrLevel(event.target.value as CefrLevel | "")
              }
              className={inputClasses}
            >
              <option value="">—</option>
              {CEFR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Frequency rank</span>
            <input
              type="number"
              min={1}
              value={frequencyRank}
              onChange={(event) => setFrequencyRank(event.target.value)}
              className={inputClasses}
              placeholder="e.g. 250 (1 = most common)"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Phonetic (UK)</span>
            <input
              value={phoneticUk}
              onChange={(event) => setPhoneticUk(event.target.value)}
              className={inputClasses}
              placeholder="e.g. həˈloʊ"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Phonetic (US)</span>
            <input
              value={phoneticUs}
              onChange={(event) => setPhoneticUs(event.target.value)}
              className={inputClasses}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Audio URL (UK)</span>
            <input
              value={audioUrlUk}
              onChange={(event) => setAudioUrlUk(event.target.value)}
              className={inputClasses}
              placeholder="https://…"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Audio URL (US)</span>
            <input
              value={audioUrlUs}
              onChange={(event) => setAudioUrlUs(event.target.value)}
              className={inputClasses}
              placeholder="https://…"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClasses}>Etymology</span>
          <textarea
            value={etymology}
            onChange={(event) => setEtymology(event.target.value)}
            className={inputClasses}
            rows={2}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClasses}>Mnemonic</span>
          <textarea
            value={mnemonic}
            onChange={(event) => setMnemonic(event.target.value)}
            className={inputClasses}
            rows={2}
          />
        </label>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-body text-sm font-medium text-ink-950">
              Definitions *
            </span>
            <button
              type="button"
              onClick={addDefinition}
              className="rounded-lg border border-ink-600 px-3 py-1.5 font-body text-sm font-medium text-ink-800 transition-colors hover:bg-ink-950/5"
            >
              + Add definition
            </button>
          </div>

          {definitions.map((definition, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-xl border border-paper-300 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <label className="flex w-40 flex-col gap-1.5">
                  <span className={labelClasses}>Part of speech</span>
                  <select
                    value={definition.partOfSpeech}
                    onChange={(event) =>
                      updateDefinition(index, {
                        partOfSpeech: event.target.value as PartOfSpeech,
                      })
                    }
                    className={inputClasses}
                  >
                    {PART_OF_SPEECH_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                {definitions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDefinition(index)}
                    className="mt-6 rounded-lg border border-red-600 px-3 py-1.5 font-body text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>

              <label className="flex flex-col gap-1.5">
                <span className={labelClasses}>Definition *</span>
                <textarea
                  value={definition.definition}
                  onChange={(event) =>
                    updateDefinition(index, { definition: event.target.value })
                  }
                  className={inputClasses}
                  rows={2}
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className={labelClasses}>Example</span>
                <input
                  value={definition.example}
                  onChange={(event) =>
                    updateDefinition(index, { example: event.target.value })
                  }
                  className={inputClasses}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className={labelClasses}>Image URL</span>
                <input
                  value={definition.imageUrl}
                  onChange={(event) =>
                    updateDefinition(index, { imageUrl: event.target.value })
                  }
                  className={inputClasses}
                  placeholder="https://…"
                />
              </label>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>
              Synonyms{isEditing ? " (leave blank to keep existing)" : ""}
            </span>
            <input
              value={synonymsText}
              onChange={(event) => setSynonymsText(event.target.value)}
              className={inputClasses}
              placeholder="comma, separated"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>
              Antonyms{isEditing ? " (leave blank to keep existing)" : ""}
            </span>
            <input
              value={antonymsText}
              onChange={(event) => setAntonymsText(event.target.value)}
              className={inputClasses}
              placeholder="comma, separated"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>
              Tags{isEditing ? " (leave blank to keep existing)" : ""}
            </span>
            <input
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
              className={inputClasses}
              placeholder="comma, separated"
            />
          </label>
        </div>

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
            className="h-4 w-4 rounded border-paper-300"
          />
          <span className="font-body text-sm text-ink-800">
            Published (visible to learners)
          </span>
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-amber-600 px-4 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving…" : isEditing ? "Save changes" : "Create word"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/words")}
            className="rounded-lg border border-ink-600 px-4 py-2.5 font-body text-sm font-medium text-ink-800 transition-colors hover:bg-ink-950/5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
