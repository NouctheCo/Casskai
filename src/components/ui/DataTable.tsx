import React from 'react';
import { motion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

interface Column {
  key: string;
  title: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  pageSize?: number;
  showPagination?: boolean;
  sortable?: boolean;
  filterable?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  data = [],
  columns = [],
  pageSize = 5,
  showPagination = false
}) => {
  // Données d'exemple si aucune donnée fournie
  const defaultData = [
    { id: 1, name: 'Jean Dupont', amount: 1250, status: 'Payé', date: '2024-01-15' },
    { id: 2, name: 'Marie Martin', amount: 890, status: 'En attente', date: '2024-01-14' },
    { id: 3, name: 'Pierre Durand', amount: 2100, status: 'Payé', date: '2024-01-13' }
  ];

  const defaultColumns = [
    { key: 'name', title: 'Nom' },
    { key: 'amount', title: 'Montant', render: (value: number) => `${value}€` },
    { key: 'status', title: 'Statut' },
    { key: 'date', title: 'Date' }
  ];

  const tableData = data.length > 0 ? data : defaultData;
  const tableColumns = columns.length > 0 ? columns : defaultColumns;
  const displayData = tableData.slice(0, pageSize);

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            {tableColumns.map((column, index) => (
              <TableHead key={column.key} className="text-xs">
                {column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayData.map((row, rowIndex) => (
            <motion.tr
              key={row.id || rowIndex}
              className="border-b border-gray-100 dark:border-gray-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.1 }}
            >
              {tableColumns.map((column) => (
                <TableCell key={column.key} className="text-xs py-2">
                  {column.render 
                    ? column.render(row[column.key], row)
                    : row[column.key]
                  }
                </TableCell>
              ))}
            </motion.tr>
          ))}
        </TableBody>
      </Table>
      
      {tableData.length > pageSize && (
        <div className="text-xs text-gray-500 text-center">
          +{tableData.length - pageSize} autres éléments
        </div>
      )}
    </div>
  );
};

export default DataTable;