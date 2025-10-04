// Types de base pour la base de données Supabase
// Extrait de supabase.ts pour réduire la taille du fichier

import type { Company, Account, UserProfile } from './database';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Structure de base pour les tables
export interface DatabaseTable<T = any> {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
}

// Tables principales (référence simplifiée aux types existants)
export interface DatabaseTables {
  companies: DatabaseTable<Company>;
  accounts: DatabaseTable<Account>;
  journal_entries: DatabaseTable;
  journal_entry_lines: DatabaseTable;
  user_companies: DatabaseTable;
  user_roles: DatabaseTable;
}

// Views, Functions, Enums (placeholders pour compatibilité)
export interface DatabaseViews {
  [key: string]: any;
}

export interface DatabaseFunctions {
  [key: string]: any;
}

export interface DatabaseEnums {
  [key: string]: any;
}

export interface DatabaseCompositeTypes {
  [key: string]: any;
}

// Types utilitaires pour Supabase
export interface DatabasePublic {
  public: {
    Tables: DatabaseTables;
    Views: DatabaseViews;
    Functions: DatabaseFunctions;
    Enums: DatabaseEnums;
    CompositeTypes: DatabaseCompositeTypes;
  };
}

export type Database = DatabasePublic;
