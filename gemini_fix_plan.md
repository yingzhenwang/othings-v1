# Gemini Fix Plan for Stuff Manager

This document outlines the identified issues in the current **Stuff Manager** codebase and provides a comprehensive plan for refactoring and improvement.

## 1. Critical Technical Issues

### 1.1 Synchronous Database Operations
- **Problem**: The current `database.ts` uses synchronous `sql.js` calls (`db.exec`, `db.run`). This blocks the main thread during data operations, which will cause UI freezes as the database grows.
- **Fix**: Refactor all database interactions to be asynchronous (`async/await`). While `sql.js` runs in memory, wrapping these in Promises prepares the app for potential web worker offloading or migration to `sqlite-wasm` (which supports File System Access API better).

### 1.2 Inefficient Data Loading & Pagination
- **Problem**: `ItemsList.tsx` uses `useItems()` calling `getAllItems()`, fetching **all** items into memory on every reload. Pagination is performed client-side *after* loading everything.
- **Fix**: 
    - Implement true database-side pagination using `OFFSET` and `LIMIT`.
    - Update `ItemsList` to use `useItemsPaginated` hook properly.
    - Ensure filter queries run against the database, not just JS arrays.

### 1.3 Monolithic Service File
- **Problem**: `src/services/database.ts` is over 600 lines long and handles Items, Categories, Reminders, and Settings. This violates the Single Responsibility Principle.
- **Fix**: Split `database.ts` into specific service files:
    - `src/services/db/core.ts` (init and connection)
    - `src/services/db/items.ts`
    - `src/services/db/categories.ts`
    - `src/services/db/reminders.ts`
    - `src/services/db/settings.ts`

### 1.4 Hardcoded State Management
- **Problem**: State is managed via ad-hoc functionality in hooks (`useItems`, etc.) that implies simple re-fetching. There is no global state management, leading to potential out-of-sync UI parts and "prop drilling".
- **Fix**: Introduce a state management library like **Zustand** or use **React Context** to manage shared state (User preferences, Categories, Current View).

### 1.5 Missing Data Validation
- **Problem**: Input validation is minimal. Invalid data types could corrupt the SQLite store.
- **Fix**: Integrate **Zod** for schema definition and validation, ensuring data integrity before it reaches the database.

## 2. Code Quality & Maintainability

### 2.1 Large Components
- **Problem**: `src/pages/ItemsList.tsx` handles UI layout, filtering logic, bulk actions, and view switching. It is too large and hard to test.
- **Fix**: Extract components:
    - `src/components/items/ItemFilters.tsx`
    - `src/components/items/ItemGrid.tsx`
    - `src/components/items/ItemTable.tsx`
    - `src/components/items/ItemCard.tsx`

### 2.2 Hardcoded Values & Types
- **Problem**: Conditions, default categories, and other constants are scattered or hardcoded.
- **Fix**: 
    - Centralize constants in `src/constants.ts`.
    - Strictly type all database results.

### 2.3 Duplicate Logic
- **Problem**: Search logic appears to be handled partly in components and partly in services.
- **Fix**: Centralize search logic in a dedicated hook/service that connects deeply with the database service.

## 3. Improvements Plan (Phased)

### Phase 1: Architecture Refactor (High Priority)
1.  **Split `database.ts`**: Create the `services/db/` directory and modularize the code.
2.  **Async API**: Convert all service functions to return `Promise<T>`.
3.  **Validation**: Add Zod schemas for `Item`, `Category`, `Reminder`.

### Phase 2: Performance & Data Flow (Medium Priority)
1.  **True Pagination**: Connect UI pagination controls to database `LIMIT`/`OFFSET` queries.
2.  **Global State**: Implement a Store for cached data like Categories and Settings.

### Phase 3: UI Component Refactor (Lower Priority)
1.  **Extract Components**: Break down `ItemsList` and `ItemForm`.
2.  **Theme System**: Ensure consistent token usage for dark/light modes.

### Phase 4: Testing & Reliability
1.  **Testing Setup**: Install Vitest and React Testing Library.
2.  **Unit Tests**: Write tests for the new modularized services.
