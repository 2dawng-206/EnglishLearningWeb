# VocabMaster — Architecture & Folder Structure (Phase 0/1)

## Repo layout: 2 independent folders, not a monorepo tool

`frontend/` and `backend/` are two independent npm projects sharing one Git
repo and one devcontainer — no npm workspaces / Turborepo / Nx. For a
2-app student project that adds a layer of config for no real benefit yet.
Trivial to graduate to workspaces later if the two apps ever need to share
a types package.

```
vocabmaster/
├── .devcontainer/
│   ├── devcontainer.json
│   └── Dockerfile
├── backend/
│   └── .env.example
└── frontend/
    └── .env.example
```

## Backend (NestJS) — `backend/src`

Modules are split by bounded context, not by table. `words`, `definitions`,
`tags`, `word_synonyms`, `word_antonyms`, and the `word_tags` junction all
live inside one `words` module — they're all facets of "vocabulary content",
not separate domains yet. If tag administration grows its own CRUD/UI later,
splitting `tags` out is a 10-minute change.

```
backend/src/
├── main.ts                        # bootstrap: global ValidationPipe, /api prefix, CORS
├── app.module.ts
├── config/
│   └── typeorm.config.ts          # Aiven MySQL + SSL, synchronize: false
├── common/
│   ├── transformers/
│   │   └── decimal.transformer.ts # DECIMAL string -> number (ease_factor)
│   ├── decorators/
│   │   ├── public.decorator.ts    # @Public() — opt out of the global JWT guard
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts     # @Roles(UserRole.ADMIN)
│   ├── guards/
│   │   └── roles.guard.ts
│   ├── filters/                   # (Phase 3+ — global exception filter)
│   └── pipes/                     # (Phase 3+)
└── modules/
    ├── auth/                      # Phase 2 — JWT login/refresh/logout
    │   ├── dto/ (register, login, auth-tokens)
    │   ├── strategies/ (jwt, jwt-refresh)
    │   ├── guards/ (jwt-auth [global], jwt-refresh)
    │   ├── types/jwt-payload.type.ts
    │   ├── auth.service.ts
    │   ├── auth.controller.ts
    │   └── auth.module.ts
    ├── users/
    │   ├── entities/user.entity.ts
    │   ├── dto/update-user.dto.ts
    │   ├── users.service.ts
    │   ├── users.controller.ts
    │   └── users.module.ts
    ├── words/
    │   ├── entities/
    │   │   ├── word.entity.ts
    │   │   ├── definition.entity.ts
    │   │   ├── tag.entity.ts
    │   │   ├── word-tag.entity.ts
    │   │   ├── word-synonym.entity.ts
    │   │   └── word-antonym.entity.ts
    │   ├── dto/ (create-word, update-word, query-word)
    │   ├── words.service.ts
    │   ├── words.controller.ts
    │   └── words.module.ts
    ├── progress/
    │   ├── entities/
    │   │   ├── user-progress.entity.ts
    │   │   └── review-history.entity.ts
    │   ├── sm2/
    │   │   ├── sm2.service.ts         # pure SM-2 algorithm, zero DB deps
    │   │   └── sm2.service.spec.ts    # 20 unit tests
    │   ├── dto/ (start-learning, submit-review, update-progress-flags, due-cards-query)
    │   ├── progress.service.ts
    │   ├── progress.controller.ts
    │   └── progress.module.ts
    └── gamification/              # Phase 6 — reads stat_*/streak_* on User;
                                    # no dedicated table, so no entities of its own
```

## Frontend (React + Vite + TS) — `frontend/src`

Feature-folder structure so state/hooks/types for one domain (e.g. `words`)
stay together instead of being scattered across generic `components/` /
`store/` top-level folders.

```
frontend/src/
├── main.tsx
├── App.tsx
├── router/                # React Router config
├── components/
│   ├── common/             # Button, Modal, Input, etc.
│   ├── layout/              # Header, Sidebar, Footer
│   └── flashcard/           # flip-card, quiz widgets (Phase 5)
├── pages/
│   ├── auth/                # Login, Register
│   ├── dashboard/
│   ├── study/
│   └── vocabulary/
├── features/                # one folder per backend module: API hooks + state
│   ├── auth/
│   ├── words/
│   ├── progress/
│   └── gamification/
├── services/                 # axios instance, interceptors
├── types/                    # TS interfaces mirroring backend DTOs
└── utils/
```

