// src/components/guards/index.ts
export { default as ConfigGuard } from './ConfigGuard';
export { default as AuthGuard } from './AuthGuard';

// Types
export interface GuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface AuthGuardProps extends GuardProps {
  requireAuth?: boolean;
}
