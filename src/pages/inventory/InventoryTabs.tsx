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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toastSuccess } from '@/lib/toast-helpers';
import {
  Factory,
  Truck,
  AlertTriangle,
  BarChart3,
  QrCode,
  PlusCircle,
  Settings,
  Download,
  Upload,
  Scan
} from 'lucide-react';
import { motion } from 'framer-motion';
interface InventoryItem {
  id: string;
  name: string;
  reference: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  location: string;
  supplier: string;
  barcode: string;
  status: 'active' | 'low_stock' | 'out_of_stock';
  totalValue: number;
  purchasePrice: number;
  sellingPrice: number;
  lastMovement?: string;
}

interface StockMovement {
  id: string;
  item_id: string;
  type: 'entry' | 'exit' | 'adjustment' | 'transfer';
  quantity: number;
  reason: string;
  created_at: string;
}

interface ComputedMetrics {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  activeItems: number;
  averageRotation: number;
  totalMovements: number;
  monthlyTurnover: number;
  profitMargin: number;
}

interface ProductionOrder {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  status: string;
  startDate: string;
  expectedDate: string;
  priority: string;
  components: Array<{
    itemId: string;
    itemName: string;
    needed: number;
    allocated: number;
    available: number;
  }>;
  cost: number;
  responsible: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  paymentTerms: string;
  deliveryTime: string;
  minOrder: number;
  discount: number;
  lastOrder: string;
  totalOrders: number;
  totalAmount: number;
}

interface InventoryTabsProps {
  inventoryItems: InventoryItem[];
  stockMovements: StockMovement[];
  computedMetrics: ComputedMetrics;
  mockProductionOrders: ProductionOrder[];
  mockSuppliers: Supplier[];
  onNewSupplier: () => void;
  onStockMovement: (itemId: string, type: 'entry' | 'exit', quantity: number, reason: string) => void;
}

