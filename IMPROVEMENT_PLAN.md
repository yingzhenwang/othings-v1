# Stuff Manager - Improvement Plan

## Project Overview

**Stuff Manager** is a personal belongings inventory management web application built with:
- React 18 + TypeScript + Vite
- sql.js (SQLite in browser) for data storage
- react-router-dom for routing
- lucide-react for icons
- recharts for visualizations

### Current Features
- Item CRUD with photos, QR codes, custom fields
- Category management
- Reminders system (warranty, maintenance, etc.)
- Dashboard with statistics
- Search (normal + AI/LLM mode)
- Export to PDF
- Dark/light theme support

---

## Completed Improvements

### Phase 1: TypeScript & Error Handling (COMPLETED)

- **Error Boundaries**: Added `ErrorBoundary` component in `src/components/ErrorBoundary.tsx`
- **TypeScript strict mode**: Already enabled in tsconfig.json
- **Fixed `any` types**: Replaced with proper types in `database.ts` and `storage.ts`
- **File System Access API types**: Added proper type declarations in `storage.ts`

### Phase 2: Performance (COMPLETED)

- **Pagination**: Added client-side pagination to ItemsList (20 items per page)
- **Code splitting**: Implemented lazy loading for all route pages
- **Bundle size**: Reduced main bundle from 718KB to 245KB

### Phase 3: Dependency Cleanup (COMPLETED)

- Removed unused `dexie` and `dexie-react-hooks` packages
- Removed unused `idb` package

---

## Remaining Improvements

### High Priority

| Issue | Recommendation |
|-------|----------------|
| No formal state management | Implement Zustand or React Context for global state |
| Large base64 images | Compress images before storing, use object URLs |
| Synchronous DB queries | Consider making database operations truly async |

### Medium Priority

| Issue | Recommendation |
|-------|----------------|
| Large monolithic components | Break down `ItemsList.tsx` into smaller reusable components |
| Limited validation | Add form validation (e.g., Zod) |
| Split database.ts | Split 500+ lines into multiple service files |
| No unit tests | Add Vitest + React Testing Library |
| No E2E tests | Add Playwright for E2E testing |
| Accessibility | Add ARIA labels, improve keyboard navigation |

### Low Priority

| Feature | Description |
|---------|-------------|
| Data backup | Add automatic backup to cloud storage |
| Multi-currency | Better currency conversion support |
| Batch operations | Bulk edit, move, delete items |

---

## Technical Debt Notes

- `src/services/database.ts` has 500+ lines and does too much
- Search functionality duplicated across components
- `useDatabase.ts` hooks don't handle loading/error states
