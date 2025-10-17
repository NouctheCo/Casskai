#!/usr/bin/env python3
"""
Script pour corriger les variables non utilisees en les prefixant avec _
"""

import re
from pathlib import Path
import sys

SRC_DIR = Path(__file__).parent.parent / 'src'
files_fixed = 0
vars_fixed = 0

# Patterns courants de variables non utilisees
COMMON_UNUSED_PATTERNS = [
    # Destructuring
    (r'\b(const|let)\s+\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*,', r'\1 { _\2,'),
    (r',\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}', r', _\1 }'),

    # Function parameters
    (r'\(([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'(_\1:'),
    (r',\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r', _\1:'),

    # Arrow functions
    (r'=>\s*\(([a-zA-Z_][a-zA-Z0-9_]*)\)', r'=> (_\1)'),
]

def should_prefix_with_underscore(var_name, context):
    """Determine si une variable devrait etre prefixee avec _"""

    # Deja prefixee
    if var_name.startswith('_'):
        return False

    # Variables couramment non utilisees intentionnellement
    unused_intent_names = {
        'error', 'err', 'e',
        'data', 'result', 'response',
        'props', 'state', 'context',
        'event', 'evt', 'e',
        'index', 'i', 'j', 'k',
        'key', 'value', 'item',
        'prev', 'next', 'current',
        'params', 'options', 'config',
    }

    return var_name in unused_intent_names or len(var_name) <= 3

def fix_unused_vars(file_path):
    """Corrige les variables non utilisees dans un fichier"""
    global files_fixed, vars_fixed

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        file_vars_fixed = 0

        # Patterns specifiques a corriger

        # 1. Destructuring avec variables non utilisees
        # const { unused, used } = obj  ->  const { _unused, used } = obj
        pattern = r'const\s+\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*,'
        matches = re.finditer(pattern, content)
        for match in matches:
            var_name = match.group(1)
            if not var_name.startswith('_'):
                old_text = match.group(0)
                new_text = f'const {{ _{var_name},'
                content = content.replace(old_text, new_text, 1)
                file_vars_fixed += 1

        # 2. Parametres de fonction non utilises
        # function foo(unused: string) -> function foo(_unused: string)
        pattern = r'\(([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*'
        # Ne remplacer que si le parametre est simple et en debut de liste

        # 3. Variables catch non utilisees
        # catch (error) -> catch (_error)
        pattern = r'catch\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)'
        matches = re.finditer(pattern, content)
        for match in matches:
            var_name = match.group(1)
            if not var_name.startswith('_') and var_name in ['error', 'err', 'e']:
                old_text = match.group(0)
                new_text = f'catch (_{var_name})'
                content = content.replace(old_text, new_text, 1)
                file_vars_fixed += 1

        # 4. Variables de boucle non utilisees
        # .map((item, index) => ...) -> .map((item, _index) => ...)
        pattern = r'\(([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*)\)\s*=>'
        matches = list(re.finditer(pattern, content))
        for match in reversed(matches):  # Reverse pour eviter les problemes d'offset
            var1, var2 = match.group(1), match.group(2)
            # Si c'est index/i/j/k, prefixer
            if var2 in ['index', 'i', 'j', 'k'] and not var2.startswith('_'):
                old_text = match.group(0)
                new_text = f'({var1}, _{var2}) =>'
                content = content.replace(old_text, new_text, 1)
                file_vars_fixed += 1

        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            files_fixed += 1
            vars_fixed += file_vars_fixed
            print(f"Fixed {file_vars_fixed} vars in: {file_path.relative_to(SRC_DIR)}")

    except Exception as e:
        print(f"Error processing {file_path}: {e}", file=sys.stderr)

def walk_directory(directory):
    """Parcourt recursivement un repertoire"""
    for path in directory.rglob('*.ts'):
        fix_unused_vars(path)
    for path in directory.rglob('*.tsx'):
        fix_unused_vars(path)

def main():
    print("\nCorrection des variables non utilisees\n")
    walk_directory(SRC_DIR)
    print(f"\n{files_fixed} fichiers corriges")
    print(f"{vars_fixed} variables prefixees avec _\n")

if __name__ == '__main__':
    main()
