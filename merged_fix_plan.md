# Merged Fix Plan (Codex + Claude + Gemini)

Generated: 2026-02-19

This file merges and deduplicates findings from:
- `codex_fix_plan.md`
- `claude_fix_plan.md`
- `gemini_fix_plan.md`

It prioritizes immediate correctness, data integrity, and security first, then UX/accessibility, then structural refactors.

## Priority Legend

- `P0` Blocker: data loss/corruption, critical security, or major broken behavior.
- `P1` High: user-visible correctness and reliability issues.
- `P2` Medium: maintainability, accessibility, and quality improvements.
- `P3` Long-term: larger architectural refactors.

## Clarifications Applied During Merge

1. API keys are not currently read from `localStorage`; they are stored in the app database settings (`src/services/search.ts`, `src/services/database.ts`). This is still client-side storage and should be treated as sensitive.
2. Making synchronous DB functions return `Promise<T>` alone does not remove main-thread blocking. A worker/off-thread DB architecture is required for real responsiveness gains.

## Execution Order

1. Finish all `P0` items.
2. Finish `P1` items needed for stable UX and predictable behavior.
3. Batch `P2` quality and accessibility work.
4. Schedule `P3` refactors only after test baseline is in place.

## Consolidated Backlog

### MFP-001: Upgrade vulnerable PDF dependencies (`P0`)
- Problem: `npm audit --omit=dev` reports critical/high vulnerabilities in `jspdf` and `jspdf-autotable`.
- Files: `package.json`, `package-lock.json`
- Actions:
1. Upgrade `jspdf` and `jspdf-autotable` to patched major versions.
2. Re-test report/PDF generation behavior and output format.
3. Document any API changes in report generation code.
- Acceptance:
1. `npm audit --omit=dev` has no critical/high issues from this stack.
2. PDF export still works for representative report data.
- Sources: Codex, Claude

### MFP-002: Preserve reminder links during JSON import (`P0`)
- Problem: imported items receive new IDs while reminders keep old `item_id`, producing orphan reminders.
- Files: `src/services/storage.ts`, `src/services/database.ts`
- Actions:
1. Build `oldItemId -> newItemId` map during item import.
2. Rewrite `reminder.item_id` using that map before insert.
3. Skip/flag reminders referencing missing items.
- Acceptance:
1. Imported reminders always point to existing imported items.
2. No orphan reminders after import.
- Sources: Codex

### MFP-003: Fix reminder date boundary and overdue/upcoming split (`P0`)
- Problem: reminder date handling is time-zone/time-of-day fragile and upcoming query includes overdue reminders.
- Files: `src/services/database.ts`, `src/utils/index.ts`, `src/hooks/useDatabase.ts`, `src/pages/Reminders.tsx`
- Actions:
1. Normalize date-only comparisons to local start-of-day.
2. Add lower bound in upcoming query (`>= today/now`) plus upper bound.
3. Use dedicated query for overdue instead of deriving from upcoming.
- Acceptance:
1. A reminder due today is not incorrectly marked overdue.
2. Upcoming list excludes overdue reminders.
3. Overdue and upcoming counts are mutually consistent.
- Sources: Codex

### MFP-004: Correct settings serialization/hydration/application (`P0`)
- Problem: settings are stringified generically; booleans/numbers can round-trip incorrectly, and settings page initializes before async-like load path completes.
- Files: `src/services/database.ts`, `src/hooks/useDatabase.ts`, `src/pages/Settings.tsx`, `src/pages/ItemsList.tsx`
- Actions:
1. Add type-aware parse/serialize for each `AppSettings` key.
2. Rehydrate `Settings` form state from loaded settings via `useEffect`.
3. Actually apply saved settings (`defaultView`, `itemsPerPage`, `searchMode`, notification settings) in runtime behavior.
- Acceptance:
1. `notificationsEnabled=false` persists and reloads as `false`.
2. `itemsPerPage`, `defaultView`, `searchMode` affect UI behavior after save/reload.
3. Settings page always reflects current persisted values.
- Sources: Codex, Claude

### MFP-005: Align Ollama auth behavior with UI (`P0`)
- Problem: LLM search throws on missing API key even when provider is `ollama` and UI says key is not required.
- Files: `src/services/search.ts`, `src/pages/Settings.tsx`
- Actions:
1. Require API key only for providers that need it.
2. Keep Ollama path keyless by default.
3. Improve provider-specific error messages.
- Acceptance:
1. Ollama search works without configured API key.
2. OpenAI/Anthropic still fail fast with clear key error when missing.
- Sources: Codex

### MFP-006: Harden JSON parsing across app (`P0`)
- Problem: several `JSON.parse` calls can throw and break flows on malformed data.
- Files: `src/services/database.ts`, `src/services/search.ts`, `src/services/storage.ts`
- Actions:
1. Introduce safe parse helpers with defaults.
2. Wrap external-input parse points in guarded parsing.
3. Surface parse errors to users where relevant (import/search).
- Acceptance:
1. Malformed JSON in import/API/DB row does not crash the page.
2. User receives actionable error feedback.
- Sources: Codex, Claude

