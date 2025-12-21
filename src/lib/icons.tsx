/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

// Système d'icônes centralisé pour CassKai

import {

  // Navigation et layout

  LayoutDashboard,

  Menu,

  Home,

  Sidebar,

  

  // Modules de base

  Calculator,

  Building,

  Users,

  FileText,

  

  // Modules premium

  Target,        // CRM

  UserCog,       // RH  

  Briefcase,     // Projets

  Store,         // Marketplace

  

  // Actions

  Settings,

  Download,

  Upload,

  RefreshCw,

  Save,

  Trash2,

  Edit3,

  Copy,

  Share,

  Plus,

  Minus,

  Search,

  Filter,

  // Sort, // Not exported from lucide-react

  

  // États

  CheckCircle,

  XCircle,

  AlertTriangle,

  Info,

  Clock,

  Loader2,

  

  // Navigation

  ChevronLeft,

  ChevronRight,

  ChevronDown,

  ChevronUp,

  ArrowLeft,

  ArrowRight,

  ArrowUp,

  ArrowDown,

  

  // Business

  BarChart3,

  PieChart,

  TrendingUp,

  TrendingDown,

  DollarSign,

  Euro,

  CreditCard,

  Receipt,

  

  // Système

  Shield,

  Key,

  Globe,

  Server,

  Database,

  Cpu,

  Activity,

  Zap,

  

  // Communication

  Mail,

  Phone,

  MessageCircle,

  Bell,

  BellOff,

  

  // Fichiers

  File,

  FileUp,

  FileDown,

  Folder,

  Package,

  Archive,

  

  // Temps

  Calendar,

  CalendarDays,

  Clock3,

  Timer,

  

  // Utilisateurs

  User,

  UserCheck,

  UserPlus,

  UserX,

  Users2,

  

  // Interface

  Eye,

  EyeOff,

  Maximize,

  Minimize,

  ExternalLink,

  Link,

  Unlink,

  

  // Divers

  Star,

  Heart,

  ThumbsUp,

  Flag,

  Tag,

  Bookmark,

  

  // Nouvelles icônes ajoutées

  Puzzle,

  Workflow,

  Brain,

  Sparkles,

  ShoppingCart,

} from 'lucide-react';



// Types pour les icônes

export type IconName = keyof typeof icons;

export type IconComponent = React.ComponentType<any>;



// Mapping centralisé des icônes avec noms cohérents

export const icons = {

  // === NAVIGATION & LAYOUT ===

  'dashboard': LayoutDashboard,

  'menu': Menu,

  'home': Home,

  'sidebar': Sidebar,

  

  // === MODULES CORE ===

  'accounting': Calculator,

  'banking': Building,

  'contacts': Users,

  'reports': FileText,

  'third-parties': Users,

  

  // === MODULES PREMIUM ===

  'crm': Target,

  'hr': UserCog,

  'projects': Briefcase,

  'marketplace': Store,

  'sales': ShoppingCart,

  

  // === ACTIONS PRINCIPALES ===

  'settings': Settings,

  'download': Download,

  'upload': Upload,

  'refresh': RefreshCw,

  'save': Save,

  'delete': Trash2,

  'edit': Edit3,

  'copy': Copy,

  'share': Share,

  'add': Plus,

  'remove': Minus,

  'search': Search,

  'filter': Filter,

  // 'sort': Sort, // Not exported from lucide-react

  

  // === ÉTATS ET STATUTS ===

  'success': CheckCircle,

  'error': XCircle,

  'warning': AlertTriangle,

  'info': Info,

  'pending': Clock,

  'loading': Loader2,

  'active': CheckCircle,

  'inactive': XCircle,

  

  // === NAVIGATION DIRECTIONNELLE ===

  'chevron-left': ChevronLeft,

  'chevron-right': ChevronRight,

  'chevron-down': ChevronDown,

  'chevron-up': ChevronUp,

  'arrow-left': ArrowLeft,

  'arrow-right': ArrowRight,

  'arrow-up': ArrowUp,

  'arrow-down': ArrowDown,

  

  // === BUSINESS & FINANCE ===

  'chart': BarChart3,

  'pie-chart': PieChart,

  'trending-up': TrendingUp,

  'trending-down': TrendingDown,

  'currency-dollar': DollarSign,

  'currency-euro': Euro,

  'payment': CreditCard,

  'invoice': Receipt,

  

  // === SYSTÈME & SÉCURITÉ ===

  'security': Shield,

  'key': Key,

  'network': Globe,

  'server': Server,

  'database': Database,

  'performance': Cpu,

  'activity': Activity,

  'power': Zap,

  

  // === COMMUNICATION ===

  'email': Mail,

  'phone': Phone,

  'chat': MessageCircle,

  'notification': Bell,

  'notification-off': BellOff,

  

  // === FICHIERS & DONNÉES ===

  'file': File,

  'file-upload': FileUp,

  'file-download': FileDown,

  'folder': Folder,

  'package': Package,

  'archive': Archive,

  

  // === TEMPS & PLANNING ===

  'calendar': Calendar,

  'calendar-days': CalendarDays,

  'clock': Clock3,

  'timer': Timer,

  

  // === UTILISATEURS ===

  'user': User,

  'user-check': UserCheck,

  'user-add': UserPlus,

  'user-remove': UserX,

  'users': Users2,

  

  // === INTERFACE ===

  'show': Eye,

  'hide': EyeOff,

  'maximize': Maximize,

  'minimize': Minimize,

  'external': ExternalLink,

  'link': Link,

  'unlink': Unlink,

  

  // === FEEDBACK & SOCIAL ===

  'favorite': Star,

  'like': Heart,

  'thumbs-up': ThumbsUp,

  'flag': Flag,

  'tag': Tag,

  'bookmark': Bookmark,

  

  // === MODULES SPÉCIALISÉS ===

  'plugin': Puzzle,

  'workflow': Workflow,

  'ai': Brain,

  'premium': Sparkles,

  

  // === TYPES DE MODULES ===

  'template': File,

  'connector': Link,

  'integration': Workflow,

  'theme': Sparkles,

} as const;



