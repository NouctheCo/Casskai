import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Archive, 
  PlusCircle, 
  Search, 
  ListFilter, 
  Package, 
  Factory, 
  MinusCircle,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Settings,
  BarChart3,
  DollarSign,
  Target,
  Clock,
  MapPin,
  Users,
  Truck,
  QrCode,
  Scan,
  Activity,
  Calculator,
  Building,
  Calendar,
  FileText,
  ShoppingCart,
  Box,
  Wrench,
  Zap,
  Filter,
  Sparkles
} from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Données mock pour l'inventaire
const mockInventoryItems = [
  {
    id: '1',
    reference: 'LAP-001',
    name: 'Ordinateur portable Dell XPS 13',
    description: 'Laptop professionnel haute performance',
    category: 'Matériel informatique',
    unit: 'Pièce',
    purchasePrice: 1200.00,
    sellingPrice: 1800.00,
    currentStock: 15,
    minStock: 5,
    maxStock: 50,
    location: 'Entrepôt A - Allée 1',
    supplier: 'Dell France',
    barcode: '123456789012',
    status: 'active',
    lastMovement: '2024-03-15',
    avgCost: 1150.00,
    totalValue: 17250.00
  },
  {
    id: '2',
    reference: 'SOU-002',
    name: 'Souris sans fil Logitech',
    description: 'Souris ergonomique sans fil',
    category: 'Accessoires',
    unit: 'Pièce',
    purchasePrice: 25.00,
    sellingPrice: 45.00,
    currentStock: 3,
    minStock: 10,
    maxStock: 100,
    location: 'Entrepôt A - Allée 2',
    supplier: 'Logitech International',
    barcode: '234567890123',
    status: 'low_stock',
    lastMovement: '2024-03-12',
    avgCost: 23.50,
    totalValue: 70.50
  },
  {
    id: '3',
    reference: 'TAB-003',
    name: 'Table de bureau ajustable',
    description: 'Table de bureau électrique réglable en hauteur',
    category: 'Mobilier',
    unit: 'Pièce',
    purchasePrice: 450.00,
    sellingPrice: 720.00,
    currentStock: 0,
    minStock: 2,
    maxStock: 20,
    location: 'Entrepôt B - Zone C',
    supplier: 'ErgoDesk Solutions',
    barcode: '345678901234',
    status: 'out_of_stock',
    lastMovement: '2024-03-10',
    avgCost: 465.00,
    totalValue: 0.00
  },
  {
    id: '4',
    reference: 'RAM-004',
    name: 'Barrette RAM DDR4 16GB',
    description: 'Mémoire vive DDR4 16GB 3200MHz',
    category: 'Composants',
    unit: 'Pièce',
    purchasePrice: 80.00,
    sellingPrice: 130.00,
    currentStock: 25,
    minStock: 15,
    maxStock: 100,
    location: 'Entrepôt A - Allée 1',
    supplier: 'Corsair Memory',
    barcode: '456789012345',
    status: 'active',
    lastMovement: '2024-03-14',
    avgCost: 78.00,
    totalValue: 1950.00
  }
];

// Données mock pour les mouvements de stock
const mockStockMovements = [
  {
    id: '1',
    itemId: '1',
    itemName: 'Ordinateur portable Dell XPS 13',
    type: 'entry',
    quantity: 10,
    unitPrice: 1200.00,
    totalValue: 12000.00,
    reason: 'Achat fournisseur',
    date: '2024-03-15',
    time: '10:30',
    user: 'Marie Dubois',
    supplier: 'Dell France',
    document: 'FAC-2024-001',
    location: 'Entrepôt A - Allée 1'
  },
  {
    id: '2',
    itemId: '2',
    itemName: 'Souris sans fil Logitech',
    type: 'exit',
    quantity: 5,
    unitPrice: 25.00,
    totalValue: 125.00,
    reason: 'Vente client',
    date: '2024-03-14',
    time: '14:15',
    user: 'Pierre Martin',
    customer: 'Entreprise ABC',
    document: 'CMD-2024-015',
    location: 'Entrepôt A - Allée 2'
  },
  {
    id: '3',
    itemId: '4',
    itemName: 'Barrette RAM DDR4 16GB',
    type: 'adjustment',
    quantity: -2,
    unitPrice: 80.00,
    totalValue: -160.00,
    reason: 'Inventaire physique',
    date: '2024-03-13',
    time: '16:45',
    user: 'Sophie Bernard',
    document: 'INV-2024-003',
    location: 'Entrepôt A - Allée 1'
  }
];

