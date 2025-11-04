// Types de base pour les modules
export interface ModuleBase {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
}

export interface ModuleConfig {
  [key: string]: any;
}

export interface ModulePermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  admin: boolean;
}

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  price: number;
  category: string;
  rating: number;
  downloads: number;
  tags: string[];
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface MarketplaceStats {
  totalItems: number;
  totalDownloads: number;
  categories: MarketplaceCategory[];
  featuredItems: MarketplaceItem[];
}

export interface ModuleInstallation {
  moduleId: string;
  version: string;
  installedAt: string;
  status: 'installing' | 'installed' | 'failed';
  error?: string;
}

export interface ModuleUpdate {
  moduleId: string;
  currentVersion: string;
  newVersion: string;
  changelog: string;
  releaseDate: string;
}