export function ProductionTab({ mockProductionOrders }: { mockProductionOrders: ProductionOrder[] }) {

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Factory className="text-purple-500" />
              Ordres de Production
            </CardTitle>
            <CardDescription>Gestion de la production et assemblage</CardDescription>
          </div>
          <Button onClick={() => toastSuccess("Interface à implémenter")}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouvel ordre
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mockProductionOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{order.productName}</h3>
                  <p className="text-sm text-muted-foreground">{order.description}</p>
                  <p className="text-xs text-muted-foreground">Responsable: {order.responsible}</p>
                </div>
                <div className="text-right">
                  <Badge variant={order.status === 'in_progress' ? 'default' : order.status === 'completed' ? 'secondary' : 'outline'}>
                    {order.status === 'in_progress' ? 'En cours' : order.status === 'completed' ? 'Terminé' : 'En attente'}
                  </Badge>
                  <p className="text-sm font-medium mt-1">Qté: {order.quantity}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Dates</h4>
                  <div className="space-y-1 text-sm">
                    <p>Début: {order.startDate}</p>
                    <p>Fin prévue: {order.expectedDate}</p>
                    <Badge variant={order.priority === 'high' ? 'destructive' : order.priority === 'medium' ? 'secondary' : 'outline'} className="text-xs">
                      Priorité {order.priority === 'high' ? 'haute' : order.priority === 'medium' ? 'moyenne' : 'basse'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Coût estimé</h4>
                  <p className="text-lg font-bold text-green-600">€{order.cost.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-3">Composants requis</h4>
                <div className="space-y-2">
                  {order.components.map((component, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{component.itemName}</p>
                        <p className="text-sm text-muted-foreground">Requis: {component.needed} | Alloué: {component.allocated}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Disponible: {component.available}</p>
                        <Progress
                          value={(component.allocated / component.needed) * 100}
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SuppliersTab({ mockSuppliers, onNewSupplier }: { mockSuppliers: Supplier[]; onNewSupplier: () => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="text-green-500" />
              Gestion des Fournisseurs
            </CardTitle>
            <CardDescription>Carnet d'adresses et relations fournisseurs</CardDescription>
          </div>
          <Button onClick={onNewSupplier}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouveau fournisseur
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockSuppliers.map((supplier) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                  {supplier.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold">{supplier.name}</h3>
                  <p className="text-sm text-muted-foreground">{supplier.category}</p>
                  <p className="text-xs text-muted-foreground">{supplier.email} • {supplier.phone}</p>
                  <p className="text-xs text-muted-foreground">{supplier.address}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className={`w-3 h-3 rounded-full ${star <= supplier.rating ? 'bg-yellow-400' : 'bg-gray-300'}`} />
                  ))}
                  <span className="text-sm ml-1">{supplier.rating}/5</span>
                </div>
                <p className="text-sm font-medium">€{(supplier.totalAmount || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{supplier.totalOrders} commandes</p>
                <p className="text-xs text-muted-foreground">Paiement: {supplier.paymentTerms}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AlertsTab({ inventoryItems, onStockMovement }: { inventoryItems: InventoryItem[]; onStockMovement: (itemId: string, type: 'entry' | 'exit', quantity: number, reason: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="text-orange-500" />
          Alertes de Stock
        </CardTitle>
        <CardDescription>Surveillance des niveaux de stock critiques</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Alertes de stock faible */}
          <div className="space-y-3">
            <h3 className="font-semibold text-orange-600">Stock faible</h3>
            {inventoryItems.filter(item => item.status === 'low_stock').map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-900/20 dark:border-orange-800"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.reference}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">{item.currentStock}</p>
                  <p className="text-sm text-muted-foreground">Min: {item.minStock}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Alertes de rupture */}
          <div className="space-y-3">
            <h3 className="font-semibold text-red-600">Rupture de stock</h3>
            {inventoryItems.filter(item => item.status === 'out_of_stock').map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.reference}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">0</p>
                  <Button size="sm" onClick={() => onStockMovement(item.id, 'entry', item.minStock * 2, 'Réapprovisionnement')}>
                    Réapprovisionner
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Configuration des alertes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration des alertes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Alertes email automatiques</span>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Seuil d'alerte global</span>
                <Input type="number" placeholder="5" className="w-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportsTab({ computedMetrics, inventoryItems, stockMovements }: { computedMetrics: ComputedMetrics; inventoryItems: InventoryItem[]; stockMovements: StockMovement[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="text-purple-500" />
              Rapports d'Inventaire
            </CardTitle>
            <CardDescription>Analyses et rapports de stock</CardDescription>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Valorisation des stocks */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="font-semibold">Valeur totale</h3>
                  <p className="text-2xl font-bold text-blue-600">€{(computedMetrics.totalValue || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Coût moyen pondéré</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="font-semibold">Rotation moyenne</h3>
                  <p className="text-2xl font-bold text-green-600">{computedMetrics.averageRotation}</p>
                  <p className="text-sm text-muted-foreground">Fois par an</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="font-semibold">Marge moyenne</h3>
                  <p className="text-2xl font-bold text-purple-600">{computedMetrics.profitMargin}%</p>
                  <p className="text-sm text-muted-foreground">Sur prix de vente</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analyse ABC */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analyse ABC - Valeur des stocks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryItems
                  .sort((a, b) => b.totalValue - a.totalValue)
                  .slice(0, 5)
                  .map((item, index) => {
                    const percentage = (item.totalValue / computedMetrics.totalValue) * 100;
                    return (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${index < 2 ? 'bg-red-500' : index < 4 ? 'bg-orange-500' : 'bg-green-500'}`}>
                            {index < 2 ? 'A' : index < 4 ? 'B' : 'C'}
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.reference}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">€{item.totalValue.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </CardContent>
          </Card>

          {/* Évolution des stocks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Évolution de la valeur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end justify-center gap-2">
                {[15000, 18000, 16500, 19200, 17800, 20100, 19270].map((value, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className="w-8 bg-blue-500 rounded-t"
                      style={{ height: `${(value / 25000) * 150}px` }}
                    />
                    <span className="text-xs mt-1">S{i + 1}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

export function BarcodeTab({ inventoryItems, stockMovements }: { inventoryItems: InventoryItem[]; stockMovements: StockMovement[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="text-indigo-500" />
          Codes-barres et QR Codes
        </CardTitle>
        <CardDescription>Génération et lecture de codes-barres</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Scanner de codes-barres */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="w-48 h-48 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="text-center">
                    <Scan className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-sm text-muted-foreground">Zone de scan</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline">
                    <Scan className="h-4 w-4 mr-2" />
                    Activer caméra
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Importer image
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Générateur de codes-barres */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Générateur de codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.reference}</p>
                      <p className="text-xs text-muted-foreground">Code: {item.barcode}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="bg-black text-white p-2 rounded font-mono text-xs">
                        ||||| |||| ||||| |||||
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <QrCode className="h-4 w-4 mr-1" />
                          QR
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Traçabilité */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Traçabilité des Produits</CardTitle>
              <CardDescription>Suivi des lots et historique</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryItems.slice(0, 2).map((item) => {
                  const batchNumber = `LOT-${item.id}-${new Date().getFullYear()}`;
                  return (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">Lot: {batchNumber}</p>
                        </div>
                        <Badge variant="outline">Traçable</Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Date de réception:</span>
                          <span>{item.lastMovement}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fournisseur:</span>
                          <span>{item.supplier}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Localisation:</span>
                          <span>{item.location}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Historique des mouvements:</p>
                        <div className="space-y-1">
                          {stockMovements
                            .filter(m => m.item_id === item.id)
                            .slice(0, 3)
                            .map((movement) => (
                              <div key={movement.id} className="flex items-center gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${movement.type === 'entry' ? 'bg-green-500' : movement.type === 'exit' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                <span>{new Date(movement.created_at).toLocaleDateString()} - {movement.reason} ({movement.quantity})</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