// Données mock pour la production
const mockProductionOrders = [
  {
    id: 'PROD-001',
    productName: 'PC Bureau Complet',
    description: 'Assemblage PC avec écran et périphériques',
    quantity: 5,
    status: 'in_progress',
    startDate: '2024-03-10',
    expectedDate: '2024-03-20',
    priority: 'high',
    components: [
      { itemId: '1', itemName: 'Ordinateur portable Dell XPS 13', needed: 5, allocated: 5, available: 15 },
      { itemId: '2', itemName: 'Souris sans fil Logitech', needed: 5, allocated: 3, available: 3 },
      { itemId: '4', itemName: 'Barrette RAM DDR4 16GB', needed: 10, allocated: 10, available: 25 }
    ],
    cost: 6250.00,
    responsible: 'Pierre Martin'
  },
  {
    id: 'PROD-002',
    productName: 'Kit Bureau Ergonomique',
    description: 'Ensemble table + accessoires',
    quantity: 3,
    status: 'pending',
    startDate: '2024-03-18',
    expectedDate: '2024-03-25',
    priority: 'medium',
    components: [
      { itemId: '3', itemName: 'Table de bureau ajustable', needed: 3, allocated: 0, available: 0 },
      { itemId: '2', itemName: 'Souris sans fil Logitech', needed: 3, allocated: 0, available: 3 }
    ],
    cost: 1485.00,
    responsible: 'Sophie Bernard'
  }
];

// Données mock pour les fournisseurs
const mockSuppliers = [
  {
    id: '1',
    name: 'Dell France',
    email: 'contact@dell.fr',
    phone: '01 23 45 67 89',
    address: '123 Avenue des Champs, 75008 Paris',
    category: 'Matériel informatique',
    rating: 4.5,
    paymentTerms: '30 jours',
    deliveryTime: '5-7 jours',
    minOrder: 1000.00,
    discount: 5.0,
    lastOrder: '2024-03-15',
    totalOrders: 15,
    totalAmount: 18500.00
  },
  {
    id: '2',
    name: 'Logitech International',
    email: 'orders@logitech.com',
    phone: '04 56 78 90 12',
    address: '456 Route de Genève, 1000 Lausanne',
    category: 'Accessoires',
    rating: 4.2,
    paymentTerms: '45 jours',
    deliveryTime: '3-5 jours',
    minOrder: 500.00,
    discount: 3.0,
    lastOrder: '2024-03-10',
    totalOrders: 8,
    totalAmount: 3200.00
  }
];

// Métriques d'inventaire
const mockInventoryMetrics = {
  totalItems: 4,
  totalValue: 19270.50,
  lowStockItems: 1,
  outOfStockItems: 1,
  averageRotation: 2.3,
  totalMovements: 25,
  monthlyTurnover: 45600.00,
  profitMargin: 32.5
};