## Notes while mapping the schema (nothing changed, just flagging)

- **`ease_factor DECIMAL(5,4)`** caps out at `9.9999`, but the column
  comment documents the SM-2 range as `[1.3, ∞)`. In practice a word would
  need an enormous number of consecutive "easy" reviews to approach that
  ceiling, so it's unlikely to bite — just something to keep in mind for the
  SM-2 service in Phase 3 (clamp or not).
- **`refresh_token` is a single `VARCHAR(512)` column**, not a per-device
  table — so logging in on a new device will invalidate sessions on others.
  Fine for this project's scope, just worth knowing going into Phase 2's auth
  design.
- **`is_email_verified`** sits inside the SQL comment block labelled "Auth
  tokens", but it's a plain status flag, not a secret — so unlike
  `refresh_token` / `password_reset_token` / `password_reset_expires`, it's
  **not** marked `select: false` on the entity.

## Phase 2 — Auth, Users, Words API

### Toolchain compatibility (found by actually running the build, not guessing)

- **`typescript` is pinned to `^6.0.3`, not the newest `7.0.2`.** Verified by
  installing both from the real npm registry: `@nestjs/cli@11.0.23`'s
  `nest build` throws `tsBinary.getParsedCommandLineOfConfigFile is not a
  function` under TypeScript 7.0.2 — its stable line hasn't caught up with
  TS7's compiler API changes yet. 6.0.3 builds cleanly (confirmed with a
  from-scratch `npm install` + `nest build`, 114 emitted files, then
  actually `require()`-loading the compiled `app.module.js`). If you
  upgrade `@nestjs/cli` later and it fixes this, TS7 should be safe to
  revisit — just don't assume it works without re-testing the build.
- **`ms.StringValue`**: `@nestjs/jwt`'s `expiresIn` option now types as
  `number | ms.StringValue` (a template-literal type), not a bare `string`,
  so a value read out of `ConfigService.get<string>()` needs an explicit
  `as StringValue` cast in `auth.service.ts`. `@types/ms` is an explicit
  devDependency for this rather than relying on it being hoisted in as a
  transitive dependency of `@types/jsonwebtoken`.
- **MySQL doesn't support `NULLS LAST`** (that's a Postgres/SQL-standard
  extension). TypeORM's `orderBy(col, dir, nulls)` third argument type-checks
  fine but just concatenates the literal string into the SQL with no
  per-dialect translation — passing it here would throw a MySQL syntax error
  at runtime, not compile time. `WordsService.findAll()` sorts by
  `frequencyRank ASC` without it; MySQL's default (NULLs first on ASC) means
  unranked words surface before ranked ones. Flagging as a known,
  low-priority simplification rather than shipping an unverified `CASE WHEN`
  workaround with no live DB to test it against.

### Auth design

- **Global `JwtAuthGuard`** (registered via `APP_GUARD` in `app.module.ts`)
  protects every route by default; `@Public()` opts specific routes out
  (register, login, refresh). Safer default than decorating protected routes
  one-by-one, where it's easy to forget one.
- **Refresh tokens are rotated and stored hashed.** Every login/register/
  refresh issues a new access+refresh pair; the refresh token's bcrypt hash
  (never the raw token) is written to `users.refresh_token`. `POST
  /auth/refresh` uses a *separate* Passport strategy/secret from access
  tokens, and `POST /auth/logout` clears the stored hash.
- **RBAC via the existing `role` column** — `@Roles(UserRole.ADMIN)` +
  `RolesGuard` gate word create/update/delete; reading words only requires
  being logged in (no admin check).
- **Transaction boundary bug avoided in `WordsService`**: `create()`/
  `update()` only pass the word's `id` out of `dataSource.transaction(...)`
  — the final relation-loaded read happens *after* the transaction commits,
  via the plain repository. Reading through `this.wordsRepository` from
  *inside* the callback would use a different connection than the one
  holding the uncommitted writes.
- **Nested arrays (`definitions`/`synonyms`/`antonyms`/`tags`) use
  replace-whole-collection semantics on update** — if the array key is
  present in a PATCH body at all, the existing rows are deleted and
  replaced, not diffed item-by-item. Simpler and more predictable; revisit
  if partial nested edits are ever needed.

### Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | Public | returns access+refresh tokens |
| POST | `/api/auth/login` | Public | |
| POST | `/api/auth/refresh` | Refresh token | rotates both tokens |
| POST | `/api/auth/logout` | Access token | clears stored refresh hash |
| GET | `/api/users/me` | Access token | |
| PATCH | `/api/users/me` | Access token | avatar + `setting_*` fields only |
| GET | `/api/words` | Access token | FULLTEXT search, difficulty/cefr/tag filters, pagination |
| GET | `/api/words/:id` | Access token | full relations (definitions, synonyms, antonyms, tags) |
| POST | `/api/words` | Admin | |
| PATCH | `/api/words/:id` | Admin | |
| DELETE | `/api/words/:id` | Admin | 409 if learner progress references it (RESTRICT FK) |

**Deferred (not built yet):** password-reset email flow (the DB columns
exist but there's no mail service to send the link yet — happy to stub this
in whenever it's actually needed), and diffing/merging nested word edits
instead of whole-collection replace.

## Phase 3 — SM-2 algorithm, ProgressService, review logging

### Toolchain note

Adding Jest surfaced one more real issue: `ts-jest` warns that `module:
nodenext` needs `isolatedModules: true` to compile correctly. Turning that
on then required splitting `RequestUser` (a type used inside
`@CurrentUser()`-decorated method parameters) into an explicit `import
type` in every controller that uses it — `isolatedModules` compiles each
file independently, so it can no longer infer from cross-file analysis
that `RequestUser` is type-only. Confirmed both the missing-fix (9 build
errors) and the fixed version (clean build + all 20 tests green) with a
from-scratch `npm install`.

### Design

- **`Sm2Service` has zero constructor dependencies** — no repository, no
  HTTP context. Tests instantiate it with a plain `new Sm2Service()`, no
  `Test.createTestingModule(...)` bootstrapping needed. That's what "service
  riêng, có unit test" bought us: the algorithm is cheap to test
  exhaustively because it can't reach a database by construction.
- **`status` derivation is NOT part of SM-2** — the classic algorithm has no
  concept of new/learning/reviewing/mastered, so that logic lives in
  `ProgressService.deriveStatus()`, not `Sm2Service`. A word that lapses
  after a long streak drops back to `learning`, never all the way to `new`
  (reserved for "never reviewed").
- **Ease factor is rounded to 4 decimal places** on every calculation, to
  match the `DECIMAL(5,4)` column exactly and stop tiny floating-point
  drift from accumulating silently across hundreds of reviews.
- **Ease factor is clamped at `9.9999`** (the column's physical ceiling) as
  well as the documented floor of `1.3` — see the Phase 1 note above about
  the schema comment saying `[1.3, ∞)`.
- **`startLearning()` is idempotent and race-safe** — a duplicate `(user_id,
  word_id)` insert (two rapid "add to my list" clicks) is caught via MySQL
  errno 1062 and just returns the existing row instead of erroring.
- **Same transaction-boundary discipline as `WordsService`**: `submitReview()`
  updates `user_progress` and inserts into `review_history` inside one
  transaction, then reads the final relation-loaded state back *after* it
  commits, via the plain repository.
- **XP/streak/`stat_*` updates are NOT wired in here** — those columns live
  on `users` and are explicitly Phase 6's job. `submitReview()` has a
  comment marking where that hook will go.

### Endpoints added

| Method | Path | Notes |
|---|---|---|
| POST | `/api/progress` | body `{ wordId }` — start learning a word, idempotent |
| GET | `/api/progress/due?limit=20` | cards due now, via `idx_due_cards` |
| GET | `/api/progress/:wordId` | progress for one word, with word+definitions loaded |
| POST | `/api/progress/:wordId/review` | body `{ quality, timeTakenMs?, sessionType? }` — runs SM-2, logs review_history |
| PATCH | `/api/progress/:wordId` | toggle `isFavorited`/`isIgnored` |

**Deferred:** the `GET /progress/due` query is a plain "what's overdue right
now" fetch — it does not yet compose a session using
`setting_new_words_per_day` / `setting_reviews_per_day` (mixing new vs. due
review cards to a daily budget). That's more of a study-session UX concern
for Phase 4/5 than core SM-2 mechanics.
