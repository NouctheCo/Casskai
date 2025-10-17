// Index des types de base de données - Organisation modulaire
// Réexporte les types Supabase générés de manière organisée

// Types de base générés par Supabase
export type { Json, Database } from '../supabase'

// Types d'entreprise et configuration  
export type {
  Company,
  CompanyInsert,
  CompanyUpdate,
  UserCompany,
  UserCompanyInsert,
  UserCompanyUpdate
} from './company.types'

// Types comptables
export type {
  Account,
  AccountInsert,
  AccountUpdate,
  Journal,
  JournalInsert,
  JournalUpdate,
  JournalEntry,
  JournalEntryInsert,
  JournalEntryUpdate,
  JournalEntryLine,
  JournalEntryLineInsert,
  JournalEntryLineUpdate
} from './accounting.types'

// Types de transactions et paiements
export type {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  Payment,
  PaymentInsert,
  PaymentUpdate
} from './transactions.types'

// Types de factures et devis
export type {
  Invoice,
  InvoiceInsert,
  InvoiceUpdate,
  Quote,
  QuoteInsert,
  QuoteUpdate,
  Client,
  ClientInsert,
  ClientUpdate
} from './invoices.types'

// Utilitaires de base de données
// Fichier database.utils supprimé (types dupliqués)
// export type {
//   DatabaseRow,
//   DatabaseInsert,
//   DatabaseUpdate,
//   DatabaseTable,
//   DatabaseFunction
// } from './database.utils'