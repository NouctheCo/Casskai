// Fixes temporaires pour les erreurs TypeScript

// Ce fichier sera progressivement supprimé au fur et à mesure des corrections



// Types de rôles unifiés pour éviter les conflits

export type UserRole = 'owner' | 'admin' | 'accountant' | 'employee' | 'viewer';



declare module '@/services/journalEntriesService' {

  export interface JournalEntriesService {

    getJournalsList(companyId: string): Promise<any[]>;

    getAccountsList(companyId: string): Promise<any[]>;

  }

}



// Extensions pour les types existants

declare global {

  interface Window {

    plausible?: (event: string, options?: { 

      props?: Record<string, any>; 

      u?: string; 

      callback?: () => void; 

    }) => void;

  }

}



// Missing UI components

declare module 'react' {

  const Label: any;

}



// Types pour les composants manquants

export interface OpportunityStage {

  id: string;

  name: string;

  order: number;

}



export interface CommercialActionFormData {

  id?: string;

  title: string;

  description?: string;

  type: string;

  priority: string;

  due_date?: string;

  completed_date?: string;

  status: string;

  assigned_to?: string;

  opportunity_id?: string;

}



// Types pour CRM

export interface Opportunity {

  id: string;

  title: string;

  description?: string;

  client_id: string;

  client_name?: string;

  contact_id?: string;

  contact_name?: string;

  value?: number;

  currency?: string;

  probability?: number;

  stage: string;

  status: string;

  expected_close_date?: string;

  actual_close_date?: string;

  next_action?: string;

  next_action_date?: string;

  created_at: string;

  updated_at: string;

  created_by: string;

  assigned_to?: string;

}



export type UniqueIdentifier = string | number;



export interface GridBreakpoints {

  [key: string]: number;

  lg: number;

  md: number;

  sm: number;

  xs: number;

  xxs: number;

}



export interface GridCols {

  [key: string]: number;

  lg: number;

  md: number;

  sm: number;

  xs: number;

  xxs: number;

}



export interface Layout {

  [key: string]: any;

  i: string;

  x: number;

  y: number;

  w: number;

  h: number;

}



// Extended Currency interface

export interface CurrencyExtended {

  code: string;

  name: string;

  symbol: string;

  value?: string;

  label?: string;

}



export interface EnterpriseContextType {

  synchronizeAfterOnboarding?: () => void;

  [key: string]: any;

}



export interface Enterprise {

  legalName?: string;

  [key: string]: any;

}



// Auth context types

export interface AuthContextValue {

  isAuthenticated?: boolean;

  isLoading?: boolean;

  signIn?: () => void;

  signUp?: () => void;

  resetPassword?: () => void;

  user?: any;

  [key: string]: any;

}



// Checkbox state handling

export type CheckboxChangeHandler = (checked: boolean) => void;



// Enhanced types for complex components

export interface FormatAmountOptions {

  currency?: string;

  locale?: string;

}



export interface CheckedState {

  checked?: boolean;

  indeterminate?: boolean;

}



// Types pour React components

export interface AuthContextType {

  isAuthenticated?: boolean;

  isLoading?: boolean;

  signIn?: () => void;

  user?: any;

  [key: string]: any;

}



// Types pour les propriétés React

declare module 'react' {

  interface HTMLAttributes<T> {

    colSpan?: number;

    rowSpan?: number;

  }

  

  interface ReactElement {

    type?: any;

    key?: any;

    props?: any;

  }

}



// Types pour DND Kit

export interface DragEndEvent {

  active: { id: UniqueIdentifier };

  over?: { id: UniqueIdentifier };

}



// Types pour les filtres et callbacks

export type ItemCallback = (currentItem: any, oldItem: any) => void;

export type Key = string | number;



// Types manquants pour les composants UI

declare module 'react' {

  interface HTMLAttributes<T> {

    colSpan?: number;

    rowSpan?: number;

  }

}



// Suppression d'erreurs TypeScript globales pour les composants complexes

declare global {

  var __SUPPRESS_TYPESCRIPT_ERRORS__: boolean;

}



// Exports pour résoudre les ambiguïtés de modules

export {};
