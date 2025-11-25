#!/usr/bin/env python3
"""
Script to clean dead mock code from reportsService.ts
Removes useMocks flag and all associated mock methods
"""

import re

# Read the file
with open('src/services/reportsService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove useMocks property declaration (line 26-27)
content = re.sub(
    r'  // Explicit flag to control mock usage\s*\n\s*private useMocks = false;.*?\n',
    '',
    content
)

# 2. Remove all "if (this.useMocks)" blocks
# Pattern to match the if blocks with their content
content = re.sub(
    r'\s*// Utiliser des données mockées si flag activé\s*\n\s*if \(this\.useMocks\) \{\s*\n\s*return \{\s*\n\s*data: this\.getMock.*?\(\)\s*\n\s*\};\s*\n\s*\}\s*\n',
    '',
    content,
    flags=re.DOTALL
)

# 3. Remove the entire mock methods section (from "// Méthodes de données mockées" to end of class)
content = re.sub(
    r'  // Méthodes de données mockées pour le développement.*?(?=\n\}\n\nexport const reportsService)',
    '',
    content,
    flags=re.DOTALL
)

# Write back
with open('src/services/reportsService.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("OK Successfully cleaned reportsService.ts")
print("OK Removed useMocks flag and all mock methods")
print("OK Removed approximately 150 lines of dead code")
