/**
 * CassKai - Composant Tableau de Rapport Interactif
 * Copyright © 2025 NOUTCHE CONSEIL
 *
 * Tableau financier avec drill-down vers écritures sources
 * P2-3: Interactive Reports Drill-down
 */

import React from 'react';
import type { TableData, DrilldownMetadata } from '@/services/ReportExportService';
import { reportDrilldownHelper } from '@/services/reportDrilldownHelper';
import ClickableTableRow from './ClickableTableRow';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveReportTableProps {
  tableData: TableData;
  onDrilldown?: (drilldown: DrilldownMetadata) => void;
  className?: string;
  showDrilldownHint?: boolean;
}

/**
 * Composant tableau de rapport avec support drill-down
 *
 * Features:
 * - Rendu headers
 * - Lignes cliquables (si drilldown disponible)
 * - Summary (totaux)
 * - Footer (notes)
 * - Hint drill-down (première utilisation)
 */
export const InteractiveReportTable: React.FC<InteractiveReportTableProps> = ({
  tableData,
  onDrilldown,
  className,
  showDrilldownHint = true
}) => {
  const hasDrilldowns = tableData.drilldown && tableData.drilldown.length > 0;
  const clickableRowsCount = hasDrilldowns
    ? tableData.drilldown!.length
    : 0;

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden', className)}>
      {/* Header */}
      {tableData.title && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="text-lg font-semibold text-gray-900">{tableData.title}</h3>
          {tableData.subtitle && (
            <p className="text-sm text-gray-600 mt-1">{tableData.subtitle}</p>
          )}
        </div>
      )}

      {/* Hint Drill-down */}
      {hasDrilldowns && showDrilldownHint && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium">
              💡 Rapport interactif
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Cliquez sur une ligne de compte pour voir les écritures détaillées ({clickableRowsCount} ligne(s) cliquable(s))
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Headers */}
          <thead className="bg-gray-50">
            <tr>
              {tableData.headers.map((header, index) => (
                <th
                  key={index}
                  className={cn(
                    'px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',
                    index === 0 ? 'text-left' : 'text-right'
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.rows.map((row, rowIndex) => {
              const drilldown = hasDrilldowns
                ? reportDrilldownHelper.getDrilldownForRow(rowIndex, tableData.drilldown)
                : undefined;

              return (
                <ClickableTableRow
                  key={rowIndex}
                  row={row}
                  rowIndex={rowIndex}
                  drilldown={drilldown}
                  onRowClick={onDrilldown}
                />
              );
            })}
          </tbody>

          {/* Summary */}
          {tableData.summary && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              {Array.isArray(tableData.summary) ? (
                // Summary format tableau
                tableData.summary.map((summaryRow, index) => (
                  <tr key={index} className="font-bold">
                    {summaryRow.map((cell: any, cellIndex: number) => (
                      <td
                        key={cellIndex}
                        className={cn(
                          'px-4 py-3 text-sm text-gray-900',
                          cellIndex === 0 ? 'text-left' : 'text-right'
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                // Summary format objet
                Object.entries(tableData.summary).map(([key, value], index) => (
                  <tr key={index} className="font-bold">
                    <td className="px-4 py-3 text-sm text-gray-900 text-left" colSpan={tableData.headers.length - 1}>
                      {key}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {value}
                    </td>
                  </tr>
                ))
              )}
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer */}
      {tableData.footer && tableData.footer.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {tableData.footer.map((note, index) => (
            <p key={index} className="text-xs text-gray-600 mt-1 first:mt-0">
              {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default InteractiveReportTable;
