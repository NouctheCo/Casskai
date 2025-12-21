# Script PowerShell - Migration automatique des toasts
# Migre tous les fichiers vers toast-helpers

$files = @(
    "src/pages/BillingPage.tsx",
    "src/pages/PurchasesPage.tsx",
    "src/pages/ProjectsPage.tsx",
    "src/pages/SalesCrmPage.tsx",
    "src/pages/CookiesPolicyPage.tsx",
    "src/pages/BanksPage.tsx",
    "src/pages/InvoicingPage.tsx",
    "src/pages/DocumentationArticlePage.tsx",
    "src/pages/GDPRPage.tsx",
    "src/pages/HumanResourcesPage.tsx",
    "src/pages/inventory/InventoryTabs.tsx",
    "src/pages/projects/ProjectForm.tsx",
    "src/pages/onboarding/CompleteStep.tsx",
    "src/pages/AccountingImportPage.tsx"
)

foreach ($file in $files) {
    $path = "c:\Users\noutc\Casskai\$file"
    
    if (Test-Path $path) {
        Write-Host "📝 Migration de $file..." -ForegroundColor Cyan
        
        $content = Get-Content $path -Raw
        
        # 1. Remplacer import useToast par toast-helpers
        $content = $content -replace "import { useToast } from ['\x22]@/components/ui/use-toast['\x22];", "import { toastError, toastSuccess, toastCreated, toastUpdated, toastDeleted, toastSaved, toastCopied } from '@/lib/toast-helpers';"
        $content = $content -replace "import { useToast } from ['\x22]\.\./components/ui/use-toast['\x22];", "import { toastError, toastSuccess, toastCreated, toastUpdated, toastDeleted, toastSaved, toastCopied } from '@/lib/toast-helpers';"
        
        # 2. Supprimer const { toast } = useToast();
        $content = $content -replace "const { toast } = useToast\(\);[\r\n]+", ""
        $content = $content -replace "  const { toast } = useToast\(\);[\r\n]+", ""
        
        # 3. Patterns de remplacement toast
        # Success patterns
        $content = $content -replace "toast\(\{[\s\r\n]+title: ['\x22]([^\x22']+)['\x22],[\s\r\n]+description: ['\x22]([^\x22']+)['\x22][\s\r\n]+\}\);", "toastSuccess('`$2');"
        $content = $content -replace "toast\(\{[\s\r\n]+title: ['\x22]Succès['\x22],[\s\r\n]+description: ['\x22]([^\x22']+)['\x22][\s\r\n]+\}\);", "toastSuccess('`$1');"
        
        # Error patterns
        $content = $content -replace "toast\(\{[\s\r\n]+title: ['\x22]Erreur['\x22],[\s\r\n]+description: ['\x22]([^\x22']+)['\x22],[\s\r\n]+variant: ['\x22]destructive['\x22][\s\r\n]+\}\);", "toastError('`$1');"
        
        # Created patterns
        $content = $content -replace "toast\(\{[\s\r\n]+title: ['\x22]([^\x22']*Créé[^\x22']*)['\x22],[\s\r\n]+description: ['\x22]([^\x22']+)['\x22][\s\r\n]+\}\);", "toastCreated('`$2');"
        
        # Updated patterns
        $content = $content -replace "toast\(\{[\s\r\n]+title: ['\x22]([^\x22']*Modifié[^\x22']*|[^\x22']*Mis à jour[^\x22']*)['\x22],[\s\r\n]+description: ['\x22]([^\x22']+)['\x22][\s\r\n]+\}\);", "toastUpdated('`$2');"
        
        # Deleted patterns
        $content = $content -replace "toast\(\{[\s\r\n]+title: ['\x22]([^\x22']*Supprimé[^\x22']*)['\x22],[\s\r\n]+description: ['\x22]([^\x22']+)['\x22][\s\r\n]+\}\);", "toastDeleted('`$2');"
        
        Set-Content $path $content -NoNewline
        Write-Host "✅ $file migré" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $file introuvable" -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 Migration terminée!" -ForegroundColor Green
Write-Host "📊 Total: $($files.Count) fichiers traités" -ForegroundColor Cyan
