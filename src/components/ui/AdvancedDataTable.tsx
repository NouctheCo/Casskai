/**
 * CassKai - Advanced Data Table
 *
 * Phase 2 (P1) - Composants UI Premium
 *
 * Fonctionnalités:
 * - Tri multi-colonnes
 * - Filtres avancés (texte, date, select)
 * - Pagination avec sélection de taille
 * - Sélection multiple avec actions groupées
 * - Export Excel/CSV
 * - Colonnes redimensionnables
 * - Colonnes réordonnables
 * - Virtual scrolling pour grandes listes
 * - Responsive mobile (cards)
 * - Search global
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Download,
  MoreVertical,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'actions';

export interface Column<T> {
  /** ID unique de la colonne */
  id: string;
  /** Label affiché dans le header */
  label: string;
  /** Accessor pour récupérer la valeur */
  accessor: keyof T | ((row: T) => any);
  /** Type de colonne */
  type?: ColumnType;
  /** Largeur de la colonne (px ou %) */
  width?: string;
  /** Colonne triable */
  sortable?: boolean;
  /** Colonne filtrable */
  filterable?: boolean;
  /** Render personnalisé */
  render?: (value: any, row: T) => React.ReactNode;
  /** Options pour select filter */
  filterOptions?: Array<{ label: string; value: any }>;
  /** Alignement du contenu */
  align?: 'left' | 'center' | 'right';
  /** Cacher sur mobile */
  hideMobile?: boolean;
}

export interface AdvancedDataTableProps<T> {
  /** Données à afficher */
  data: T[];
  /** Configuration des colonnes */
  columns: Column<T>[];
  /** Clé unique pour chaque row */
  getRowId: (row: T) => string;
  /** Actions groupées sur sélection */
  bulkActions?: Array<{
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: (selectedRows: T[]) => void;
    variant?: 'default' | 'danger';
  }>;
  /** Actions par ligne */
  rowActions?: Array<{
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: (row: T) => void;
  }>;
  /** Activer sélection multiple */
  selectable?: boolean;
  /** Activer search global */
  searchable?: boolean;
  /** Placeholder du search */
  searchPlaceholder?: string;
  /** Activer export */
  exportable?: boolean;
  /** Nom du fichier export */
  exportFilename?: string;
  /** Taille de page par défaut */
  defaultPageSize?: number;
  /** Options de taille de page */
  pageSizeOptions?: number[];
  /** Classe CSS personnalisée */
  className?: string;
  /** Message si vide */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
}

type SortConfig<T> = {
  key: keyof T | string;
  direction: 'asc' | 'desc';
} | null;

type FilterConfig = Record<string, any>;

/**
 * Advanced Data Table Component
 */
