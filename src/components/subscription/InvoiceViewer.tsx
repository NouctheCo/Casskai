import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'draft';
  created_at: string;
  due_date?: string;
  pdf_url?: string;
  hosted_invoice_url?: string;
  description?: string;
}

export function InvoiceViewer() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Récupérer les factures depuis Supabase (nous pourrions avoir une table invoices)
      // Pour l'instant, on simule avec des données de test
      const mockInvoices: Invoice[] = [
        {
          id: 'inv_001',
          invoice_number: 'INV-2024-001',
          amount: 29.99,
          currency: 'EUR',
          status: 'paid',
          created_at: '2024-01-15T10:00:00Z',
          due_date: '2024-01-22T10:00:00Z',
          pdf_url: '#',
          hosted_invoice_url: '#',
          description: 'Abonnement Premium - Janvier 2024'
        },
        {
          id: 'inv_002',
          invoice_number: 'INV-2024-002',
          amount: 29.99,
          currency: 'EUR',
          status: 'paid',
          created_at: '2024-02-15T10:00:00Z',
          due_date: '2024-02-22T10:00:00Z',
          pdf_url: '#',
          hosted_invoice_url: '#',
          description: 'Abonnement Premium - Février 2024'
        }
      ];

      // TODO: Remplacer par une vraie requête Supabase quand la table invoices sera créée
      // const { data, error } = await supabase
      //   .from('invoices')
      //   .select('*')
      //   .eq('user_id', user.id)
      //   .order('created_at', { ascending: false });

      setInvoices(mockInvoices);
    } catch (err) {
      console.error('Erreur lors du chargement des factures:', err);
      setError('Impossible de charger les factures');
      showToast('Erreur lors du chargement des factures', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      if (invoice.pdf_url && invoice.pdf_url !== '#') {
        window.open(invoice.pdf_url, '_blank');
      } else {
        showToast('PDF non disponible pour cette facture', 'warning');
      }
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      showToast('Erreur lors du téléchargement de la facture', 'error');
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      if (invoice.hosted_invoice_url && invoice.hosted_invoice_url !== '#') {
        window.open(invoice.hosted_invoice_url, '_blank');
      } else {
        showToast('Facture non disponible en ligne', 'warning');
      }
    } catch (err) {
      console.error('Erreur lors de l\'ouverture:', err);
      showToast('Erreur lors de l\'ouverture de la facture', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500">Payée</Badge>;
      case 'open':
        return <Badge variant="secondary">En attente</Badge>;
      case 'void':
        return <Badge variant="destructive">Annulée</Badge>;
      case 'draft':
        return <Badge variant="outline">Brouillon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-2">Chargement des factures...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={fetchInvoices} variant="outline">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Historique de facturation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Vous n'avez pas encore de factures. Elles apparaîtront ici une fois votre abonnement activé.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>{invoice.description}</TableCell>
                    <TableCell>{formatDate(invoice.created_at)}</TableCell>
                    <TableCell>{formatAmount(invoice.amount, invoice.currency)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice)}
                          disabled={!invoice.hosted_invoice_url || invoice.hosted_invoice_url === '#'}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice)}
                          disabled={!invoice.pdf_url || invoice.pdf_url === '#'}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Informations importantes
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Les factures sont générées automatiquement à chaque renouvellement</li>
            <li>• Vous recevez un email de confirmation pour chaque paiement</li>
            <li>• Les PDFs sont disponibles 24h après le paiement</li>
            <li>• Pour toute question, contactez support@casskai.com</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}