// Utilitaires génériques pour les types de base de données
import type { Database } from '../supabase'

// Types utilitaires génériques
export type DatabaseRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export type DatabaseInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

export type DatabaseUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// Helper pour créer des types de tables
export type DatabaseTable<T extends keyof Database['public']['Tables']> = {
  Row: DatabaseRow<T>
  Insert: DatabaseInsert<T>
  Update: DatabaseUpdate<T>
}

// Types pour les fonctions de base de données
export type DatabaseFunction<T extends keyof Database['public']['Functions']> = 
  Database['public']['Functions'][T]

// Types utilitaires pour les requêtes
export interface PaginationOptions {
  page: number
  limit: number
  offset?: number
}

export interface SortOptions {
  column: string
  direction: 'asc' | 'desc'
}

export interface FilterOptions {
  [key: string]: string | number | boolean | string[] | number[] | null
}

export interface QueryOptions {
  pagination?: PaginationOptions
  sort?: SortOptions
  filters?: FilterOptions
}

export interface QueryResult<T> {
  data: T[]
  count: number
  page: number
  totalPages: number
  hasMore: boolean
}

// Types pour les erreurs de base de données
export interface DatabaseError {
  code: string
  message: string
  details?: string
  hint?: string
}

// Types pour les opérations en lot
export interface BulkOperation<T> {
  operation: 'insert' | 'update' | 'delete'
  data: T[]
  options?: {
    onConflict?: string
    returning?: string
  }
}

export interface BulkResult<T> {
  success: boolean
  data?: T[]
  errors?: DatabaseError[]
  processed: number
  skipped: number
}

// Helpers pour les timestamps
export interface TimestampFields {
  created_at: string
  updated_at: string
}

export interface SoftDeleteFields extends TimestampFields {
  deleted_at: string | null
  is_deleted: boolean
}

// Types pour les relations
export type WithRelation<T, K extends string, R> = T & {
  [P in K]: R
}

export type WithOptionalRelation<T, K extends string, R> = T & {
  [P in K]?: R
}