// Composant Icon avec gestion des erreurs et fallback

interface IconProps {

  name: IconName;

  size?: number;

  className?: string;

  color?: string;

}



export const Icon: React.FC<IconProps> = ({ 

  name, 

  size = 16, 

  className = '', 

  color = 'currentColor' 

}) => {

  const IconComponent = icons[name];

  

  if (!IconComponent) {

    console.warn(`Icon "${name}" not found. Using fallback.`);

    return <Package size={size} className={className} color={color} />;

  }

  

  return <IconComponent size={size} className={className} color={color} />;

};



// Fonction utilitaire pour obtenir une icône par nom

export const getIcon = (name: IconName): IconComponent | null => {

  return icons[name] || null;

};



// Fonction pour obtenir l'icône d'un module par catégorie

export const getModuleIcon = (category: string): IconComponent => {

  const categoryMap: Record<string, IconName> = {

    'core': 'security',

    'business': 'chart',

    'hr': 'hr',

    'project': 'projects',

    'integration': 'connector',

    'marketplace': 'marketplace',

  };

  

  const iconName = categoryMap[category];

  return iconName ? icons[iconName] : icons['package'];

};



// Fonction pour obtenir l'icône d'un statut

export const getStatusIcon = (status: string): IconComponent => {

  const statusMap: Record<string, IconName> = {

    'available': 'success',

    'active': 'active',

    'inactive': 'inactive',

    'beta': 'warning',

    'coming_soon': 'pending',

    'deprecated': 'error',

    'loading': 'loading',

  };

  

  const iconName = statusMap[status];

  return iconName ? icons[iconName] : icons['info'];

};



// Classe utilitaire pour la cohérence des tailles d'icônes

export const iconSizes = {

  xs: 'w-3 h-3',

  sm: 'w-4 h-4',

  md: 'w-5 h-5',

  lg: 'w-6 h-6',

  xl: 'w-8 h-8',

  '2xl': 'w-10 h-10',

} as const;



// Couleurs standardisées pour les icônes

export const iconColors = {

  primary: 'text-blue-600',

  secondary: 'text-gray-600',

  success: 'text-green-600',

  warning: 'text-yellow-600',

  error: 'text-red-600',

  muted: 'text-gray-400',

} as const;



// Hook pour utiliser les icônes de manière cohérente

export const useIcon = (name: IconName) => {

  const IconComponent = getIcon(name);

  

  return {

    Icon: IconComponent,

    render: (props: Omit<IconProps, 'name'>) => (

      <Icon name={name} {...props} />

    ),

  };

};



export default icons;
