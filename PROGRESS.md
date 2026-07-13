# VocabMaster — Progress Log

Last updated: 2026-07-10 (Phase 3 complete)

## Status

- [x] **Phase 0** — Devcontainer, folder structure proposal
- [x] **Phase 1** — TypeORM entities for all 9 tables, Aiven MySQL config
- [x] **Phase 2** — Auth (JWT), Users, Words (CRUD + FULLTEXT search)
- [x] **Phase 3** — SM-2 algorithm service (20 unit tests, all passing),
      ProgressService/Controller, review_history logging
- [ ] **Phase 4** — Frontend: React UI layout + auth flow
- [ ] **Phase 5** — Web Speech API (TTS/STT) + flashcard/quiz mini-games
- [ ] **Phase 6** — Gamification (XP/streak) + dashboard charts

## Running in GitHub Codespaces

The devcontainer works identically in Codespaces and local VS Code — no
Codespaces-specific config needed beyond what's already in
`.devcontainer/`. Steps:

1. Push this repo to GitHub (needs `.gitignore` at the root — see below —
   so `.env`, `node_modules/`, and `backend/certs/` never get committed).
2. On the repo page: **Code → Codespaces → Create codespace on main.**
   GitHub reads `.devcontainer/devcontainer.json` automatically and builds
   the same Node 24 + MySQL-client image used locally.
3. `postCreateCommand` auto-runs `npm install` in `backend/` once the
   container is up — first boot takes a bit longer for that.
4. Inside the Codespace terminal: `cd backend && cp .env.example .env`,
   fill in real Aiven credentials + JWT secrets.
5. `mkdir -p certs` and paste the Aiven CA cert into `certs/aiven-ca.pem`.
6. `npm run start:dev` — Codespaces auto-forwards port 3000 (already
   declared in `forwardPorts`); a toast notification offers to open it, or
   check the **Ports** tab.
7. *(Optional, saves re-typing `.env` on every new codespace)*: add
   `DB_HOST`, `DB_PASSWORD`, `JWT_ACCESS_SECRET`, etc. as **Codespaces
   secrets** (repo/org Settings → Secrets and variables → Codespaces).
   They land as real `process.env` vars in the container, and
   `@nestjs/config`'s `ConfigService` reads those directly even with no
   `.env` file present — so this step alone can replace step 4 entirely.
   The CA cert is still a file, though, so step 5 still applies either way.

## Quick start (resuming this project on a machine)

1. Open `vocabmaster/` in VS Code → "Reopen in Container".
2. `cd backend && npm install`
3. Copy `backend/.env.example` → `backend/.env`, fill in real Aiven MySQL
   credentials + JWT secrets.
4. Download the CA certificate from the Aiven console into
   `backend/certs/aiven-ca.pem` (path referenced by `DB_SSL_CA_PATH`).
5. Make sure the SQL schema script has been run against the Aiven database
   (it's the source of truth — nothing here auto-creates it; `synchronize`
   is deliberately `false`).
6. `npm run start:dev`
7. `npm test` — runs the 20 Sm2Service unit tests (Jest + ts-jest)
8. Frontend is **not scaffolded yet** — only `frontend/.env.example` exists
   so far. Scaffolding it (`npm create vite@latest`) is part of Phase 4.

## Pinned/gotcha versions — don't casually bump without re-testing

All of these were found by actually installing from the npm registry and
running the real build, not recalled from memory:

- **`typescript`: pinned `^6.0.3`, not 7.x.** `@nestjs/cli@11.0.23`'s
  `nest build` throws `tsBinary.getParsedCommandLineOfConfigFile is not a
  function` under TypeScript 7.0.2. Confirmed both ways with a clean
  install. Revisit only after re-testing `nest build` against whatever
  `@nestjs/cli` version is current then.
- **`typeorm`: `^1.0.0`.** TypeORM is past 1.0 now — most existing
  tutorials/AI-generated snippets still assume 0.3.x APIs; don't trust
  those without checking against what's actually installed.
- **Node: 24** (current Active LTS as of mid-2026) — already pinned in the
  devcontainer's Dockerfile.
- `expiresIn` in `@nestjs/jwt` needs an `ms.StringValue` cast, not a bare
  `string` — see `auth.service.ts`.
- MySQL doesn't support `NULLS LAST` — don't add it to any `orderBy()`
  call against this DB; see `WordsService.findAll()`.
- `isolatedModules: true` (needed for `ts-jest` under `module: nodenext`)
  means any type used *only* as a type inside a `@CurrentUser()`-decorated
  parameter must be imported via `import type`, not a regular named import
  — see `RequestUser` in any controller for the pattern.

## Key design decisions so far

- 2 independent folders (`frontend/`, `backend/`), no monorepo tooling —
  deliberate simplicity call for a 2-app student project.
- `synchronize: false` always — schema is hand-authored SQL, never auto-synced.
- Global `JwtAuthGuard` (deny-by-default) + `@Public()` opt-out per route,
  rather than opt-in guards scattered around.
- Refresh tokens: rotated on every login/refresh, stored as a bcrypt hash only.
- Admin-gated word mutations via the existing `role` column + `RolesGuard`.
- `word_tags` modeled as an explicit junction entity (not an implicit
  `@ManyToMany`) to preserve the extra `idx_wt_tag_id` index.
- `ease_factor DECIMAL(5,4)` needs a transformer — mysql2 returns DECIMAL
  columns as strings.
- `next_review_date` / `added_at` are deliberately **not**
  `@UpdateDateColumn`/`@CreateDateColumn` — the schema has no `ON UPDATE`
  on them, and using those decorators would silently corrupt the SM-2 schedule.

## Deferred / not built yet

- Password-reset email flow (DB columns exist, no mail service wired up).
- Diff/merge semantics for nested word edits on `PATCH /words/:id` — currently
  whole-collection replace.
- Frontend scaffolding.

## How to resume in a new conversation

Attach the zip (or just this file) and say something like "continuing
VocabMaster, see attached PROGRESS.md — let's do Phase 3." That should be
enough for a fresh conversation to pick up with full context, without
needing to re-read the whole prior thread.
