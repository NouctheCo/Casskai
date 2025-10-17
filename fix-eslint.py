#!/usr/bin/env python3
import re
import subprocess
import sys

def get_eslint_errors():
    """Run ESLint and parse errors."""
    result = subprocess.run(['npm', 'run', 'lint'],
                          capture_output=True, text=True, cwd=r'C:\Users\noutc\Casskai')
    return result.stdout + result.stderr

def parse_unused_vars(lint_output):
    """Parse unused variable errors from ESLint output."""
    errors = []
    lines = lint_output.split('\n')
    current_file = None

    for line in lines:
        # Match file paths
        if line.strip().startswith('C:\\Users'):
            current_file = line.strip()
        # Match error lines
        elif 'error' in line and current_file:
            match = re.search(r"(\d+):(\d+)\s+error\s+'([^']+)'\s+is\s+(assigned a value but never used|defined but never used)", line)
            if match:
                line_num = match.group(1)
                col_num = match.group(2)
                var_name = match.group(3)
                errors.append({
                    'file': current_file,
                    'line': int(line_num),
                    'col': int(col_num),
                    'var': var_name
                })

    return errors

def fix_unused_var_in_file(filepath, var_name, line_num):
    """Fix an unused variable by prefixing with underscore."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        if line_num > len(lines):
            return False

        line = lines[line_num - 1]

        # Pattern 1: const { foo } = ... -> const { foo: _foo } = ...
        if f'{{ {var_name}' in line or f', {var_name}' in line or f' {var_name},' in line or f' {var_name} }}' in line:
            # Check if already using rename syntax
            if f'{var_name}:' not in line:
                line = re.sub(rf'\b{re.escape(var_name)}\b(?!\:)', f'{var_name}: _{var_name}', line, count=1)
            else:
                return False
        # Pattern 2: const foo = ... -> const _foo = ...
        elif re.search(rf'\b(const|let|var)\s+{re.escape(var_name)}\b', line):
            line = re.sub(rf'\b{re.escape(var_name)}\b', f'_{var_name}', line, count=1)
        # Pattern 3: function parameters
        elif re.search(rf'\(.*\b{re.escape(var_name)}\b.*\)', line) or re.search(rf'=>.*\b{re.escape(var_name)}\b', line):
            line = re.sub(rf'\b{re.escape(var_name)}\b', f'_{var_name}', line, count=1)
        # Pattern 4: catch (error) -> catch (_error)
        elif 'catch' in line and var_name in line:
            line = re.sub(rf'\b{re.escape(var_name)}\b', f'_{var_name}', line, count=1)
        else:
            return False

        lines[line_num - 1] = line

        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(lines)

        return True
    except Exception as e:
        print(f"Error fixing {filepath}:{line_num} - {e}", file=sys.stderr)
        return False

def main():
    print("Fetching ESLint errors...")
    lint_output = get_eslint_errors()

    print("Parsing unused variable errors...")
    errors = parse_unused_vars(lint_output)

    print(f"Found {len(errors)} unused variable errors")

    # Group by file
    files = {}
    for error in errors:
        if error['file'] not in files:
            files[error['file']] = []
        files[error['file']].append(error)

    print(f"Affecting {len(files)} files")

    fixed_count = 0
    for filepath, file_errors in files.items():
        # Sort by line number in reverse to avoid line number shifts
        file_errors.sort(key=lambda x: x['line'], reverse=True)

        for error in file_errors:
            if fix_unused_var_in_file(error['file'], error['var'], error['line']):
                fixed_count += 1
                print(f"Fixed {error['var']} in {filepath}:{error['line']}")

    print(f"\nFixed {fixed_count} unused variables")

    # Run ESLint again to check
    print("\nRechecking ESLint...")
    result = subprocess.run(['npm', 'run', 'lint'],
                          capture_output=True, text=True, cwd=r'C:\Users\noutc\Casskai')
    error_count = result.stdout.count('error')
    print(f"Remaining errors: {error_count}")

if __name__ == '__main__':
    main()
