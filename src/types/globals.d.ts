// Global type declarations for modules without types

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

// Global types for common patterns
declare global {
  interface Window {
    // Add any global window properties if needed
    plausible?: (event: string, options?: { props?: Record<string, any>; u?: string; callback?: () => void; }) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
  
  // Global namespace pour les types React
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};
