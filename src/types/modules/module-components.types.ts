// Types pour les composants et le rendu des modules

import type { ComponentType, ReactNode } from 'react'

// Types de composants de modules
export interface ModuleComponent {
  id: string;
  name: string;
  type: 'page' | 'widget' | 'modal' | 'sidebar' | 'toolbar';
  component: ComponentType<ModuleComponentProps>;
  props?: Record<string, unknown>;
  layout?: ModuleLayout;
  permissions?: string[];
  routes?: ModuleRoute[];
}

export interface ModuleComponentProps {
  moduleId: string;
  config: Record<string, unknown>;
  data?: Record<string, unknown>;
  onAction?: (action: string, payload?: unknown) => void;
  children?: ReactNode;
  className?: string;
}

export interface ModuleRenderer {
  renderComponent: (component: ModuleComponent) => ReactNode;
  renderWidget: (widgetId: string, props?: Record<string, unknown>) => ReactNode;
  renderPage: (pageId: string, props?: Record<string, unknown>) => ReactNode;
  renderModal: (modalId: string, props?: Record<string, unknown>) => ReactNode;
}

export interface ModuleRoute {
  path: string;
  component: ComponentType<ModuleComponentProps>;
  exact?: boolean;
  permissions?: string[];
  title?: string;
  icon?: string;
  hidden?: boolean;
  children?: ModuleRoute[];
}

export interface ModuleNavigation {
  moduleId: string;
  items: ModuleNavigationItem[];
  position?: 'sidebar' | 'header' | 'footer';
  order?: number;
}

export interface ModuleNavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: string | number;
  permissions?: string[];
  children?: ModuleNavigationItem[];
  onClick?: () => void;
}

export interface ModuleLayout {
  type: 'full' | 'centered' | 'sidebar' | 'grid';
  width?: 'small' | 'medium' | 'large' | 'full';
  height?: 'auto' | 'full' | number;
  padding?: boolean;
  background?: string;
  className?: string;
}

export interface ModuleTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
  radius: string;
  spacing: Record<string, string>;
  typography: Record<string, string>;
}

export interface ModuleWidget {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  component: ComponentType<ModuleComponentProps>;
  size: 'small' | 'medium' | 'large';
  refreshInterval?: number;
  configurable: boolean;
  defaultConfig?: Record<string, unknown>;
  permissions?: string[];
}
