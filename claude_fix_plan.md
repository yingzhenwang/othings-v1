# StuffManager — Issues Report

Generated: 2026-02-19

---

## Project Overview

**Type**: Personal Inventory Management Web Application (PWA)
**Stack**: React 18.2.0 · TypeScript 5.3.3 · Vite 5.1.0 · sql.js 1.10.0 (SQLite in-browser)
**Key dependencies**: React Router DOM 6.22.0, lucide-react, recharts, date-fns, uuid, react-qr-code, html5-qrcode, jspdf, jspdf-autotable, vite-plugin-pwa

---

## Issue Index

| # | Severity | Title | File(s) |
|---|----------|-------|---------|
| 1 | 🔴 HIGH | SQL injection via template literals | `services/database.ts` |
| 2 | 🔴 HIGH | API credentials stored in localStorage | `services/search.ts` |
| 3 | 🟠 MEDIUM | Dangerous `as any` type assertions | Multiple |
| 4 | 🟠 MEDIUM | Silent catch blocks — no user feedback on failure | `pages/ItemsList.tsx` |
| 5 | 🟠 MEDIUM | `window.confirm()` / `window.alert()` used for UI | Multiple |
| 6 | 🟠 MEDIUM | Full page reload on settings save | `pages/Settings.tsx` |
| 7 | 🟠 MEDIUM | `JSON.parse` called without try-catch | Multiple |
| 8 | 🟠 MEDIUM | No loading or error states in custom hooks | `hooks/useDatabase.ts` |
| 9 | 🟠 MEDIUM | Database init failure leaves app in broken state | `App.tsx` |
| 10 | 🟠 MEDIUM | Incomplete form input validation | `pages/ItemForm.tsx` |
| 11 | 🟠 MEDIUM | Search state duplicated across components | `Layout.tsx`, `pages/ItemsList.tsx` |
| 12 | 🟠 MEDIUM | Missing ARIA labels and semantic HTML | Multiple |
| 13 | 🟠 MEDIUM | Incomplete keyboard navigation | Multiple |
| 14 | 🟠 MEDIUM | No tests of any kind | — |
| 15 | 🟡 LOW | `debounce` utility has no cancel/cleanup method | `utils/index.ts` |
| 16 | 🟡 LOW | Mixed static and dynamic imports of `database.ts` | `App.tsx`, `services/storage.ts` |
| 17 | 🟡 LOW | Monolithic 626-line database service | `services/database.ts` |
| 18 | 🟡 LOW | Base64 images stored directly in SQLite | `pages/ItemForm.tsx` |
| 19 | 🟡 LOW | File system errors only logged, not shown to user | `services/storage.ts` |
| 20 | 🟡 LOW | TypeScript strict checks partially disabled | `tsconfig.json` |
| 21 | 🟡 LOW | Inconsistent state update patterns across hooks | Multiple |
| 22 | 🟡 LOW | Icon/color rendering without fallbacks in some places | `pages/Reports.tsx` |
| 23 | 🟡 LOW | No `.env.example` file | — |

---

## Detailed Findings

---

### 1. 🔴 SQL Injection via Template Literals
**File**: `src/services/database.ts` — lines 567, 590, 608

SQL queries are built by interpolating variables directly into template literal strings:

```typescript
// Line 567
db.exec(`SELECT * FROM items ORDER BY created_at DESC LIMIT ${limit}`)

// Line 590
db.exec(`SELECT * FROM items ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`)

// Line 608
db.exec(`SELECT COUNT(*) FROM items WHERE created_at >= '${startOfMonth}'`)
```

`limit` and `pageSize` are numeric so lower risk, but `startOfMonth` is a string value that flows directly into the query. Any string that is not sanitised before being interpolated is a potential injection point. Because sql.js is client-side only the attack surface is limited to the local user, but it is still bad practice and should be fixed for correctness and to prevent issues if the data layer is ever moved server-side.

**Fix**: Use parameterized queries via the `db.run(sql, params)` or `db.prepare(sql).bind(params)` API that sql.js provides.

---

### 2. 🔴 API Credentials Stored in localStorage
**File**: `src/services/search.ts` — lines 136–182

API keys for LLM providers (OpenAI, Anthropic, etc.) are read from `localStorage` and attached directly to outgoing network requests:

```typescript
'Authorization': `Bearer ${apiKey}`,  // line ~140
'x-api-key': apiKey,                  // line ~157
```

Problems:
- `localStorage` is accessible to any JavaScript running on the page, including injected third-party scripts.
- If the app is ever served over HTTP (not HTTPS), keys are transmitted in plaintext.
- There is no expiry, rotation, or revocation mechanism.
- LLM API keys typically have billing attached — a leaked key can be costly.

