# Codex Fix Plan

This file tracks all problems identified in the project review and what needs fixing.

## Critical

1. **JSON import breaks reminder-to-item links**
   - Problem: Imported items get new IDs, but reminders keep old `item_id`, creating orphan reminders.
   - Files:
     - `src/services/storage.ts` (`importFromJSON`)
     - `src/services/database.ts` (`createItem`)
   - Fix:
     - Build an old-id -> new-id map during item import.
     - Rewrite reminder `item_id` values through that map before inserting reminders.

2. **Production dependencies have known vulnerabilities (`jspdf`, `jspdf-autotable`)**
   - Problem: `npm audit --omit=dev` reports critical/high advisories in the PDF stack.
   - Files:
     - `package.json`
     - `package-lock.json`
   - Fix:
     - Upgrade to patched major versions.
     - Re-test report/PDF generation behavior after upgrade.

## High

3. **Category rename causes data inconsistency**
   - Problem: Category names are stored on items as plain text; renaming a category does not update existing items.
   - Files:
     - `src/services/database.ts` (`updateCategory`)
     - `src/pages/Categories.tsx`
   - Fix:
     - On category rename, migrate matching `items.category`.
     - Longer-term: store `category_id` on items instead of category name.

4. **Boolean settings round-trip incorrectly**
   - Problem: Settings are saved as strings; booleans load as truthy strings (`"false"` becomes true-like in UI logic).
   - Files:
     - `src/services/database.ts` (`getSettings`, `saveSettings`)
     - `src/pages/Settings.tsx`
   - Fix:
     - Parse booleans explicitly in `getSettings`.
     - Serialize/deserialize settings with type-aware logic (or JSON payload by key).

5. **Ollama mode incorrectly requires API key**
   - Problem: Search service throws if API key missing even when provider is `ollama` (UI says not required).
   - Files:
     - `src/services/search.ts`
     - `src/pages/Settings.tsx`
   - Fix:
     - Skip API key requirement for `ollama`.
     - Keep key validation only for providers that require it.

6. **Reminder date calculations are timezone/time-of-day fragile**
   - Problem: Date-only values can be marked overdue incorrectly due to `Date` parsing/time boundaries.
   - Files:
     - `src/utils/index.ts` (`getDaysUntil`, `isOverdue`)
     - `src/pages/Reminders.tsx`
   - Fix:
     - Compare normalized local dates (start-of-day) for date-only reminders.
     - Use consistent date parsing strategy (`YYYY-MM-DD` handling).

7. **Upcoming reminders query includes overdue reminders**
   - Problem: SQL only checks `due_date <= futureDate`; no lower bound for now/today.
   - Files:
     - `src/services/database.ts` (`getUpcomingReminders`)
     - `src/hooks/useDatabase.ts`
   - Fix:
     - Add lower bound (>= now or >= start-of-today).
     - Keep overdue and upcoming datasets distinct.

8. **DB initialization relies on external CDN and weak fallback**
   - Problem: `sql.js` wasm is loaded from remote URL; failures can leave app in bad state while UI still allows continue.
   - Files:
     - `src/services/database.ts` (`initDatabase`, `loadDatabaseFromFile`)
     - `src/App.tsx`
   - Fix:
     - Bundle/load local wasm asset.
     - Prevent entering main app when DB init fails; show recoverable error state.

## Medium

9. **LLM search race conditions and filter conflicts**
   - Problem: Async LLM results can arrive out of order; normal filter effect can overwrite LLM results.
   - Files:
     - `src/pages/ItemsList.tsx`
   - Fix:
     - Track request tokens/abort stale requests.
     - Split/sequence filter logic for normal vs LLM modes clearly.

10. **Pagination is broken in list view**
   - Problem: List view renders `filteredItems` instead of paged slice.
   - Files:
     - `src/pages/ItemsList.tsx`
   - Fix:
     - Render `paginatedItems` in list view table body.

11. **Settings form does not hydrate after async settings load**
   - Problem: `formData` initializes before `useSettings` has loaded DB values.
   - Files:
     - `src/pages/Settings.tsx`
     - `src/hooks/useDatabase.ts`
   - Fix:
     - Sync `formData` from `settings` via `useEffect` when settings change.

12. **Saved settings are not actually applied to feature behavior**
   - Problem: `defaultView`, `itemsPerPage`, and `searchMode` persist but are not wired into runtime behavior.
   - Files:
     - `src/pages/Settings.tsx`
     - `src/pages/ItemsList.tsx`
     - `src/services/database.ts`
   - Fix:
     - Read these settings in page logic and use them as defaults/controls.

13. **Header search is disconnected from pages**
   - Problem: `Layout` provides search in `Outlet` context, but pages do not consume it.
   - Files:
     - `src/components/Layout.tsx`
     - `src/pages/ItemsList.tsx` (or shared search state layer)
   - Fix:
     - Consume `useOutletContext` in target pages, or remove duplicate search UI and centralize search state.

14. **Unsafe JSON parsing from DB rows can crash rendering**
   - Problem: `JSON.parse` on stored `tags/photos/custom_fields` has no fallback on malformed data.
   - Files:
     - `src/services/database.ts` (`rowToItem`)
   - Fix:
     - Add safe parse helper with defaults and error handling.

15. **Zero values mishandled by truthy checks**
   - Problem: `0` values appear blank or hidden due to `|| ''` and truthy conditions.
   - Files:
     - `src/pages/ItemForm.tsx`
     - `src/pages/ItemsList.tsx`
   - Fix:
     - Use nullish checks (`??`) and explicit `value !== null` conditions.

## Low

16. **Invalid CSS selectors for `2xl` utility classes**
   - Problem: `.2xl\:...` selectors are invalid and cause build minify warnings.
   - Files:
     - `src/components/styles.css`
   - Fix:
     - Escape leading digit correctly (e.g. `.\\32xl\\:grid-cols-4`) or rename utility prefix.

17. **QR code generation depends on third-party API**
   - Problem: Leaks item payload externally and fails offline.
   - Files:
     - `src/pages/ItemForm.tsx`
   - Fix:
     - Generate QR locally (existing `react-qr-code` dependency can be used).

18. **No lint/test scripts in package workflows**
   - Problem: No standard commands for linting and automated tests, increasing regression risk.
   - Files:
     - `package.json`
   - Fix:
     - Add `lint`, `test`, and (optionally) `test:watch` scripts.
     - Introduce initial test coverage for core data flows.

