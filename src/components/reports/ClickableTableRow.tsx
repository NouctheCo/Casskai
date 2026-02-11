/**
 * CassKai - Composant Ligne de Tableau Cliquable
 * Copyright © 2025 NOUTCHE CONSEIL
 *
 * Ligne de tableau interactive avec drill-down vers écritures sources
 * P2-3: Interactive Reports Drill-down
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { DrilldownMetadata } from '@/services/ReportExportService';
import { reportDrilldownHelper } from '@/services/reportDrilldownHelper';
import { cn } from '@/lib/utils';

interface ClickableTableRowProps {
  row: any[];
  rowIndex: number;
  drilldown?: DrilldownMetadata;
  onRowClick?: (drilldown: DrilldownMetadata) => void;
  className?: string;
}

/**
 * Composant ligne de tableau avec drill-down optionnel
 *
 * Si drilldown fourni:
 * - Ligne cliquable (cursor-pointer)
 * - Hover effect (bg-blue-50)
 * - Icône chevron sur première colonne
 * - Tooltip descriptif
 * - Navigation automatique au clic
 */
export const ClickableTableRow: React.FC<ClickableTableRowProps> = ({
  row,
  rowIndex,
  drilldown,
  onRowClick,
  className
}) => {
  const navigate = useNavigate();
  const isClickable = !!drilldown;

  const handleClick = () => {
    if (!drilldown) return;

    // Construire URL de navigation
    const url = reportDrilldownHelper.buildDrilldownURL(drilldown);

    // Naviguer
    navigate(url);

    // Callback optionnel (analytics, etc.)
    if (onRowClick) {
      onRowClick(drilldown);
    }
  };

  // Déterminer si la ligne est un titre/sous-total (non cliquable)
  const firstCell = row[0]?.toString().trim();
  const secondCell = row[1]?.toString().trim();
  const isHeaderRow = !firstCell || firstCell === '' ||
                      secondCell?.startsWith('---') ||
                      secondCell?.includes('Sous-total') ||
                      secondCell?.includes('TOTAL');

  return (
    <tr
      className={cn(
        'border-b border-gray-200 transition-colors',
        isClickable && !isHeaderRow && 'cursor-pointer hover:bg-blue-50 hover:shadow-sm',
        isHeaderRow && 'font-semibold bg-gray-50',
        className
      )}
      onClick={isClickable && !isHeaderRow ? handleClick : undefined}
      title={isClickable && !isHeaderRow ? drilldown?.label : undefined}
      role={isClickable && !isHeaderRow ? 'button' : undefined}
      tabIndex={isClickable && !isHeaderRow ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && !isHeaderRow && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {row.map((cell, cellIndex) => (
        <td
          key={cellIndex}
          className={cn(
            'px-4 py-3 text-sm',
            cellIndex === 0 && 'font-medium text-gray-900',
            cellIndex > 0 && 'text-gray-700',
            cellIndex >= 2 && 'text-right' // Colonnes montants alignées à droite
          )}
        >
          {isClickable && !isHeaderRow && cellIndex === 0 ? (
            <span className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>{cell}</span>
            </span>
          ) : (
            cell
          )}
        </td>
      ))}
    </tr>
  );
};

export default ClickableTableRow;
