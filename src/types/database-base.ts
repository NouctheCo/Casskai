// @ts-nocheck
// Types de base pour la base de données Supabase
// Extrait de supabase.ts pour réduire la taille du fichier

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Types utilitaires pour Supabase
export type Database = DatabasePublic

export interface DatabasePublic {
  public: {
    Tables: DatabaseTables
    Views: DatabaseViews
    Functions: DatabaseFunctions
    Enums: DatabaseEnums
    CompositeTypes: DatabaseCompositeTypes
  }
}

// Import des types détaillés
export type { DatabaseTables } from './database-tables'
export type { DatabaseViews } from './database-views'  
export type { DatabaseFunctions, DatabaseEnums, DatabaseCompositeTypes } from './database-functions'