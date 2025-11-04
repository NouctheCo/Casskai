// Main Supabase types - Re-exports for modular structure
export type { Json } from './base.types'
export type { CoreTables } from './core.tables'
export type { AccountingTables } from './accounting.tables'
export type { FinancialTables } from './financial.tables'
export type { BusinessTables } from './business.tables'
export type {
  DatabaseViews,
  DatabaseFunctions,
  DatabaseEnums,
  DatabaseCompositeTypes,
} from './views.types'

// Combine all table types
import type { CoreTables } from './core.tables'
import type { AccountingTables } from './accounting.tables'
import type { FinancialTables } from './financial.tables'
import type { BusinessTables } from './business.tables'
import type {
  DatabaseViews,
  DatabaseFunctions,
  DatabaseEnums,
  DatabaseCompositeTypes,
} from './views.types'

export type AllTables = CoreTables &
  AccountingTables &
  FinancialTables &
  BusinessTables

// Main Database interface
export interface Database {
  public: {
    Tables: AllTables
    Views: DatabaseViews
    Functions: DatabaseFunctions
    Enums: DatabaseEnums
    CompositeTypes: DatabaseCompositeTypes
  }
}
