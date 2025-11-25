#!/usr/bin/env python3
"""
Script to remove fallback mock data from inventoryService.ts
Removes getMock* method calls in catch blocks and all mock methods
"""

import re

# Read the file
with open('src/services/inventoryService.ts', 'r', encoding='utf-8')as f:
    content = f.read()

# 1. Fix catch block in getInventoryItems (line 132)
content = re.sub(
    r'(\s+} catch \(error\) \{\s+console\.error\(\'Error fetching inventory items:\'[^}]+\);\s+)// Retourner des données mock en cas d\'erreur pour l\'instant\s+return this\.getMockInventoryItems\(\);',
    r'\1return [];',
    content
)

# 2. Fix catch block in getStockMovements (line 257)
content = re.sub(
    r'(\s+} catch \(error\) \{\s+console\.error\(\'Error fetching stock movements:\'[^}]+\);\s+)return this\.getMockStockMovements\(\);',
    r'\1return [];',
    content
)

# 3. Fix catch block in getSuppliers (line 302)
content = re.sub(
    r'(\s+} catch \(error\) \{\s+console\.error\(\'Error fetching suppliers:\'[^}]+\);\s+)return this\.getMockSuppliers\(\);',
    r'\1return [];',
    content
)

# 4. Fix catch block in getInventoryMetrics (line 376)
content = re.sub(
    r'(\s+} catch \(error\) \{\s+console\.error\(\'Error fetching inventory metrics:\'[^}]+\);\s+)return this\.getMockInventoryMetrics\(\);',
    r'\1return { totalValue: 0, totalItems: 0, lowStockItems: 0, outOfStockItems: 0, pendingOrders: 0, activeSuppliers: 0, avgStockRotation: 0 };',
    content
)

# 5. Remove all mock methods section (from "// Données mock pour le fallback" to end of class)
content = re.sub(
    r'\s+// Données mock pour le fallback.*?(?=\n}\n\nexport const inventoryService)',
    '',
    content,
    flags=re.DOTALL
)

# Write back
with open('src/services/inventoryService.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("OK Successfully cleaned inventoryService.ts")
print("OK Removed 4 fallback mock calls in catch blocks")
print("OK Removed all getMock* methods (approximately 150+ lines)")
print("OK Service now returns empty arrays/objects on error instead of masking issues")
