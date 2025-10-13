// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Lightbulb, 
  ArrowRight, 
  BookOpen, 
  ShoppingCart, 
  CreditCard, 
  Wallet,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface JournalEntryTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  accounts: {
    debit: { code: string; name: string; };
    credit: { code: string; name: string; };
  }[];
  category: 'sale' | 'purchase' | 'bank' | 'cash' | 'miscellaneous';
  example: {
    description: string;
    amount: number;
  };
}

const JournalEntryHelper: React.FC<{ 
  onSelectTemplate: (template: JournalEntryTemplate) => void;
}> = ({ onSelectTemplate }) => {
  const { t } = useLocale();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: 'sale', label: 'Ventes', icon: ShoppingCart, color: 'bg-green-100 text-green-800' },
    { id: 'purchase', label: 'Achats', icon: CreditCard, color: 'bg-blue-100 text-blue-800' },
    { id: 'bank', label: 'Opérations bancaires', icon: Wallet, color: 'bg-purple-100 text-purple-800' },
    { id: 'cash', label: 'Caisse', icon: Wallet, color: 'bg-orange-100 text-orange-800' },
    { id: 'miscellaneous', label: 'Opérations diverses', icon: BookOpen, color: 'bg-gray-100 text-gray-800' }
  ];

  const templates: JournalEntryTemplate[] = [
    {
      id: 'sale-invoice',
      title: 'Facturation client (TTC)',
      description: 'Enregistrement d\'une vente avec TVA',
      icon: ShoppingCart,
      category: 'sale',
      accounts: [
        { debit: { code: '411000', name: 'Clients' }, credit: { code: '701000', name: 'Ventes de produits finis' } },
        { debit: { code: '411000', name: 'Clients' }, credit: { code: '445710', name: 'TVA collectée' } }
      ],
      example: {
        description: 'Facture client n° FA-2024-001',
        amount: 1200.00
      }
    },
    {
      id: 'purchase-invoice',
      title: 'Facture fournisseur (TTC)',
      description: 'Enregistrement d\'un achat avec TVA récupérable',
      icon: CreditCard,
      category: 'purchase',
      accounts: [
        { debit: { code: '601000', name: 'Achats stockés' }, credit: { code: '401000', name: 'Fournisseurs' } },
        { debit: { code: '445660', name: 'TVA déductible' }, credit: { code: '401000', name: 'Fournisseurs' } }
      ],
      example: {
        description: 'Facture fournisseur n° F-2024-001',
        amount: 1000.00
      }
    },
    {
      id: 'customer-payment',
      title: 'Encaissement client',
      description: 'Réception d\'un paiement client en banque',
      icon: TrendingUp,
      category: 'bank',
      accounts: [
        { debit: { code: '512000', name: 'Banque' }, credit: { code: '411000', name: 'Clients' } }
      ],
      example: {
        description: 'Règlement facture FA-2024-001',
        amount: 1200.00
      }
    },
    {
      id: 'supplier-payment',
      title: 'Règlement fournisseur',
      description: 'Paiement d\'une facture fournisseur',
      icon: TrendingDown,
      category: 'bank',
      accounts: [
        { debit: { code: '401000', name: 'Fournisseurs' }, credit: { code: '512000', name: 'Banque' } }
      ],
      example: {
        description: 'Règlement fournisseur F-2024-001',
        amount: 1000.00
      }
    },
    {
      id: 'salary-payment',
      title: 'Paiement de salaires',
      description: 'Enregistrement du paiement des salaires nets',
      icon: Wallet,
      category: 'bank',
      accounts: [
        { debit: { code: '421000', name: 'Personnel - Rémunérations dues' }, credit: { code: '512000', name: 'Banque' } }
      ],
      example: {
        description: 'Salaires mois de janvier 2024',
        amount: 5000.00
      }
    },
    {
      id: 'cash-sale',
      title: 'Vente au comptant',
      description: 'Vente payée immédiatement en espèces',
      icon: Wallet,
      category: 'cash',
      accounts: [
        { debit: { code: '530000', name: 'Caisse' }, credit: { code: '707000', name: 'Ventes de marchandises' } },
        { debit: { code: '530000', name: 'Caisse' }, credit: { code: '445710', name: 'TVA collectée' } }
      ],
      example: {
        description: 'Vente au comptant',
        amount: 120.00
      }
    },
    {
      id: 'opening-balance',
      title: 'À-nouveau (report solde)',
      description: 'Report des soldes d\'ouverture au début d\'exercice',
      icon: BookOpen,
      category: 'miscellaneous',
      accounts: [
        { debit: { code: '101000', name: 'Capital social' }, credit: { code: '120000', name: 'Résultat de l\'exercice' } }
      ],
      example: {
        description: 'À-nouveau - Ouverture exercice 2024',
        amount: 50000.00
      }
    },
    {
      id: 'bank-charges',
      title: 'Frais bancaires',
      description: 'Prélèvement de frais bancaires',
      icon: CreditCard,
      category: 'bank',
      accounts: [
        { debit: { code: '627000', name: 'Services bancaires' }, credit: { code: '512000', name: 'Banque' } }
      ],
      example: {
        description: 'Frais bancaires janvier 2024',
        amount: 25.00
      }
    }
  ];

  const filteredTemplates = selectedCategory 
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  return (
    <div className="space-y-6">
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Assistant d'écritures comptables</AlertTitle>
        <AlertDescription>
          Sélectionnez un modèle d'écriture courante pour pré-remplir automatiquement les comptes selon les normes comptables.
          Vous pourrez ensuite ajuster les montants et descriptions.
        </AlertDescription>
      </Alert>

      {/* Catégories */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Tous les modèles
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
          >
            <cat.icon className="h-4 w-4 mr-2" />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Templates */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map(template => {
          const Icon = template.icon;
          return (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onSelectTemplate(template)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.title}</CardTitle>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm space-y-2">
                    {template.accounts.map((acc, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {acc.debit.code}
                          </Badge>
                          <span className="text-muted-foreground truncate max-w-[100px]">
                            {acc.debit.name}
                          </span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0 mx-1" />
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {acc.credit.code}
                          </Badge>
                          <span className="text-muted-foreground truncate max-w-[100px]">
                            {acc.credit.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      <Info className="h-3 w-3 inline mr-1" />
                      Exemple : {template.example.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default JournalEntryHelper;
