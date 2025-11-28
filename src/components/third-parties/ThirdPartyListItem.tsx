import React, { useState, useEffect } from 'react';

import { Button } from "@/components/ui/button";

import { AlertDialogTrigger } from "@/components/ui/alert-dialog";

import { TableCell, TableRow } from "@/components/ui/table";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

import { useLocale } from '@/contexts/LocaleContext';

import { Edit, Trash2, Eye, FileText } from 'lucide-react';

import { useNavigate } from 'react-router-dom';



export const ThirdPartyListItem = ({ thirdParty, onEdit, onDelete, onView, formatCurrency }) => {

  const { t } = useLocale();

  const navigate = useNavigate();

  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);



  useEffect(() => {

    const handleResize = () => setIsMobileView(window.innerWidth < 768);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);

  }, []);



  const handleCreateInvoice = (e) => {

    e.stopPropagation();

    navigate('/invoicing', { state: { selectedClientId: thirdParty.id } });

  };



  if (isMobileView) {

    return (

      <Card className="mb-4 shadow-lg hover:shadow-xl transition-shadow duration-300">

        <CardHeader className="pb-2">

          <div className="flex justify-between items-start">

            <CardTitle className="text-lg gradient-text">{thirdParty.name}</CardTitle>

            <span className={`px-2 py-1 text-xs rounded-full ${thirdParty.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>

              {thirdParty.is_active ? t('active') : t('inactive')}

            </span>

          </div>

          <CardDescription className="text-sm">{thirdParty.email || t('noEmail')}</CardDescription>

        </CardHeader>

        <CardContent className="text-sm space-y-1">

          <p><strong>{t('thirdParties.phone')}:</strong> {thirdParty.phone || 'N/A'}</p>

          <p><strong>{t('thirdParties.address')}:</strong> {`${thirdParty.address || ''} ${thirdParty.city || ''}`.trim() || 'N/A'}</p>

          <p><strong>{t('thirdParties.balance')}:</strong> {formatCurrency(thirdParty.balance || 0, thirdParty.default_currency || 'EUR')}</p>

        </CardContent>

        <CardFooter className="flex justify-end gap-2 pt-2">

          <Button variant="ghost" size="icon" onClick={() => onView(thirdParty)}><Eye className="h-4 w-4" /></Button>

          <Button variant="ghost" size="icon" onClick={() => onEdit(thirdParty)}><Edit className="h-4 w-4" /></Button>

          {thirdParty.type === 'CLIENT' && (

            <Button variant="ghost" size="icon" onClick={handleCreateInvoice}><FileText className="h-4 w-4" /></Button>

          )}

          <AlertDialogTrigger asChild>

            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label="Supprimer le tiers"><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>

          </AlertDialogTrigger>

        </CardFooter>

      </Card>

    );

  }



  return (

    <TableRow>

      <TableCell className="font-medium">{thirdParty.name}</TableCell>

      <TableCell>{thirdParty.email}</TableCell>

      <TableCell>{thirdParty.phone}</TableCell>

      <TableCell>{`${thirdParty.address || ''} ${thirdParty.city || ''}`.trim()}</TableCell>

      <TableCell className="text-right">{formatCurrency(thirdParty.balance || 0, thirdParty.default_currency || 'EUR')}</TableCell>

      <TableCell>

        <span className={`px-2 py-1 text-xs rounded-full ${thirdParty.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>

          {thirdParty.is_active ? t('active') : t('inactive')}

        </span>

      </TableCell>

      <TableCell className="text-right space-x-1">

        <Button variant="ghost" size="icon" onClick={() => onView(thirdParty)} title={t('viewDetails')}><Eye className="h-4 w-4" /></Button>

        <Button variant="ghost" size="icon" onClick={() => onEdit(thirdParty)} title={t('edit')}><Edit className="h-4 w-4" /></Button>

        {thirdParty.type === 'CLIENT' && (

          <Button variant="ghost" size="icon" onClick={handleCreateInvoice} title={t('addInvoice')}><FileText className="h-4 w-4" /></Button>

        )}

        <AlertDialogTrigger asChild>

          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" title={t('delete')}><Trash2 className="h-4 w-4" /></Button>

        </AlertDialogTrigger>

      </TableCell>

    </TableRow>

  );

};
