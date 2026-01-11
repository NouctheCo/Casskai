#!/bin/bash
# Script pour remplacer tous les symboles € par le composant CurrencyAmount ou formatAmount

set -e

cd "$(dirname "$0")/.."

echo "========================================="
echo "Starting currency symbol replacement"
echo "========================================="

# Function to add CurrencyAmount import
add_currency_import() {
    local file="$1"

    # Check if import already exists
    if ! grep -q "import { CurrencyAmount } from '@/components/ui/CurrencyAmount';" "$file"; then
        # Find the last import line
        local last_import_line=$(grep -n "^import " "$file" | tail -1 | cut -d: -f1)

        if [ -n "$last_import_line" ]; then
            # Insert after last import
            sed -i "${last_import_line}a\\import { CurrencyAmount } from '@/components/ui/CurrencyAmount';" "$file"
            echo "  ✓ Added CurrencyAmount import"
        fi
    fi
}

# Function to process a file
process_file() {
    local file="$1"

    if [ ! -f "$file" ]; then
        echo "  ⚠ File not found: $file"
        return 1
    fi

    echo "Processing: $file"

    # Count euro symbols before
    local count_before=$(grep -o "€" "$file" | wc -l || echo "0")

    if [ "$count_before" = "0" ]; then
        echo "  No € symbols found"
        return 0
    fi

    # Add import first
    add_currency_import "$file"

    # Replace patterns (using perl for better regex support on Windows Git Bash)
    # Pattern 1: {amount.toFixed(2)} € -> <CurrencyAmount amount={amount} />
    perl -i -pe 's/\{([a-zA-Z_][a-zA-Z0-9_\.]*(?:\.toFixed\(\d+\))?)\}\s*€/<CurrencyAmount amount={\1} \/>/g' "$file"

    # Pattern 2: amount.toFixed(2)} € (in template literals)
    perl -i -pe 's/(\w+)\.toFixed\(\d+\)\}\s*€/<CurrencyAmount amount={\1} \/>/g' "$file"

    # Pattern 3: Conditional expressions like entry.debit > 0 ? `${entry.debit.toFixed(2)} €` : ''
    perl -i -pe 's/(\w+)\s*>\s*0\s*\?\s*`\$\{(\w+)\.toFixed\(\d+\)\}\s*€`\s*:\s*'"'"''"'"'/\1 > 0 ? <CurrencyAmount amount={\2} \/> : '"'"''"'"'/g' "$file"

    # Count euro symbols after
    local count_after=$(grep -o "€" "$file" | wc -l || echo "0")
    local replaced=$((count_before - count_after))

    if [ "$replaced" -gt 0 ]; then
        echo "  ✓ Replaced $replaced € symbol(s)"
        return 0
    else
        echo "  ⚠ No replacements made (manual review needed)"
        return 1
    fi
}

# Batch 1 files
echo ""
echo "=== Batch 1: Accounting Components ==="
files=(
    "src/components/accounting/FECImportTab.tsx"
    "src/components/accounting/LettragePanel.tsx"
    "src/components/accounting/OptimizedJournalsTab.tsx"
    "src/components/accounting/OptimizedReportsTab.tsx"
)

total=0
success=0

for file in "${files[@]}"; do
    if process_file "$file"; then
        ((success++))
    fi
    ((total++))
done

echo ""
echo "========================================="
echo "Batch 1 Complete!"
echo "Files processed: $success/$total"
echo "========================================="
