/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ArrowUp, ArrowDown, QrCode, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

interface InventoryItem {
  id: string;
  name: string;
  reference: string;
  description: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  location: string;
  supplier: string;
  barcode: string;
  status: 'active' | 'low_stock' | 'out_of_stock';
  totalValue: number;
}

interface StockMovement {
  id: string;
  item_id: string;
  type: 'entry' | 'exit' | 'adjustment' | 'transfer';
  quantity: number;
  created_at: string;
}

interface InventoryItemDetailProps {
  selectedItem: InventoryItem | null;
  stockMovements: StockMovement[];
  onClose: () => void;
  onStockMovement: (itemId: string, type: 'entry' | 'exit', quantity: number, reason: string) => void;
}

export function InventoryItemDetail({
  selectedItem,
  stockMovements,
  onClose,
  onStockMovement,
}: InventoryItemDetailProps) {
  if (!selectedItem) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl ${selectedItem.status === 'active' ? 'bg-green-500' : selectedItem.status === 'low_stock' ? 'bg-orange-500' : 'bg-red-500'}`}>
                <Package className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
                <p className="text-muted-foreground">{selectedItem.reference} • {selectedItem.category}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              ×
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <span className="text-sm">{selectedItem.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Unité:</span>
                  <span className="text-sm">{selectedItem.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Emplacement:</span>
                  <span className="text-sm">{selectedItem.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fournisseur:</span>
                  <span className="text-sm">{selectedItem.supplier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Code-barres:</span>
                  <span className="text-sm font-mono">{selectedItem.barcode}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stock et prix</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Stock actuel:</span>
                  <span className={`text-sm font-medium ${selectedItem.status === 'active' ? 'text-green-600' : selectedItem.status === 'low_stock' ? 'text-orange-600' : 'text-red-600'}`}>{selectedItem.currentStock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Stock minimum:</span>
                  <span className="text-sm">{selectedItem.minStock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Stock maximum:</span>
                  <span className="text-sm">{selectedItem.maxStock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Prix d'achat:</span>
                  <span className="text-sm font-medium">€{selectedItem.purchasePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Prix de vente:</span>
                  <span className="text-sm font-medium">€{selectedItem.sellingPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valeur totale:</span>
                  <span className="text-sm font-bold text-blue-600">€{selectedItem.totalValue.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mouvements récents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stockMovements
                    .filter(movement => movement.item_id === selectedItem.id)
                    .slice(0, 5)
                    .map((movement) => (
                      <div key={movement.id} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${movement.type === 'entry' ? 'bg-green-500' : movement.type === 'exit' ? 'bg-red-500' : 'bg-blue-500'}`} />
                        <span className="flex-1">
                          {movement.type === 'entry' ? 'Entrée' : movement.type === 'exit' ? 'Sortie' : 'Ajust.'}
                          de {Math.abs(movement.quantity)}
                        </span>
                        <span className="text-muted-foreground">{new Date(movement.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onStockMovement(selectedItem.id, 'entry', 1, 'Ajustement manuel')}
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Ajouter au stock
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onStockMovement(selectedItem.id, 'exit', 1, 'Ajustement manuel')}
                >
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Retirer du stock
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <QrCode className="h-4 w-4 mr-2" />
                  Générer QR Code
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier l'article
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