### MFP-007: Robust DB initialization and WASM loading (`P0`)
- Problem: DB init relies on CDN-hosted sql.js wasm and failure handling leaves app in a weak state.
- Files: `src/services/database.ts`, `src/App.tsx`
- Actions:
1. Bundle and load local sql.js wasm asset (offline-friendly).
2. Add explicit `initError` state and retry action in app bootstrap.
3. Block entry into main app routes when DB init fails.
- Acceptance:
1. App shows clear recovery UI when DB init fails.
2. User can retry initialization without reloading.
3. DB initializes without requiring external CDN availability.
- Sources: Codex, Claude

### MFP-008: Fix pagination behavior and page-size wiring (`P1`)
- Problem: list view renders full `filteredItems` instead of paginated slice; page size is hardcoded and not settings-driven.
- Files: `src/pages/ItemsList.tsx`
- Actions:
1. Render paginated slice in both grid and list views.
2. Drive page size from saved settings.
3. Ensure select-all behavior is scoped correctly to desired set (page vs filtered set) and documented.
- Acceptance:
1. Grid/list views show identical item counts per page.
2. Changing items-per-page in settings changes pagination behavior.
- Sources: Codex, Gemini

### MFP-009: Prevent LLM search race/stale-result overwrite (`P1`)
- Problem: overlapping async searches and normal filter effects can overwrite each other.
- Files: `src/pages/ItemsList.tsx`
- Actions:
1. Add request token/versioning or cancellation (AbortController).
2. Split normal and LLM result state paths cleanly.
3. Display search failure state instead of silent catch.
- Acceptance:
1. Fast repeated queries show only latest response.
2. Switching search modes does not display stale results.
- Sources: Codex, Claude

### MFP-010: Unify header/page search state (`P1`)
- Problem: search state is duplicated across `Layout` and `ItemsList`; outlet context is not consumed coherently.
- Files: `src/components/Layout.tsx`, `src/pages/ItemsList.tsx`
- Actions:
1. Centralize search state via outlet context or dedicated store/context.
2. Remove duplicate disconnected search controls or connect them consistently.
3. Replace `refresh: () => window.location.reload()` with non-destructive state refresh.
- Acceptance:
1. Header search and Items page search always stay in sync.
2. No full-page reload needed for normal refresh paths.
- Sources: Codex, Claude, Gemini

### MFP-011: Add loading/error states and user-visible failures (`P1`)
- Problem: hooks and services often swallow/log errors with no user feedback.
- Files: `src/hooks/useDatabase.ts`, `src/services/storage.ts`, `src/pages/ItemsList.tsx`, `src/App.tsx`
- Actions:
1. Add `isLoading` and `error` to data hooks where applicable.
2. Show inline/toast errors for search/import/export/save failures.
3. Keep console logging, but do not rely on it for user messaging.
- Acceptance:
1. Every async failure path presents user-visible feedback.
2. Loading indicators appear for expensive operations.
- Sources: Claude

### MFP-012: Replace blocking browser dialogs and improve validation (`P1`)
- Problem: `window.alert`/`window.confirm` create blocking/inconsistent UX; form validation is shallow.
- Files: `src/pages/ItemsList.tsx`, `src/pages/ItemForm.tsx`, `src/pages/Categories.tsx`, `src/pages/Reminders.tsx`
- Actions:
1. Create reusable confirm modal and toast/snackbar system.
2. Expand item form validation (numeric bounds, required combos, field-level messages).
3. Remove blocking alerts/confirms from normal flows.
- Acceptance:
1. No `window.alert`/`window.confirm` in primary app paths.
2. Validation errors render inline and are actionable.
- Sources: Claude

### MFP-013: Parameterize SQL query interpolation points (`P1`)
- Problem: some queries interpolate values directly into SQL strings.
- Files: `src/services/database.ts`
- Actions:
1. Convert interpolated SQL in pagination, counts, and reminder queries to parameterized statements.
2. Validate numeric inputs (`limit`, `pageSize`, `offset`) before binding.
- Acceptance:
1. No template literal interpolation for runtime SQL values.
2. Existing query outputs remain unchanged for valid inputs.
- Sources: Claude

### MFP-014: Accessibility and keyboard-navigation baseline (`P2`)
- Problem: missing dialog semantics, icon labels, focus trap, and Escape handling.
- Files: multiple page/components and modal overlays
- Actions:
1. Add `role="dialog"`, `aria-modal`, label wiring for modals.
2. Add `aria-label` on icon-only buttons and `aria-live` for dynamic status areas.
3. Add Escape close and focus trap behavior for dialogs.
- Acceptance:
1. Keyboard-only user can fully navigate dialogs.
2. Screen readers announce key controls and status changes.
- Sources: Claude

