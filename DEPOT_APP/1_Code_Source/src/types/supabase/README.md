# Supabase Types - Modular Structure

This directory contains the modular split of the main Supabase database types, previously contained in a single 1647-line file.

## File Structure

| File | Lines | Description |
|------|-------|-------------|
| `base.types.ts` | 8 | Base Json type used across all types |
| `core.tables.ts` | 394 | Companies, users, roles, permissions tables |
| `accounting.tables.ts` | 308 | Accounting-related tables (accounts, journals, entries) |
| `financial.tables.ts` | 620 | Financial tables (invoices, taxes, banking, transactions) |
| `business.tables.ts` | 294 | Business tables (employees, projects, budgets, Stripe) |
| `views.types.ts` | 42 | Database views, functions, enums, composite types |
| `index.ts` | 40 | Main exports and Database interface |
| **Total** | **1,706** | All modular files combined |

## Original File

The original `src/types/supabase.ts` (1647 lines) has been replaced with a lightweight re-export file (23 lines) that maintains 100% backward compatibility.

## Backward Compatibility

All existing imports continue to work without any changes:

```typescript
// Both of these still work
import type { Database, Json } from '@/types/supabase'
import type { Database } from '@/types/supabase.ts'
```

## Architecture

```
src/types/
├── supabase.ts (23 lines) - Main re-export file (backward compatible)
└── supabase/
    ├── README.md - This file
    ├── base.types.ts - Json type
    ├── core.tables.ts - Core business tables
    ├── accounting.tables.ts - Accounting domain
    ├── financial.tables.ts - Financial domain
    ├── business.tables.ts - Business domain
    ├── views.types.ts - Views, functions, enums
    └── index.ts - Central export point
```

## Benefits

1. **Maintainability**: Each file is under 700 lines, making it easier to navigate and edit
2. **Domain Separation**: Types are organized by logical domain (core, accounting, financial, business)
3. **Performance**: Smaller files can be processed faster by IDEs and type checkers
4. **Backward Compatible**: No breaking changes to existing code
5. **Scalability**: Easy to add new tables to appropriate domain files

## Adding New Tables

To add new database tables:

1. Identify the domain (core, accounting, financial, or business)
2. Add the table type to the appropriate `*.tables.ts` file
3. Ensure the file stays under 700 lines
4. If a file grows too large, consider splitting it further

## Type Checking

The modular types have been verified to compile correctly:

```bash
npx tsc --noEmit --skipLibCheck src/types/supabase.ts src/types/supabase/index.ts
# ✓ No errors
```

## Migration Date

Refactored on: 2025-11-04
Original file: 1647 lines
New structure: 7 files totaling 1706 lines (including documentation comments)
Reduction factor: Individual files are 74-96% smaller than the original
