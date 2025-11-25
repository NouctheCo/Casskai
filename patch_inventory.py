import re

# Lire le fichier
with open('c:/Users/noutc/Casskai/src/pages/InventoryPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Ajouter les imports après les imports existants (après la ligne 57)
import_addition = '''import productionOrdersService, { ProductionOrderWithComponents } from '@/services/productionOrdersService';
import suppliersService, { SupplierWithStats } from '@/services/suppliersService';
'''

# Trouver la ligne après "import { Select..." et ajouter les nouveaux imports
content = content.replace(
    'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";',
    'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\n' + import_addition
)

# 2. Supprimer les données mock (lignes 59-144)
# Pattern pour supprimer depuis "// Les données d'inventaire..." jusqu'à "mockInventoryMetrics = {...};"
mock_pattern = r'// Les données d\'inventaire.*?mockInventoryMetrics = \{[^}]+\};'
content = re.sub(mock_pattern, '// Les données sont chargées depuis les services', content, flags=re.DOTALL)

# 3. Ajouter les states et hooks après le hook useInventory (après ligne ~168)
states_addition = '''
  // Production orders state
  const [productionOrders, setProductionOrders] = useState<ProductionOrderWithComponents[]>([]);
  const [productionLoading, setProductionLoading] = useState(false);

  // Suppliers state
  const [suppliers, setSuppliers] = useState<SupplierWithStats[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);

  // Load production orders
  useEffect(() => {
    const loadProductionOrders = async () => {
      try {
        setProductionLoading(true);
        const orders = await productionOrdersService.getProductionOrders();
        setProductionOrders(orders);
      } catch (error) {
        console.error('Error loading production orders:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les ordres de production',
          variant: 'destructive'
        });
      } finally {
        setProductionLoading(false);
      }
    };

    if (!isLoading) {
      loadProductionOrders();
    }
  }, [isLoading, toast]);

  // Load suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setSuppliersLoading(true);
        const suppliersData = await suppliersService.getSuppliers();
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('Error loading suppliers:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les fournisseurs',
          variant: 'destructive'
        });
      } finally {
        setSuppliersLoading(false);
      }
    };

    if (!isLoading) {
      loadSuppliers();
    }
  }, [isLoading, toast]);
'''

# Trouver où ajouter (après "} = useInventory();")
content = content.replace(
    '  } = useInventory();',
    '  } = useInventory();\n' + states_addition
)

# 4. Remplacer mockProductionOrders par productionOrders
content = content.replace('mockProductionOrders.map((order)', 'productionOrders.map((order)')
content = content.replace('order.productName', 'order.product_name')
content = content.replace('order.startDate', 'order.start_date')
content = content.replace('order.expectedDate', 'order.expected_date')

# 5. Remplacer mockSuppliers par suppliers
content = content.replace('mockSuppliers.map((supplier)', 'suppliers.map((supplier)')
content = content.replace('supplier.totalAmount', 'supplier.total_amount')
content = content.replace('supplier.totalOrders', 'supplier.total_orders')
content = content.replace('supplier.paymentTerms', 'supplier.payment_terms')

# Écrire le fichier modifié
with open('c:/Users/noutc/Casskai/src/pages/InventoryPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ InventoryPage.tsx modifié avec succès")
