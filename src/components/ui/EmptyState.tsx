import React from 'react';
import { LucideIcon, PackageOpen, FileText, Users, DollarSign, Calendar, TrendingUp, Settings, AlertCircle } from 'lucide-react';
import { Button } from './button';

export type EmptyStateVariant =
  | 'no-data'        // Aucune donnée disponible
  | 'empty-list'     // Liste vide mais fonctionnelle
  | 'error'          // Erreur de chargement
  | 'loading'        // Chargement en cours
  | 'no-results'     // Aucun résultat de recherche
  | 'coming-soon'    // Fonctionnalité à venir
  | 'no-permission'; // Pas de permission

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const defaultConfig: Record<EmptyStateVariant, {
  icon: LucideIcon;
  title: string;
  description: string;
}> = {
  'no-data': {
    icon: PackageOpen,
    title: 'Aucune donnée',
    description: 'Commencez par ajouter vos premières données pour voir les statistiques et rapports.',
  },
  'empty-list': {
    icon: FileText,
    title: 'Liste vide',
    description: 'Aucun élément pour le moment. Créez-en un pour commencer.',
  },
  'error': {
    icon: AlertCircle,
    title: 'Chargement impossible',
    description: 'Une erreur est survenue lors du chargement des données. Veuillez réessayer.',
  },
  'loading': {
    icon: Settings,
    title: 'Chargement...',
    description: 'Récupération des données en cours.',
  },
  'no-results': {
    icon: FileText,
    title: 'Aucun résultat',
    description: 'Aucun résultat ne correspond à votre recherche. Essayez avec d\'autres critères.',
  },
  'coming-soon': {
    icon: Calendar,
    title: 'Bientôt disponible',
    description: 'Cette fonctionnalité sera disponible prochainement.',
  },
  'no-permission': {
    icon: AlertCircle,
    title: 'Accès restreint',
    description: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette section.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'no-data',
  icon: CustomIcon,
  title: customTitle,
  description: customDescription,
  actionLabel,
  onAction,
  className = '',
}) => {
  const config = defaultConfig[variant];
  const Icon = CustomIcon || config.icon;
  const title = customTitle || config.title;
  const description = customDescription || config.description;

  const isError = variant === 'error';
  const isLoading = variant === 'loading';

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {/* Icon */}
      <div className={`
        relative mb-4 rounded-full p-6
        ${isError ? 'bg-red-50' : isLoading ? 'bg-blue-50' : 'bg-gray-50'}
      `}>
        <Icon className={`
          h-12 w-12
          ${isError ? 'text-red-400' : isLoading ? 'text-blue-400 animate-spin' : 'text-gray-400'}
        `} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 max-w-md mb-6">
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant={isError ? 'destructive' : 'default'}
          size="sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

// Composants spécialisés pour des cas d'usage fréquents
export const EmptyInvoices: React.FC<{ onCreateInvoice?: () => void }> = ({ onCreateInvoice }) => (
  <EmptyState
    icon={FileText}
    title="Aucune facture"
    description="Créez votre première facture pour commencer à gérer vos ventes."
    actionLabel={onCreateInvoice ? "Créer une facture" : undefined}
    onAction={onCreateInvoice}
  />
);

export const EmptyCustomers: React.FC<{ onAddCustomer?: () => void }> = ({ onAddCustomer }) => (
  <EmptyState
    icon={Users}
    title="Aucun client"
    description="Ajoutez vos premiers clients pour gérer vos relations commerciales."
    actionLabel={onAddCustomer ? "Ajouter un client" : undefined}
    onAction={onAddCustomer}
  />
);

export const EmptyTransactions: React.FC = () => (
  <EmptyState
    icon={DollarSign}
    title="Aucune transaction"
    description="Les transactions apparaîtront ici une fois que vous aurez créé des factures ou enregistré des paiements."
  />
);

export const EmptyReports: React.FC = () => (
  <EmptyState
    icon={TrendingUp}
    title="Données insuffisantes"
    description="Créez des factures et enregistrez des transactions pour générer vos premiers rapports."
  />
);

export const LoadingState: React.FC<{ message?: string }> = ({ message }) => (
  <EmptyState
    variant="loading"
    description={message || 'Chargement des données en cours...'}
  />
);

export const ErrorState: React.FC<{ onRetry?: () => void; message?: string }> = ({ onRetry, message }) => (
  <EmptyState
    variant="error"
    description={message || 'Une erreur est survenue. Veuillez réessayer.'}
    actionLabel={onRetry ? "Réessayer" : undefined}
    onAction={onRetry}
  />
);