**Fix**: API keys should never live in the frontend. Route LLM calls through a backend proxy that holds the key in a server-side environment variable. If a fully client-side approach is required, at minimum clearly warn users that the key is stored insecurely.

---

### 3. 🟠 Dangerous `as any` Type Assertions
**Files**:
- `src/pages/Settings.tsx` — lines 64 (`tab.id as any`), 200 (`e.target.value as any`)
- `src/pages/Reports.tsx` — lines 90, 100, 221 (`entry.name as any`)
- `src/services/database.ts` — line 402 (`settings as any`), line 430 (`data as unknown as Blob | BufferSource`)

`as any` disables all type-checking for the expression. Line 430 in `database.ts` is particularly concerning — a double cast (`as unknown as Blob | BufferSource`) is often a sign that the data shape is genuinely wrong at runtime and the cast is hiding a real bug rather than resolving a typing gap.

**Fix**: Replace `as any` with proper type guards or correctly typed interfaces. For the double cast on line 430, verify the actual runtime type of `data` and handle the conversion correctly.

---

### 4. 🟠 Silent Catch Blocks — No User Feedback on Failure
**File**: `src/pages/ItemsList.tsx` — lines 51–58

```typescript
search.llmSearch(debouncedSearch)
  .then(result => {
    setFilteredItems(result.items);
    setIsSearching(false);
  })
  .catch(() => {
    setIsSearching(false);  // error is swallowed silently
  });
```

When an LLM search fails, the loading spinner stops but the user receives no indication of what happened. They are left looking at a stale or empty result with no way to know whether the search succeeded, timed out, or hit a quota limit.

**Fix**: Capture the error in the catch block, set an error state, and display a visible message (toast or inline text) explaining that the search failed.

---

### 5. 🟠 `window.confirm()` / `window.alert()` Used for UI
**Files**:
- `src/pages/ItemsList.tsx` — lines 96, 103
- `src/pages/ItemForm.tsx` — line 140
- `src/pages/Categories.tsx` — line 85
- `src/pages/Reminders.tsx` — line 93

Native browser dialogs (`window.confirm`, `window.alert`) are used for delete confirmations and validation messages throughout the app. These:
- Block the entire browser thread.
- Cannot be styled to match the app's design system.
- Are inaccessible (no focus management, no ARIA).
- Look jarring in a modern PWA.
- On some mobile browsers they are suppressed or behave unexpectedly.

**Fix**: Replace with a reusable custom `<ConfirmModal>` component for destructive actions and a toast/snackbar component for notifications.

---

### 6. 🟠 Full Page Reload on Settings Save
**File**: `src/pages/Settings.tsx` — line 40

```typescript
const handleSave = () => {
  updateSettings(formData);
  localStorage.setItem('theme', formData.theme);
  window.location.reload();  // full reload to apply theme
};
```

A full reload to apply a theme change is unnecessary and destructive — it clears all in-memory React state, cancels in-flight requests, and resets scroll positions. Theme changes should be handled reactively.

**Fix**: Manage theme at the root level (e.g. in a React context or by toggling a class on `document.documentElement`). Updating that context value will re-render only what needs to change without a reload.

---

### 7. 🟠 `JSON.parse` Called Without try-catch
**Files**:
- `src/services/search.ts` — line 208
- `src/services/storage.ts` — line 263
- `src/services/database.ts` — lines 460, 475, 477

If any of these receive malformed JSON (corrupted file, truncated import, unexpected API response shape), the `JSON.parse` call throws a `SyntaxError` that is unhandled and will crash the surrounding operation or the whole component tree if it propagates.

Note: `src/utils/index.ts:116` does wrap its parse in try-catch — that pattern should be applied everywhere.

**Fix**: Wrap every bare `JSON.parse` in a try-catch and handle the error gracefully (show an error message, return a default value, etc.).

---

### 8. 🟠 No Loading or Error States in Custom Hooks
**File**: `src/hooks/useDatabase.ts` — lines 5–17

```typescript
export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  // No isLoading, no error state
  useEffect(() => {
    setItems(db.getAllItems());
  }, []);
  return { items, refresh };
}
```

All hooks in this file follow the same pattern: they return data and a `refresh` callback, but nothing to indicate whether data is still loading or whether an error occurred. This means every page that uses these hooks cannot render a loading skeleton or display an error message.

**Fix**: Add `isLoading: boolean` and `error: Error | null` to each hook's return value, set them appropriately around the data-fetching call.

---

### 9. 🟠 Database Init Failure Leaves App in Broken State
**File**: `src/App.tsx` — lines 86–98

```typescript
useEffect(() => {
  const init = async () => {
    try {
      await initDatabase();
      setInitialized(true);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // initialized stays false, loading becomes false
      // the UI renders nothing useful
    } finally {
      setLoading(false);
    }
  };
  init();
}, []);
```