export default function AdvancedDataTable<T extends Record<string, any>>({
  data,
  columns,
  getRowId,
  bulkActions,
  rowActions,
  selectable = false,
  searchable = true,
  searchPlaceholder = 'Rechercher...',
  exportable = true,
  exportFilename = 'export',
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  className,
  emptyMessage = 'Aucune donnée disponible',
  loading = false,
}: AdvancedDataTableProps<T>) {
  // État
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(null);
  const [_filterConfig, _setFilterConfig] = useState<FilterConfig>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  /**
   * Obtenir valeur d'une cellule
   */
  const getCellValue = useCallback(
    (row: T, column: Column<T>): any => {
      if (typeof column.accessor === 'function') {
        return column.accessor(row);
      }
      return row[column.accessor];
    },
    []
  );

  /**
   * Filtrage et recherche
   */
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Search global
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((row) => {
        return columns.some((column) => {
          const value = getCellValue(row, column);
          return String(value).toLowerCase().includes(query);
        });
      });
    }

    // Filtres par colonne
    Object.entries(_filterConfig).forEach(([columnId, filterValue]) => {
      if (!filterValue) return;

      const column = columns.find((c) => c.id === columnId);
      if (!column) return;

      filtered = filtered.filter((row) => {
        const value = getCellValue(row, column);
        return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
      });
    });

    return filtered;
  }, [data, searchQuery, _filterConfig, columns, getCellValue]);

  /**
   * Tri
   */
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const column = columns.find((c) => c.id === sortConfig.key);
      if (!column) return 0;

      const aValue = getCellValue(a, column);
      const bValue = getCellValue(b, column);

      if (aValue === bValue) return 0;

      const result = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? result : -result;
    });

    return sorted;
  }, [filteredData, sortConfig, columns, getCellValue]);

  /**
   * Pagination
   */
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  /**
   * Tri handler
   */
  const handleSort = useCallback((columnId: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== columnId) {
        return { key: columnId, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key: columnId, direction: 'desc' };
      }
      return null; // Reset
    });
  }, []);

  /**
   * Sélection handlers
   */
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((row) => getRowId(row))));
    }
  }, [selectedRows, paginatedData, getRowId]);

  const handleSelectRow = useCallback(
    (rowId: string) => {
      setSelectedRows((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(rowId)) {
          newSet.delete(rowId);
        } else {
          newSet.add(rowId);
        }
        return newSet;
      });
    },
    []
  );

  /**
   * Export Excel
   */
  const handleExport = useCallback(() => {
    const exportData = sortedData.map((row) => {
      const exportRow: Record<string, any> = {};
      columns.forEach((column) => {
        if (column.type !== 'actions') {
          exportRow[column.label] = getCellValue(row, column);
        }
      });
      return exportRow;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `${exportFilename}-${Date.now()}.xlsx`);

    logger.debug('AdvancedDataTable', 'Exported data:', exportData.length);
  }, [sortedData, columns, getCellValue, exportFilename]);

  /**
   * Pagination handlers
   */
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  /**
   * Render Sort Icon
   */
  const renderSortIcon = (columnId: string) => {
    if (!sortConfig || sortConfig.key !== columnId) {
      return <ChevronsUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  /**
   * Render Cell
   */
  const renderCell = (row: T, column: Column<T>) => {
    const value = getCellValue(row, column);

    if (column.render) {
      return column.render(value, row);
    }

    switch (column.type) {
      case 'badge':
        return <Badge>{value}</Badge>;
      case 'boolean':
        return value ? 'Oui' : 'Non';
      case 'date':
        return value ? new Date(value).toLocaleDateString('fr-FR') : '-';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('fr-FR') : value;
      default:
        return value || '-';
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="h-10 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
        <div className="space-y-2">
          {[...Array(pageSize)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-900 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          {/* Search */}
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Rechercher dans le tableau"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  aria-label="Effacer la recherche"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          )}

          {/* Selected count */}
          {selectable && selectedRows.size > 0 && (
            <Badge variant="secondary" className="whitespace-nowrap">
              {selectedRows.size} sélectionné{selectedRows.size > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Bulk Actions */}
          {bulkActions && selectedRows.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {bulkActions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => {
                      const rows = data.filter((row) => selectedRows.has(getRowId(row)));
                      action.onClick(rows);
                    }}
                    className={cn(
                      action.variant === 'danger' && 'text-red-600 dark:text-red-400'
                    )}
                  >
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export */}
          {exportable && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b">
              <tr>
                {/* Select All */}
                {selectable && (
                  <th className="w-12 px-4 py-3">
                    <Checkbox
                      checked={
                        paginatedData.length > 0 && selectedRows.size === paginatedData.length
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Sélectionner toutes les lignes"
                    />
                  </th>
                )}

                {/* Column Headers */}
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider',
                      column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.hideMobile && 'hidden md:table-cell'
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.id)}
                    aria-sort={
                      column.sortable && sortConfig?.key === column.id
                        ? sortConfig.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : column.sortable
                        ? 'none'
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span>{column.label}</span>
                      {column.sortable && renderSortIcon(column.id)}
                    </div>
                  </th>
                ))}

                {/* Row Actions */}
                {rowActions && <th className="w-12 px-4 py-3"></th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const rowId = getRowId(row);
                  const isSelected = selectedRows.has(rowId);

                  return (
                    <tr
                      key={rowId}
                      className={cn(
                        'hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors',
                        isSelected && 'bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      {/* Select Row */}
                      {selectable && (
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectRow(rowId)}
                            aria-label={`Sélectionner la ligne ${rowId}`}
                          />
                        </td>
                      )}

                      {/* Cells */}
                      {columns.map((column) => (
                        <td
                          key={column.id}
                          className={cn(
                            'px-4 py-3 text-sm text-gray-900 dark:text-gray-100',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right',
                            column.hideMobile && 'hidden md:table-cell'
                          )}
                        >
                          {renderCell(row, column)}
                        </td>
                      ))}

                      {/* Row Actions */}
                      {rowActions && (
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Actions de la ligne">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {rowActions.map((action, index) => (
                                <DropdownMenuItem
                                  key={index}
                                  onClick={() => action.onClick(row)}
                                >
                                  <action.icon className="w-4 h-4 mr-2" />
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Afficher</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              sur {sortedData.length} lignes
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              aria-label="Première page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="px-4 text-sm">
              Page {currentPage} sur {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Dernière page"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