### MFP-015: Fix nullish/zero-value rendering logic (`P2`)
- Problem: `0` values are hidden by truthy checks (`|| ''`, conditional rendering).
- Files: `src/pages/ItemForm.tsx`, `src/pages/ItemsList.tsx`
- Actions:
1. Replace truthy checks with nullish checks (`??`, explicit comparisons).
2. Audit numeric render paths for `0` handling.
- Acceptance:
1. `0` values display and persist correctly.
- Sources: Codex

### MFP-016: Fix invalid CSS selectors for `2xl` utilities (`P2`)
- Problem: `.2xl:*` selectors are invalid and trigger build warnings.
- Files: `src/components/styles.css`
- Actions:
1. Escape leading digit selectors correctly or rename utility prefix.
2. Re-run build to confirm warning removal.
- Acceptance:
1. `npm run build` completes without these CSS syntax warnings.
- Sources: Codex

### MFP-017: Generate QR codes locally (`P2`)
- Problem: QR generation uses third-party API, exposing item payload and breaking offline behavior.
- Files: `src/pages/ItemForm.tsx`
- Actions:
1. Replace remote QR image URL with local generation via `react-qr-code`.
2. Ensure visual parity and printable/exportable output.
- Acceptance:
1. QR renders with no network call to external QR service.
2. Works while offline.
- Sources: Codex

### MFP-018: Add lint/test scripts and baseline tests (`P2`)
- Problem: no lint/test scripts and no automated test coverage.
- Files: `package.json`, test files to add under `src/`
- Actions:
1. Add `lint`, `test`, `test:watch` scripts.
2. Add initial unit tests for database/storage/utils logic.
3. Gate risky refactors behind passing test baseline.
- Acceptance:
1. CI-ready scripts exist and pass locally.
2. Core data flows have at least smoke-level test coverage.
- Sources: Codex, Claude, Gemini

### MFP-019: Normalize database import strategy (`P2`)
- Problem: mixed dynamic and static imports for `database.ts` create bundling warnings/confusion.
- Files: `src/App.tsx`, `src/services/storage.ts`, and consumers
- Actions:
1. Choose consistent import strategy (static is preferred for startup-critical module).
2. Remove duplicate/contradictory import patterns.
- Acceptance:
1. Vite warning about mixed import style is gone.
- Sources: Claude

### MFP-020: Tighten TypeScript and remove unsafe casts (`P2`)
- Problem: `as any` and disabled `noUnused*` checks reduce type safety.
- Files: `tsconfig.json`, `src/pages/Settings.tsx`, `src/pages/Reports.tsx`, `src/services/database.ts`
- Actions:
1. Replace `as any` with typed unions/guards.
2. Enable `noUnusedLocals` and `noUnusedParameters`, then fix fallout.
3. Remove risky double-cast usage where possible.
- Acceptance:
1. Type checks pass with stricter settings.
2. No unnecessary `as any` remains in core paths.
- Sources: Claude

### MFP-021: Fix minor resilience/documentation gaps (`P2`)
- Problem: minor fallbacks and onboarding docs are incomplete.
- Files: `src/pages/Reports.tsx`, `README.md` or `.env.example`
- Actions:
1. Keep/finalize fallback behavior for chart colors and icon mappings.
2. Add setup/config documentation (including LLM provider expectations).
- Acceptance:
1. New contributor can run project from docs without guesswork.
- Sources: Claude

### MFP-022: Refactor database module boundaries (`P3`)
- Problem: `src/services/database.ts` is monolithic and hard to evolve safely.
- Files: `src/services/database.ts`, new `src/services/db/*`
- Actions:
1. Split into `core`, `items`, `categories`, `reminders`, `settings`, `stats`.
2. Keep stable facade while migrating call sites incrementally.
3. Add regression tests before and during split.
- Acceptance:
1. Functional parity maintained.
2. File/module boundaries align with domain responsibilities.
- Sources: Claude, Gemini

### MFP-023: Rework image storage strategy (`P3`)
- Problem: base64 photos in SQLite inflate payload and memory usage.
- Files: `src/pages/ItemForm.tsx`, DB schema/service layer
- Actions:
1. Store images in IndexedDB/object storage with UUID references in SQLite.
2. Provide migration path for existing base64-stored images.
- Acceptance:
1. Item query payload size drops materially for image-heavy datasets.
2. Existing user photos remain accessible after migration.
- Sources: Claude

### MFP-024: Component/state architecture cleanup (`P3`)
- Problem: large components and mixed refresh patterns increase defect risk.
- Files: `src/pages/ItemsList.tsx`, `src/pages/ItemForm.tsx`, hooks/state layer
- Actions:
1. Extract focused presentational components.
2. Standardize mutation + refresh flow (context/store-driven).
3. If scaling demands it, move DB operations into a worker for non-blocking UX.
- Acceptance:
1. Reduced component complexity and clearer data flow.
2. No regression in current behavior.
- Sources: Gemini, Claude

## Suggested Milestones

- Milestone A (stability/security): `MFP-001` through `MFP-007`
- Milestone B (core UX correctness): `MFP-008` through `MFP-013`
- Milestone C (quality): `MFP-014` through `MFP-021`
- Milestone D (refactor track): `MFP-022` through `MFP-024`

