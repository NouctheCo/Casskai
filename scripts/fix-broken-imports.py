#!/usr/bin/env python3
"""
Script pour corriger les imports du logger mal insérés
"""

import os
import re
from pathlib import Path

SRC_DIR = Path(__file__).parent.parent / 'src'
files_fixed = 0

def fix_imports(file_path):
    """Corrige les imports dans un fichier"""
    global files_fixed

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Check if this file has broken logger import
        has_broken_import = (
            "import { logger } from '@/utils/logger';" in content and
            ("import {\nimport { logger }" in content or
             "import {  \nimport { logger }" in content or
             re.search(r'import\s+[^;]+,?\s*\{\s*\nimport\s+\{\s*logger\s*\}', content))
        )

        if not has_broken_import:
            return

        # Remove ALL occurrences of logger import (we'll add it back correctly)
        content = re.sub(
            r"^import\s*\{\s*logger\s*\}\s*from\s*['\"]@/utils/logger['\"]\s*;?\s*\n?",
            "",
            content,
            flags=re.MULTILINE
        )

        # Find the last import statement
        lines = content.split('\n')
        last_import_idx = -1
        in_multiline_import = False

        for i, line in enumerate(lines):
            stripped = line.strip()

            # Track multiline imports
            if stripped.startswith('import ') and '{' in line and '}' not in line:
                in_multiline_import = True
            if in_multiline_import and '}' in line:
                in_multiline_import = False
                last_import_idx = i
            elif stripped.startswith('import ') and not stripped.startswith('import type'):
                last_import_idx = i

        # Insert logger import after last import
        if last_import_idx >= 0:
            lines.insert(last_import_idx + 1, "import { logger } from '@/utils/logger';")
        else:
            # No imports found, add at the beginning after any comments
            first_code_line = 0
            for i, line in enumerate(lines):
                if not line.strip().startswith('//') and not line.strip().startswith('/*') and line.strip():
                    first_code_line = i
                    break
            lines.insert(first_code_line, "import { logger } from '@/utils/logger';")

        content = '\n'.join(lines)

        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            files_fixed += 1
            print(f"Fixed: {file_path.relative_to(SRC_DIR)}")

    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def walk_directory(directory):
    """Parcourt récursivement un répertoire"""
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                file_path = Path(root) / file
                fix_imports(file_path)

def main():
    print('\nCorrection des imports logger mal places\n')
    walk_directory(SRC_DIR)
    print(f'\n{files_fixed} fichier(s) corrige(s)\n')

if __name__ == '__main__':
    main()
