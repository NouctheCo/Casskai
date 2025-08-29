import React from 'react';
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { useLocale } from "@/contexts/LocaleContext";
import { Copy, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const JournalEntriesListEntryRow = ({
  entry,
  expanded,
  onToggleExpansion,
  onEdit,
  onDuplicate,
  onSetEntryToDelete,
  journals
}) => {
  const { t, formatDate, formatCurrency } = useLocale();

  // Find the journal name from the journals array
  const journalName = journals?.find(j => j.id === entry.journal_id)?.name || '';

  // Calculate total debit and credit
  const totalDebit = entry.journal_entry_items?.reduce((sum, item) => sum + parseFloat(item.debit_amount || 0), 0) || 0;
  const totalCredit = entry.journal_entry_items?.reduce((sum, item) => sum + parseFloat(item.credit_amount || 0), 0) || 0;

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50">
        <TableCell className="font-medium" onClick={() => onToggleExpansion(entry.id)}>
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {formatDate(entry.entry_date)}
          </div>
        </TableCell>
        <TableCell onClick={() => onToggleExpansion(entry.id)}>
          {journalName || entry.entry_number || '—'}
        </TableCell>
        <TableCell onClick={() => onToggleExpansion(entry.id)}>{entry.description}</TableCell>
        <TableCell onClick={() => onToggleExpansion(entry.id)}>{entry.reference_number || '—'}</TableCell>
        <TableCell className="text-right" onClick={() => onToggleExpansion(entry.id)}>
          {formatCurrency(totalDebit)}
        </TableCell>
        <TableCell className="text-right" onClick={() => onToggleExpansion(entry.id)}>
          {formatCurrency(totalCredit)}
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(entry)}
              title="Edit entry"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDuplicate(entry)}
              title="Duplicate entry"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSetEntryToDelete(entry)}
              title="Delete entry"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded && entry.journal_entry_items && (
        <>
          {entry.journal_entry_items.map((item, index) => (
            <TableRow key={item.id} className="bg-muted/30">
              <TableCell colSpan={2} />
              <TableCell>
                {item.accounts?.account_number || '—'}
              </TableCell>
              <TableCell>{item.description || entry.description}</TableCell>
              <TableCell>
                {item.accounts?.name || '—'}
              </TableCell>
              <TableCell className="text-right">
                {item.debit_amount ? formatCurrency(parseFloat(item.debit_amount)) : ''}
              </TableCell>
              <TableCell className="text-right">
                {item.credit_amount ? formatCurrency(parseFloat(item.credit_amount)) : ''}
              </TableCell>
              <TableCell />
            </TableRow>
          ))}
        </>
      )}
    </>
  );
};

export default JournalEntriesListEntryRow;