If `initDatabase()` throws, the app exits the loading state but `initialized` remains `false`. The user is left on a blank or welcome screen with no explanation and no way to retry.

**Fix**: Add an `initError` state. If set, render an error screen with the error message and a "Retry" button that calls `init()` again.

---

### 10. 🟠 Incomplete Form Input Validation
**File**: `src/pages/ItemForm.tsx` — lines 118–121

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.name?.trim()) {
    alert('Name is required');
    return;
  }
  // proceeds with no further validation
```

Only the `name` field is validated before submission. The following cases are not checked:
- Negative quantity or price values.
- Non-numeric input in numeric fields.
- Purchase date set in the future (may be intentional, but worth flagging).
- Text fields exceeding any reasonable maximum length.
- Custom field values matching their declared type.

**Fix**: Add a validation function that checks all fields before submission and returns a map of field → error message. Display errors inline next to the relevant fields rather than in an `alert()`.

---

### 11. 🟠 Search State Duplicated Across Components
**Files**: `src/components/Layout.tsx` — lines 31–33, `src/pages/ItemsList.tsx`

`Layout.tsx` owns `searchQuery` and `searchMode` state and passes them down via props. `ItemsList.tsx` also manages its own filtered state derived from the same query. There is no shared global state (no Context, no Zustand store), so the two sources can diverge and the search bar in the layout is tightly coupled to a specific page.

**Fix**: Lift search state into a React context or a lightweight global store so any component can read or update it without prop-drilling or duplication.

---

### 12. 🟠 Missing ARIA Labels and Semantic HTML
**Files**: Multiple — notably `src/components/Layout.tsx` line 61, modal overlays throughout

Observed gaps:
- Decorative or interactive elements rendered without `aria-label` or `aria-labelledby`.
- Modal/dialog overlays not marked with `role="dialog"` and `aria-modal="true"`.
- Icon-only buttons have no accessible label (screen readers read nothing meaningful).
- No `aria-live` region for dynamic content updates (search results, success/error messages).

**Fix**: Audit every interactive element and dynamic region. Add `aria-label` to icon buttons, `role="dialog"` + `aria-labelledby` to modals, and `aria-live="polite"` to result/status areas.

---

### 13. 🟠 Incomplete Keyboard Navigation
**Files**: Multiple — modal components, custom dropdowns

- Modals cannot be dismissed with the Escape key.
- Focus is not trapped inside open modals (Tab will leave the modal and interact with background content).
- No visible focus indicator style on some interactive elements.
- Custom dropdown/select elements are not keyboard accessible.

**Fix**: Add `keydown` listeners for Escape on all modals. Implement a focus trap (e.g. using a small utility or the `focus-trap-react` library). Ensure `:focus-visible` styles are defined in CSS for all interactive elements.

---

### 14. 🟠 No Tests of Any Kind
**Files**: None

There are no test files, no test runner configured (no Vitest, Jest, or Playwright setup in `package.json`), and no CI pipeline. This means:
- Regressions in database queries, search logic, or import/export are only caught manually.
- Refactoring any service is high-risk.
- There is no way to verify correctness after a dependency upgrade.

**Fix**: At minimum, add Vitest (already compatible with Vite) and write unit tests for `services/database.ts`, `services/storage.ts`, and `utils/index.ts`. These are pure logic and easy to test without a DOM.

---

### 15. 🟡 `debounce` Utility Has No Cancel/Cleanup Method
**File**: `src/utils/index.ts` — lines 94–104

```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

The returned function has no `.cancel()` method. If a component using a debounced callback unmounts while a timeout is pending, the callback will still fire on a now-unmounted component. The `useDatabase.ts` hook does handle cleanup via `useEffect` return values, but any direct use of this utility outside of a hook is at risk.

**Fix**: Return an object `{ invoke, cancel }` or attach a `.cancel` method to the returned function so callers can cancel the pending timeout on unmount.

---

### 16. 🟡 Mixed Static and Dynamic Imports of `database.ts`
**Files**: `src/App.tsx`, `src/services/storage.ts` and 8 other files

The Vite build emits a warning:

```
(!) database.ts is dynamically imported by storage.ts
but also statically imported by App.tsx and 8 other files
```

This causes the module to appear in both the main bundle and a lazy chunk, potentially doubling the code or causing subtle module identity issues (two instances of a module-level singleton).

**Fix**: Make all imports of `database.ts` static, or change all of them to dynamic. Given that `database.ts` is used at app startup, static imports are appropriate.

---

### 17. 🟡 Monolithic 626-Line Database Service
**File**: `src/services/database.ts`

A single file handles: SQLite initialisation, schema migrations, CRUD for items, CRUD for categories, CRUD for reminders, settings management, statistics/aggregations, and file I/O (save/load database). This makes the file hard to navigate, hard to test in isolation, and hard to extend without introducing regressions.

