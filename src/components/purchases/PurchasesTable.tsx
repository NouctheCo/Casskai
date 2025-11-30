import React from 'react';
import { Purchase } from '../../types/purchase.types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Edit2, Trash2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PurchasesTableProps {
  purchases: Purchase[];
  loading: boolean;
  onEdit: (purchase: Purchase) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
}

const PurchasesTable: React.FC<PurchasesTableProps> = ({
  purchases,
  loading,
  onEdit,
  onDelete,
  onMarkAsPaid
}) => {
  const { t } = useTranslation();

  const getPaymentStatusBadge = (status: Purchase['payment_status']) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('purchases.status.paid')}
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {t('purchases.status.overdue')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
            <Clock className="w-3 h-3 mr-1" />
            {t('purchases.status.pending')}
          </Badge>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (purchases.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">{t('purchases.noPurchases')}</p>
            <p className="text-sm mt-2">{t('purchases.noPurchasesDescription')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('purchases.table.invoiceNumber')}</TableHead>
                <TableHead>{t('purchases.table.date')}</TableHead>
                <TableHead>{t('purchases.table.supplier')}</TableHead>
                <TableHead>{t('purchases.table.description')}</TableHead>
                <TableHead className="text-right">{t('purchases.table.amountHT')}</TableHead>
                <TableHead className="text-right">{t('purchases.table.amountTTC')}</TableHead>
                <TableHead>{t('purchases.table.status')}</TableHead>
                <TableHead>{t('purchases.table.dueDate')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id} className="hover:bg-gray-50 dark:bg-gray-900/30">
                  <TableCell className="font-medium">
                    {purchase.invoice_number}
                  </TableCell>
                  <TableCell>
                    {formatDate(purchase.purchase_date)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{purchase.supplier_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={purchase.description}>
                      {purchase.description}
                    </p>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(purchase.amount_ht)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(purchase.amount_ttc)}
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(purchase.payment_status)}
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${
                      purchase.payment_status === 'overdue' 
                        ? 'text-red-600 font-medium' 
                        : 'text-gray-600'
                    }`}>
                      {formatDate(purchase.due_date)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {purchase.payment_status !== 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onMarkAsPaid(purchase.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:bg-green-900/20 dark:text-green-400"
                          title={t('purchases.actions.markAsPaid')}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(purchase)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
                        title={t('common.edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(purchase.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:bg-red-900/20 dark:text-red-400"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchasesTable;
