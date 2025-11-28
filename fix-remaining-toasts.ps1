$file = "c:\Users\noutc\Casskai\src\pages\BillingPage.tsx"
$content = Get-Content $file -Raw -Encoding UTF8

# Liste des remplacements
$replacements = @(
    @{
        old = @'
toast({
        title: "Erreur inattendue",
        description: "Une erreur inattendue est survenue.",
        variant: "destructive",
      });
'@
        new = 'toastError(''Une erreur inattendue est survenue'');'
    },
    @{
        old = @'
toast({
        title: "Abonnement requis",
        description: "Vous devez avoir un abonnement actif.",
        variant: "destructive",
      });
'@
        new = 'toastError(''Vous devez avoir un abonnement actif'');'
    },
    @{
        old = @'
toast({
          title: "Erreur",
          description: result.error || "Impossible d'accéder à la gestion des paiements.",
          variant: "destructive",
        });
'@
        new = 'toastError(result.error || ''Impossible d''''accéder à la gestion des paiements'');'
    },
    @{
        old = @'
toast({
          title: "Redirection...",
          description: "Ouverture du portail de gestion des paiements",
        });
'@
        new = 'toastSuccess(''Ouverture du portail de gestion des paiements'');'
    },
    @{
        old = @'
toast({
        title: "Erreur inattendue",
        description: "Impossible d'accéder à la gestion des méthodes de paiement.",
        variant: "destructive",
      });
'@
        new = 'toastError(''Impossible d''''accéder à la gestion des méthodes de paiement'');'
    },
    @{
        old = @'
toast({
        title: "Méthode mise à jour",
        description: "Cette carte est maintenant votre méthode de paiement par défaut",
      });
'@
        new = 'toastUpdated(''Méthode de paiement par défaut'');'
    },
    @{
        old = @'
toast({
        title: "Erreur",
        description: "Impossible de définir cette méthode comme défaut",
        variant: "destructive",
      });
'@
        new = 'toastError(''Impossible de définir cette méthode comme défaut'');'
    },
    @{
        old = @'
toast({
          title: "PDF non disponible",
          description: "Le PDF de cette facture n'est pas encore disponible.",
          variant: "destructive",
        });
'@
        new = 'toastError(''Le PDF de cette facture n''''est pas encore disponible'');'
    },
    @{
        old = @'
toast({
        title: "Téléchargement...",
        description: `Téléchargement de la facture #${invoice.stripeInvoiceId.slice(-8)}`,
      });
'@
        new = 'toastSuccess(`Téléchargement de la facture #${invoice.stripeInvoiceId.slice(-8)}`);'
    },
    @{
        old = @'
toast({
          title: "PDF téléchargé",
          description: "La facture a été téléchargée avec succès.",
        });
'@
        new = 'toastSuccess(''La facture a été téléchargée avec succès'');'
    },
    @{
        old = @'
toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le PDF de cette facture.",
        variant: "destructive",
      });
'@
        new = 'toastError(''Impossible de télécharger le PDF de cette facture'');'
    },
    @{
        old = @'
toast({
          title: "Facture non disponible",
          description: "Cette facture n'est pas encore accessible en ligne.",
          variant: "destructive",
        });
'@
        new = 'toastError(''Cette facture n''''est pas encore accessible en ligne'');'
    },
    @{
        old = @'
toast({
        title: "Ouverture de la facture",
        description: `Accès à la facture #${invoice.stripeInvoiceId.slice(-8)}`,
      });
'@
        new = 'toastSuccess(`Accès à la facture #${invoice.stripeInvoiceId.slice(-8)}`);'
    },
    @{
        old = @'
toast({
          title: "Facture ouverte",
          description: "La facture s'ouvre dans un nouvel onglet.",
        });
'@
        new = 'toastSuccess(''La facture s''''ouvre dans un nouvel onglet'');'
    },
    @{
        old = @'
toast({
        title: "Erreur d'affichage",
        description: "Impossible d'ouvrir cette facture.",
        variant: "destructive",
      });
'@
        new = 'toastError(''Impossible d''''ouvrir cette facture'');'
    }
)

$count = 0
foreach ($rep in $replacements) {
    $before = $content.Length
    $content = $content.Replace($rep.old, $rep.new)
    $after = $content.Length
    if ($before -ne $after) {
        $count++
        Write-Host "✓ Remplacement $count effectué"
    } else {
        Write-Host "✗ Remplacement $count échoué (pattern non trouvé)"
    }
}

$content | Set-Content $file -Encoding UTF8 -NoNewline
Write-Host "`n$count remplacements effectués sur 15"