export default function InventoryPage() {
  const { t } = useLocale();
  const { toast } = useToast();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };
  const [activeView, setActiveView] = useState('dashboard');
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [inventoryItems, setInventoryItems] = useState(mockInventoryItems);
  const [stockMovements, setStockMovements] = useState(mockStockMovements);
  const [productionOrders, setProductionOrders] = useState(mockProductionOrders);
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  
  // États pour le formulaire article
  const [reference, setReference] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Matériel informatique');
  const [unit, setUnit] = useState('Pièce');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [location, setLocation] = useState('');
  const [supplier, setSupplier] = useState('');

  // Gestionnaires d'événements
  const handleNewArticle = () => {
    setShowArticleForm(true);
  };

  const handleBackToList = () => {
    setShowArticleForm(false);
  };

  const handleSubmitArticle = useCallback(() => {
    if (!reference.trim() || !name.trim() || !purchasePrice || !sellingPrice) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires"
      });
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      reference: reference.trim(),
      name: name.trim(),
      description: description.trim(),
      category,
      unit,
      purchasePrice: parseFloat(purchasePrice),
      sellingPrice: parseFloat(sellingPrice),
      currentStock: parseInt(initialStock) || 0,
      minStock: parseInt(minStock) || 0,
      maxStock: parseInt(minStock) * 5 || 50,
      location: location.trim(),
      supplier: supplier.trim(),
      barcode: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
      status: parseInt(initialStock) > parseInt(minStock) ? 'active' : 'low_stock',
      lastMovement: new Date().toISOString().split('T')[0],
      avgCost: parseFloat(purchasePrice),
      totalValue: (parseInt(initialStock) || 0) * parseFloat(purchasePrice)
    };

    setInventoryItems(prev => [...prev, newItem]);
    
    // Créer un mouvement d'entrée initial
    if (parseInt(initialStock) > 0) {
      const initialMovement = {
        id: Date.now().toString(),
        itemId: newItem.id,
        itemName: newItem.name,
        type: 'entry',
        quantity: parseInt(initialStock),
        unitPrice: parseFloat(purchasePrice),
        totalValue: parseInt(initialStock) * parseFloat(purchasePrice),
        reason: 'Stock initial',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString().slice(0, 5),
        user: 'Système',
        document: 'INIT-' + newItem.id,
        location: newItem.location
      };
      setStockMovements(prev => [initialMovement, ...prev]);
    }
    
    // Réinitialiser le formulaire
    setReference('');
    setName('');
    setDescription('');
    setCategory('Matériel informatique');
    setUnit('Pièce');
    setPurchasePrice('');
    setSellingPrice('');
    setInitialStock('');
    setMinStock('');
    setLocation('');
    setSupplier('');
    
    toast({
      title: "Succès",
      description: "Article ajouté avec succès"
    });
    setShowArticleForm(false);
  }, [reference, name, description, category, unit, purchasePrice, sellingPrice, initialStock, minStock, location, supplier, toast]);

  const handleStockMovement = useCallback((itemId, type, quantity, reason) => {
    const item = inventoryItems.find(i => i.id === itemId);
    if (!item) return;

    const movement = {
      id: Date.now().toString(),
      itemId,
      itemName: item.name,
      type,
      quantity: type === 'exit' ? -Math.abs(quantity) : Math.abs(quantity),
      unitPrice: item.avgCost,
      totalValue: (type === 'exit' ? -Math.abs(quantity) : Math.abs(quantity)) * item.avgCost,
      reason,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString().slice(0, 5),
      user: 'Utilisateur',
      document: `MOV-${Date.now()}`,
      location: item.location
    };

    setStockMovements(prev => [movement, ...prev]);
    
    // Mettre à jour le stock
    setInventoryItems(prev => prev.map(i => {
      if (i.id === itemId) {
        const newStock = i.currentStock + (type === 'exit' ? -Math.abs(quantity) : Math.abs(quantity));
        const newStatus = newStock <= 0 ? 'out_of_stock' : newStock <= i.minStock ? 'low_stock' : 'active';
        return {
          ...i,
          currentStock: Math.max(0, newStock),
          status: newStatus,
          lastMovement: new Date().toISOString().split('T')[0],
          totalValue: Math.max(0, newStock) * i.avgCost
        };
      }
      return i;
    }));

    toast({
      title: "Mouvement enregistré",
      description: `${type === 'exit' ? 'Sortie' : 'Entrée'} de ${Math.abs(quantity)} ${item.unit.toLowerCase()}(s) pour ${item.name}`
    });
  }, [inventoryItems, toast]);

  // Calculs pour les métriques
  const metrics = useMemo(() => {
    const totalValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockItems = inventoryItems.filter(item => item.status === 'low_stock').length;
    const outOfStockItems = inventoryItems.filter(item => item.status === 'out_of_stock').length;
    const activeItems = inventoryItems.filter(item => item.status === 'active').length;
    
    return {
      ...mockInventoryMetrics,
      totalItems: inventoryItems.length,
      totalValue,
      lowStockItems,
      outOfStockItems,
      activeItems
    };
  }, [inventoryItems]);

  return (
    <motion.div 
      className="space-y-8 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Enhanced Header with filters */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0"
        variants={itemVariants}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('inventory')}
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-gray-600 dark:text-gray-400">
              {t('inventorypage.grez_vos_stocks_de_marchandises_et_suivi_de_production', { defaultValue: 'Gérez vos stocks de marchandises et suivi de production.' })}
            </p>
            <Badge variant="secondary" className="text-xs">
              En temps réel
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" onClick={handleNewArticle}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('inventorypage.nouvel_article', { defaultValue: 'Nouvel Article' })}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <MinusCircle className="h-4 w-4 mr-2" />
              Sortie de Stock
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {showArticleForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('inventorypage.nouvel_article', { defaultValue: 'Nouvel Article' })}</CardTitle>
            <CardDescription>{t('inventorypage.ajoutez_un_nouvel_article_votre_stock', { defaultValue: 'Ajoutez un nouvel article à votre stock' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="articleReference" className="text-sm font-medium">{t('inventorypage.rfrence', { defaultValue: 'Référence' })}</label>
                <Input 
                  id="articleReference" 
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={t('inventorypage.ref001', { defaultValue: 'REF-001' })} 
                />
              </div>
              <div>
                <label htmlFor="articleName" className="text-sm font-medium">{t('inventorypage.nom_de_larticle', { defaultValue: 'Nom de l\'article' })}</label>
                <Input 
                  id="articleName" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('inventorypage.ordinateur_portable_dell', { defaultValue: 'Ordinateur portable Dell' })} 
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="articleDescription" className="text-sm font-medium">{t('inventorypage.description', { defaultValue: 'Description' })}</label>
              <textarea 
                id="articleDescription" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                rows="2" 
                placeholder={t('inventorypage.description', { defaultValue: 'Description' }) + ' détaillée de l\'article'}
              ></textarea>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label htmlFor="articleCategory" className="text-sm font-medium">{t('inventorypage.catgorie', { defaultValue: 'Catégorie' })}</label>
                <select 
                  id="articleCategory" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white dark:bg-gray-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option>{t('inventorypage.matriel_informatique', { defaultValue: 'Matériel informatique' })}</option>
                  <option>{t('inventorypage.fournitures_bureau', { defaultValue: 'Fournitures bureau' })}</option>
                  <option>{t('inventorypage.marchandises', { defaultValue: 'Marchandises' })}</option>
                  <option>{t('inventorypage.matires_premires', { defaultValue: 'Matières premières' })}</option>
                </select>
              </div>
              <div>
                <label htmlFor="articlePurchasePrice" className="text-sm font-medium">{t('inventorypage.prix_dachat_', { defaultValue: 'Prix d\'achat (€)' })}</label>
                <Input 
                  id="articlePurchasePrice" 
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder={t('inventorypage.80000', { defaultValue: '800.00' })} 
                  type="number" 
                  step="0.01" 
                />
              </div>
              <div>
                <label htmlFor="articleSellingPrice" className="text-sm font-medium">{t('inventorypage.prix_de_vente_', { defaultValue: 'Prix de vente (€)' })}</label>
                <Input 
                  id="articleSellingPrice" 
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder={t('inventorypage.120000', { defaultValue: '1200.00' })} 
                  type="number" 
                  step="0.01" 
                />
              </div>
              <div>
                <label htmlFor="articleUnit" className="text-sm font-medium">{t('inventorypage.unit', { defaultValue: 'Unité' })}</label>
                <select 
                  id="articleUnit" 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white dark:bg-gray-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option>{t('inventorypage.pice', { defaultValue: 'Pièce' })}</option>
                  <option>{t('inventorypage.kg', { defaultValue: 'Kg' })}</option>
                  <option>{t('inventorypage.mtre', { defaultValue: 'Mètre' })}</option>
                  <option>{t('inventorypage.litre', { defaultValue: 'Litre' })}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="articleInitialStock" className="text-sm font-medium">{t('inventorypage.stock_initial', { defaultValue: 'Stock initial' })}</label>
                <Input 
                  id="articleInitialStock" 
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  placeholder="10" 
                  type="number" 
                />
              </div>
              <div>
                <label htmlFor="articleMinStock" className="text-sm font-medium">{t('inventorypage.stock_minimum', { defaultValue: 'Stock minimum' })}</label>
                <Input 
                  id="articleMinStock" 
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="2" 
                  type="number" 
                />
              </div>
              <div>
                <label htmlFor="articleLocation" className="text-sm font-medium">{t('inventorypage.emplacement', { defaultValue: 'Emplacement' })}</label>
                <Input 
                  id="articleLocation" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('inventorypage.entrept_alle_3', { defaultValue: 'Entrepôt A - Allée 3' })} 
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleBackToList} variant="outline">{t('inventorypage.annuler', { defaultValue: 'Annuler' })}</Button>
              <Button onClick={handleSubmitArticle}>{t('inventorypage.ajouter_larticle', { defaultValue: 'Ajouter l\'article' })}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <CardTitle>{t('inventorypage.articles_en_stock', { defaultValue: 'Articles en Stock' })}</CardTitle>
              <CardDescription>{t('inventorypage.consultez_et_grez_vos_articles_et_mouvements_de_stock', { defaultValue: 'Consultez et gérez vos articles et mouvements de stock.' })}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder={t('inventorypage.rechercher_article', { defaultValue: 'Rechercher article...' })} className="pl-8 w-full md:w-[250px]" />
              </div>
              <Button variant="outline" size="icon"><ListFilter className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Archive className="mx-auto h-16 w-16 text-primary/50" />
            <p className="mt-4 text-lg text-muted-foreground">{t('inventorypage.aucun_article_en_stock', { defaultValue: 'Aucun article en stock' })}</p>
            <p className="text-sm text-muted-foreground mb-4">{t('inventorypage.commencez_par_ajouter_votre_premier_article', { defaultValue: 'Commencez par ajouter votre premier article' })}</p>
            <Button onClick={handleNewArticle}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Premier article
            </Button>
          </div>
        </CardContent>
      </Card>
    )}
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="inventory">Inventaire</TabsTrigger>
            <TabsTrigger value="movements">Mouvements</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
            <TabsTrigger value="alerts">Alertes</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
            <TabsTrigger value="barcode">Codes-barres</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Tableau de bord avec métriques */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Box className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Articles total</span>
                  </div>
                  <div className="text-2xl font-bold">{metrics.totalItems}</div>
                  <p className="text-xs text-muted-foreground">{metrics.activeItems} actifs</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Valeur totale</span>
                  </div>
                  <div className="text-2xl font-bold">€{metrics.totalValue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Inventaire valorisé</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Stock faible</span>
                  </div>
                  <div className="text-2xl font-bold">{metrics.lowStockItems}</div>
                  <p className="text-xs text-muted-foreground">Articles à réapprovisionner</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Rupture</span>
                  </div>
                  <div className="text-2xl font-bold">{metrics.outOfStockItems}</div>
                  <p className="text-xs text-muted-foreground">Articles en rupture</p>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques et alertes */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par catégorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Matériel informatique', 'Accessoires', 'Mobilier', 'Composants'].map((cat) => {
                      const count = inventoryItems.filter(item => item.category === cat).length;
                      const percentage = inventoryItems.length > 0 ? (count / inventoryItems.length) * 100 : 0;
                      return (
                        <div key={cat} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{cat}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="w-20 h-2" />
                            <span className="text-sm text-muted-foreground">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Mouvements récents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stockMovements.slice(0, 5).map((movement) => (
                      <div key={movement.id} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          movement.type === 'entry' ? 'bg-green-500' :
                          movement.type === 'exit' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{movement.itemName}</p>
                          <p className="text-xs text-muted-foreground">
                            {movement.type === 'entry' ? 'Entrée' : movement.type === 'exit' ? 'Sortie' : 'Ajustement'} 
                            de {Math.abs(movement.quantity)} - {movement.reason}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">{movement.date}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <CardTitle>Articles en Stock</CardTitle>
                    <CardDescription>Gérez votre inventaire et stocks</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-auto">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="search" placeholder="Rechercher article..." className="pl-8 w-full md:w-[250px]" />
                    </div>
                    <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {inventoryItems.length > 0 ? (
                  <div className="space-y-4">
                    {inventoryItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold ${
                            item.status === 'active' ? 'bg-green-500' :
                            item.status === 'low_stock' ? 'bg-orange-500' : 'bg-red-500'
                          }`}>
                            <Package className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.reference} • {item.category}</p>
                            <p className="text-xs text-muted-foreground">{item.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-medium">Stock</p>
                            <p className={`text-lg font-bold ${
                              item.status === 'active' ? 'text-green-600' :
                              item.status === 'low_stock' ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {item.currentStock}
                            </p>
                            <p className="text-xs text-muted-foreground">Min: {item.minStock}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">€{item.totalValue.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">Achat: €{item.purchasePrice}</p>
                            <p className="text-sm text-muted-foreground">Vente: €{item.sellingPrice}</p>
                          </div>
                          <Badge variant={item.status === 'active' ? 'default' : item.status === 'low_stock' ? 'secondary' : 'destructive'}>
                            {item.status === 'active' ? 'Actif' : item.status === 'low_stock' ? 'Stock faible' : 'Rupture'}
                          </Badge>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setSelectedItem(item)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleStockMovement(item.id, 'entry', 1, 'Ajustement manuel')}>
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleStockMovement(item.id, 'exit', 1, 'Ajustement manuel')}>
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Archive className="mx-auto h-16 w-16 text-primary/50" />
                    <p className="mt-4 text-lg text-muted-foreground">Aucun article en stock</p>
                    <p className="text-sm text-muted-foreground mb-4">Commencez par ajouter votre premier article</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="text-blue-500" />
                      Mouvements de Stock
                    </CardTitle>
                    <CardDescription>Historique des entrées, sorties et ajustements</CardDescription>
                  </div>
                  <Button onClick={() => toast({ title: "Nouveau mouvement", description: "Interface à implémenter" })}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nouveau mouvement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stockMovements.map((movement) => (
                    <motion.div
                      key={movement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                          movement.type === 'entry' ? 'bg-green-500' :
                          movement.type === 'exit' ? 'bg-red-500' : 'bg-blue-500'
                        }`}>
                          {movement.type === 'entry' ? <ArrowUp className="h-5 w-5" /> :
                           movement.type === 'exit' ? <ArrowDown className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold">{movement.itemName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {movement.type === 'entry' ? 'Entrée' : movement.type === 'exit' ? 'Sortie' : 'Ajustement'} 
                            de {Math.abs(movement.quantity)} - {movement.reason}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {movement.date} à {movement.time} par {movement.user}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          movement.type === 'entry' ? 'text-green-600' :
                          movement.type === 'exit' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {movement.type === 'entry' ? '+' : movement.type === 'exit' ? '-' : '±'}{Math.abs(movement.quantity)}
                        </p>
                        <p className="text-sm text-muted-foreground">€{Math.abs(movement.totalValue).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{movement.document}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="production" className="space-y-6">
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
                  <Button onClick={() => toast({ title: "Nouvel ordre", description: "Interface à implémenter" })}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nouvel ordre
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {productionOrders.map((order) => (
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
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6">
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
                  <Button onClick={() => toast({ title: "Nouveau fournisseur", description: "Interface à implémenter" })}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nouveau fournisseur
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suppliers.map((supplier) => (
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
                            <div key={star} className={`w-3 h-3 rounded-full ${
                              star <= supplier.rating ? 'bg-yellow-400' : 'bg-gray-300'
                            }`} />
                          ))}
                          <span className="text-sm ml-1">{supplier.rating}/5</span>
                        </div>
                        <p className="text-sm font-medium">€{supplier.totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{supplier.totalOrders} commandes</p>
                        <p className="text-xs text-muted-foreground">Paiement: {supplier.paymentTerms}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
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
                          <XCircle className="h-5 w-5 text-red-500" />
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.reference}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">0</p>
                          <Button size="sm" onClick={() => handleStockMovement(item.id, 'entry', item.minStock * 2, 'Réapprovisionnement')}>
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
          </TabsContent>
          <TabsContent value="reports" className="space-y-6">
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
                          <p className="text-2xl font-bold text-blue-600">€{metrics.totalValue.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Coût moyen pondéré</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold">Rotation moyenne</h3>
                          <p className="text-2xl font-bold text-green-600">{metrics.averageRotation}</p>
                          <p className="text-sm text-muted-foreground">Fois par an</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold">Marge moyenne</h3>
                          <p className="text-2xl font-bold text-purple-600">{metrics.profitMargin}%</p>
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
                            const percentage = (item.totalValue / metrics.totalValue) * 100;
                            return (
                              <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                    index < 2 ? 'bg-red-500' : index < 4 ? 'bg-orange-500' : 'bg-green-500'
                                  }`}>
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

                  {/* Intégration avec les ventes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Intégration Ventes</CardTitle>
                      <CardDescription>Liaison avec le module de vente</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Commandes en attente</h4>
                            <p className="text-2xl font-bold text-orange-600">12</p>
                            <p className="text-sm text-muted-foreground">Articles réservés</p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Ventes du mois</h4>
                            <p className="text-2xl font-bold text-green-600">€{metrics.monthlyTurnover.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold">Articles les plus vendus</h4>
                          {inventoryItems
                            .filter(item => item.status === 'active')
                            .slice(0, 3)
                            .map((item) => {
                              const salesVolume = Math.floor(Math.random() * 50) + 10;
                              return (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                  <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">Stock: {item.currentStock}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{salesVolume} vendus</p>
                                    <p className="text-sm text-muted-foreground">€{(salesVolume * item.sellingPrice).toLocaleString()}</p>
                                  </div>
                                </div>
                              );
                            })
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="barcode" className="space-y-6">
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
                        <div className="w-48 h-48 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <Scan className="h-12 w-12 mx-auto text-gray-400 mb-2" />
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
                                <div className="flex justify-between">
                                  <span>DLC/DLUO:</span>
                                  <span className="text-orange-600">Non applicable</span>
                                </div>
                              </div>
                              
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-muted-foreground mb-2">Historique des mouvements:</p>
                                <div className="space-y-1">
                                  {stockMovements
                                    .filter(m => m.itemId === item.id)
                                    .slice(0, 3)
                                    .map((movement) => (
                                      <div key={movement.id} className="flex items-center gap-2 text-xs">
                                        <div className={`w-2 h-2 rounded-full ${
                                          movement.type === 'entry' ? 'bg-green-500' : 'bg-red-500'
                                        }`} />
                                        <span>{movement.date} - {movement.reason} ({movement.quantity})</span>
                                      </div>
                                    ))
                                  }
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
          </TabsContent>
        </Tabs>
      )}

      {/* Modal de détail article */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
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
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl ${
                    selectedItem.status === 'active' ? 'bg-green-500' :
                    selectedItem.status === 'low_stock' ? 'bg-orange-500' : 'bg-red-500'
                  }`}>
                    <Package className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
                    <p className="text-muted-foreground">{selectedItem.reference} • {selectedItem.category}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)}>
                  <XCircle className="h-5 w-5" />
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
                      <span className={`text-sm font-medium ${
                        selectedItem.status === 'active' ? 'text-green-600' :
                        selectedItem.status === 'low_stock' ? 'text-orange-600' : 'text-red-600'
                      }`}>{selectedItem.currentStock}</span>
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
                        .filter(movement => movement.itemId === selectedItem.id)
                        .slice(0, 5)
                        .map((movement) => (
                          <div key={movement.id} className="flex items-center gap-2 text-sm">
                            <div className={`w-2 h-2 rounded-full ${
                              movement.type === 'entry' ? 'bg-green-500' :
                              movement.type === 'exit' ? 'bg-red-500' : 'bg-blue-500'
                            }`} />
                            <span className="flex-1">
                              {movement.type === 'entry' ? 'Entrée' : movement.type === 'exit' ? 'Sortie' : 'Ajust.'} 
                              de {Math.abs(movement.quantity)}
                            </span>
                            <span className="text-muted-foreground">{movement.date}</span>
                          </div>
                        ))
                      }
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
                      onClick={() => handleStockMovement(selectedItem.id, 'entry', 1, 'Ajustement manuel')}
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Ajouter au stock
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => handleStockMovement(selectedItem.id, 'exit', 1, 'Ajustement manuel')}
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
      )}
    </motion.div>
  );
}