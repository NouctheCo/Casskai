#!/bin/bash
# Simple script to replace € symbols with CurrencyAmount component

cd "$(dirname "$0")/.."

echo "Starting currency replacement..."

# List of files from batch 1 (already identified as having € symbols)
files=(
    "src/components/accounting/FECImportTab.tsx"
    "src/components/accounting/LettragePanel.tsx"
    "src/components/accounting/OptimizedJournalsTab.tsx"
)

for file in "${files[@]}"; do
    echo "Processing $file..."

    # Add import if not present
    if ! grep -q "CurrencyAmount" "$file"; then
        # Find line number of last import
        last_import=$(grep -n "^import " "$file" | tail -1 | cut -d: -f1)
        if [ -n "$last_import" ]; then
            sed -i "${last_import}a\\import { CurrencyAmount } from '@/components/ui/CurrencyAmount';" "$file"
        fi
    fi

    # Simple replacements - we'll do this iteratively
    # For now, just replace the simplest patterns
    sed -i 's/{[^}]*\.toFixed([0-9]*)} €/<CurrencyAmount amount={FIXME} \/>/g' "$file"

    echo "Done with $file"
done

echo "Complete!"
