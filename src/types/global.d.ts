// Global type declarations for CassKai
// This file consolidates all global type declarations

// ============================================================================
// MODULE DECLARATIONS - External libraries without types
// ============================================================================

declare module 'ml-matrix' {
  export class Matrix {
    constructor(data: number[][] | number);
    static from(data: number[][]): Matrix;
    static zeros(rows: number, cols: number): Matrix;
    static eye(size: number): Matrix;
    inverse(): Matrix;
    mmul(other: Matrix): Matrix;
    transpose(): Matrix;
    to2DArray(): number[][];
    get(row: number, col: number): number;
    set(row: number, col: number, value: number): void;
    rows: number;
    columns: number;
  }
}

declare module 'simple-statistics' {
  export function mean(data: number[]): number;
  export function median(data: number[]): number;
  export function standardDeviation(data: number[]): number;
  export function variance(data: number[]): number;
  export function linearRegression(data: number[][]): { m: number; b: number };
  export function rSquared(data: number[][], func: (x: number) => number): number;
  export function sum(data: number[]): number;
  export function min(data: number[]): number;
  export function max(data: number[]): number;
  export function quantile(data: number[], p: number): number;
}

declare module 'regression' {
  export interface RegressionResult {
    equation: number[];
    r2: number;
    string: string;
    predict(x: number): number[];
  }

  export function linear(data: number[][]): RegressionResult;
  export function exponential(data: number[][]): RegressionResult;
  export function logarithmic(data: number[][]): RegressionResult;
  export function power(data: number[][]): RegressionResult;
  export function polynomial(data: number[][], order?: number): RegressionResult;
}

// ============================================================================
// ASSET DECLARATIONS - Images, styles, and other assets
// ============================================================================

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: any;
  export default content;
}

// ============================================================================
// PROJECT MODULE WILDCARDS - For development convenience
// ============================================================================

declare module '@/utils/*';
declare module '@/services/*';
declare module '@/components/*';
declare module '@/hooks/*';
declare module '@/contexts/*';
declare module '@/types/*';
declare module '@/lib/*';
declare module '@/pages/*';
declare module '@/api/*';

// ============================================================================
// VITE ENVIRONMENT VARIABLES
// ============================================================================

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
  readonly VITE_ANALYTICS_ENABLED: string;
  readonly VITE_DEBUG_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ============================================================================
// GLOBAL WINDOW EXTENSIONS
// ============================================================================

declare global {
  interface Window {
    plausible?: (event: string, options?: {
      props?: Record<string, any>;
      u?: string;
      callback?: () => void;
    }) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }

  // Global namespace for React/JSX
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }

    interface IntrinsicAttributes {
      [key: string]: any;
    }
  }
}

// ============================================================================
// REACT EXTENSIONS - Additional HTML attributes
// ============================================================================

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

export {};