**Fix**: Split into focused service modules: `ItemsService`, `CategoriesService`, `RemindersService`, `SettingsService`, `StatsService`. Keep a thin `db.ts` for initialisation and the raw sql.js instance.

---

### 18. 🟡 Base64 Images Stored Directly in SQLite
**File**: `src/pages/ItemForm.tsx` — lines 74–90

Photos are compressed and then stored as base64 strings inside the SQLite database. Even after compression:
- A handful of photos per item will significantly inflate the database file size.
- Every query that returns items will carry the full base64 payload in memory.
- Saving/loading the database file to disk will be slow.

**Fix**: Store images in `IndexedDB` (keyed by a UUID) and only keep the UUID reference in the SQLite row. This keeps the database small and queries fast.

---

### 19. 🟡 File System Errors Only Logged, Not Shown to User
**File**: `src/services/storage.ts` — multiple locations

```typescript
catch (err) {
  if ((err as Error).name !== 'AbortError') {
    console.error('Save dialog error:', err);  // user sees nothing
  }
  return null;
}
```

When a save or load operation fails for a reason other than the user cancelling, the error is swallowed into the console and the caller receives `null`. The caller pages do not appear to handle the `null` return with a user-facing message either.

**Fix**: Propagate errors (throw or return an error object) so the calling page can display a toast or inline message explaining what went wrong.

---

### 20. 🟡 TypeScript Strict Checks Partially Disabled
**File**: `tsconfig.json` — lines 15–16

```json
"noUnusedLocals": false,
"noUnusedParameters": false,
```

Unused variables and parameters are not flagged by the compiler. This allows dead code to accumulate silently and makes it harder to identify stale imports or refactoring leftovers.

**Fix**: Set both to `true`. Fix any resulting errors (most will be trivial — prefix unused parameters with `_` or remove them).

---

### 21. 🟡 Inconsistent State Update Patterns
**Files**: Multiple

Two different patterns are used for triggering re-renders after a mutation:
1. A `refresh()` callback is returned from hooks (e.g. `useItems`, `useCategories`) and called manually after every mutation.
2. Some components manage their own local state directly.

This inconsistency makes the data flow hard to reason about and means it is easy to forget a `refresh()` call and end up with stale UI.

**Fix**: Pick one pattern and apply it everywhere. A React context that exposes mutating functions and handles its own re-fetching is cleaner than manual `refresh()` calls scattered across page components.

---

### 22. 🟡 Icon/Color Rendering Without Fallbacks
**File**: `src/pages/Reports.tsx` — lines 90, 100, 221

```typescript
<Cell key={entry.name} fill={getConditionColor(entry.name as any)} />
```

If `entry.name` is a condition value not handled by `getConditionColor`, the function presumably returns `undefined` or an empty string, resulting in an invisible chart cell. There is no fallback colour and no warning.

Compare with `src/pages/Categories.tsx` line 114 which does this correctly:
```typescript
const Icon = iconMap[category.icon] || Package;  // has a fallback
```

**Fix**: Add a default/fallback colour to `getConditionColor` for unknown values, and remove the `as any` cast by typing the condition values properly.

---

### 23. 🟡 No `.env.example` File

The project appears to expect API keys (for LLM search providers) to be supplied by the user via the Settings page and stored in `localStorage`. There is no `.env.example` or equivalent documentation listing what environment variables or configuration values are required to run the app.

**Fix**: Add a `README.md` section or a `.env.example` file documenting all required configuration (even if it is just UI settings), so new developers know what to supply.

---

## Suggested Fix Priority

1. 🔴 Fix SQL injection — parameterize all queries in `database.ts`
2. 🔴 Remove API keys from `localStorage` — proxy calls server-side or warn users explicitly
3. 🟠 Wrap all bare `JSON.parse` calls in try-catch
4. 🟠 Replace `window.confirm`/`window.alert` with a custom modal and toast system
5. 🟠 Add error state + retry UI to database initialization in `App.tsx`
6. 🟠 Surface async errors to the user (search failures, storage failures)
7. 🟠 Expand form validation in `ItemForm.tsx`
8. 🟠 Add `isLoading` and `error` to all custom hooks
9. 🟠 Replace `window.location.reload()` in settings with reactive theme switching
10. 🟠 Audit and fix ARIA labels and keyboard navigation
11. 🟡 Enable `noUnusedLocals` and `noUnusedParameters` in tsconfig and clean up
12. 🟡 Normalise import strategy for `database.ts` (all static)
13. 🟡 Move images to IndexedDB, store only references in SQLite
14. 🟡 Add `.cancel()` to the `debounce` utility
15. 🟡 Set up Vitest and write unit tests for services and utils
