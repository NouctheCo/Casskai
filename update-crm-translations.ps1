# Script PowerShell pour restructurer complètement les traductions CRM
# Objectif: Aligner les clés avec celles utilisées par les composants React

Write-Host "🔄 Restructuration des traductions CRM..." -ForegroundColor Cyan

# Fonction pour lire un fichier JSON et le convertir en objet PowerShell
function Get-JsonContent {
    param([string]$Path)
    $content = Get-Content $Path -Raw -Encoding UTF8
    return $content | ConvertFrom-Json -Depth 100
}

# Fonction pour sauvegarder un objet PowerShell en JSON
function Set-JsonContent {
    param(
        [Parameter(Mandatory=$true)]
        [object]$Object,
        [Parameter(Mandatory=$true)]
        [string]$Path
    )

    $json = $Object | ConvertTo-Json -Depth 100 -Compress:$false
    # Fix pour les caractères Unicode
    $json = $json -replace '\\u0027', "'"
    $json = $json -replace '\\u00e9', 'é'
    $json = $json -replace '\\u00e8', 'è'
    $json = $json -replace '\\u00ea', 'ê'
    $json = $json -replace '\\u00e0', 'à'
    $json = $json -replace '\\u00e7', 'ç'
    $json = $json -replace '\\u00f4', 'ô'
    $json = $json -replace '\\u00fb', 'û'
    $json = $json -replace '\\u00ef', 'ï'

    Set-Content -Path $Path -Value $json -Encoding UTF8 -NoNewline
}

# Nouvelle structure CRM complète en français
$newCrmFr = @{
    title = "Ventes & CRM"
    subtitle = "Gérez vos clients, opportunités et actions commerciales"
    refresh = "Actualiser"
    exportReport = "Rapport Complet"
    integratedWithSupabase = "Intégré Supabase"

    tabs = @{
        dashboard = "Tableau de bord"
        clients = "Clients"
        opportunities = "Opportunités"
        actions = "Actions"
    }

    dashboard = @{
        title = "Tableau de bord CRM"

        stats = @{
            totalClients = "Total Clients"
            activeOpportunities = "Opportunités Actives"
            pipelineValue = "Valeur Pipeline"
            conversionRate = "Taux de Conversion"
            wonThisMonth = "Gagnées ce mois"
            lostThisMonth = "Perdues ce mois"
            vsLastMonth = "vs mois dernier"
        }

        pipeline = @{
            title = "Pipeline de Ventes"
            deals = "affaires"
            deal = "affaire"
            totalValue = "Valeur totale"
            avgDeal = "Valeur moyenne"
            stages = @{
                prospection = "Prospection"
                qualification = "Qualification"
                proposal = "Proposition"
                negotiation = "Négociation"
                closing = "Finalisation"
                won = "Gagnée"
                lost = "Perdue"
            }
        }

        revenue = @{
            title = "Évolution du Chiffre d'Affaires"
            total = "Total"
            monthly = "CA Mensuel"
            cumulative = "CA Cumulé"
        }

        recentOpportunities = @{
            title = "Opportunités Récentes"
            noOpportunities = "Aucune opportunité récente"
            viewAll = "Voir toutes"
        }

        recentActions = @{
            title = "Actions Récentes"
            noActions = "Aucune action récente"
            viewAll = "Voir toutes"
        }

        topClients = @{
            title = "Meilleurs Clients"
            t = "Meilleurs Clients"
            noClients = "Aucun client"
            viewAll = "Voir tous"
            revenue = "CA"
        }

        quickActions = "Actions Rapides"
        overdue = "en retard"
        pending = "en attente"
        completed = "terminées"

        actions = @{
            newClient = "Nouveau Client"
            newOpportunity = "Nouvelle Opportunité"
            newAction = "Nouvelle Action"
            newTask = "Nouvelle Tâche"
        }
    }

    clients = @{
        title = "Gestion des Clients"
        subtitle = "clients"
        count = "{count} clients"
        search = "Rechercher un client..."
        addClient = "Ajouter un client"
        editClient = "Modifier le client"
        deleteClient = "Supprimer le client"
        viewClient = "Voir le client"
        noClients = "Aucun client"
        noClientsDesc = "Commencez par ajouter votre premier client"
        openModule = "Ouvrir la Gestion des Clients"

        fields = @{
            name = "Nom"
            email = "Email"
            phone = "Téléphone"
            company = "Société"
            address = "Adresse"
            city = "Ville"
            country = "Pays"
            type = "Type"
            status = "Statut"
            createdAt = "Créé le"
            totalRevenue = "CA Total"
            lastContact = "Dernier contact"
        }

        types = @{
            prospect = "Prospect"
            client = "Client"
            former = "Ancien client"
            lead = "Lead"
        }

        statuses = @{
            active = "Actif"
            inactive = "Inactif"
            blocked = "Bloqué"
        }
    }

    opportunities = @{
        title = "Gestion des Opportunités"
        subtitle = "opportunités"
        count = "{count} opportunités"
        pipelineValue = "Pipeline: {value}"
        search = "Rechercher une opportunité..."
        addOpportunity = "Nouvelle opportunité"
        editOpportunity = "Modifier l'opportunité"
        deleteOpportunity = "Supprimer l'opportunité"
        noOpportunities = "Aucune opportunité"
        noOpportunitiesDesc = "Créez votre première opportunité commerciale"
        openPipeline = "Ouvrir le Pipeline"

        fields = @{
            name = "Nom de l'opportunité"
            client = "Client"
            value = "Valeur"
            probability = "Probabilité"
            stage = "Étape"
            expectedCloseDate = "Date de closing prévue"
            assignedTo = "Assigné à"
            source = "Source"
            notes = "Notes"
        }

        stages = @{
            lead = "Lead"
            prospection = "Prospection"
            qualified = "Qualifié"
            qualification = "Qualification"
            proposal = "Proposition"
            negotiation = "Négociation"
            closing = "Finalisation"
            won = "Gagnée"
            lost = "Perdue"
        }

        sources = @{
            website = "Site web"
            referral = "Recommandation"
            linkedin = "LinkedIn"
            coldCall = "Appel à froid"
            event = "Événement"
            other = "Autre"
        }
    }

    actions = @{
        title = "Actions Commerciales"
        subtitle = "actions"
        count = "{count} actions"
        search = "Rechercher une action..."
        addAction = "Nouvelle action"
        editAction = "Modifier l'action"
        deleteAction = "Supprimer l'action"
        noActions = "Aucune action"
        noActionsDesc = "Planifiez vos prochaines actions commerciales"
        openActions = "Ouvrir les Actions"

        fields = @{
            type = "Type"
            subject = "Sujet"
            client = "Client"
            opportunity = "Opportunité"
            dueDate = "Date d'échéance"
            dueTime = "Heure"
            status = "Statut"
            priority = "Priorité"
            assignedTo = "Assigné à"
            notes = "Notes"
            result = "Résultat"
        }

        types = @{
            call = "Appel"
            email = "Email"
            meeting = "Rendez-vous"
            task = "Tâche"
            followup = "Relance"
            demo = "Démonstration"
            proposal = "Envoi proposition"
        }

        statuses = @{
            planned = "Planifiée"
            inProgress = "En cours"
            completed = "Terminée"
            cancelled = "Annulée"
            overdue = "En retard"
        }

        priorities = @{
            low = "Basse"
            medium = "Moyenne"
            high = "Haute"
            urgent = "Urgente"
        }
    }

    reports = @{
        title = "Rapport CRM Complet"
        generating = "Génération en cours..."
        generated = "Rapport généré avec succès"
        error = "Erreur lors de la génération"
        download = "Télécharger"
        period = "Période"
        summary = "Résumé"

        sections = @{
            overview = "Vue d'ensemble"
            clients = "Analyse Clients"
            pipeline = "Analyse Pipeline"
            actions = "Analyse Actions"
            forecast = "Prévisions"
        }

        metrics = @{
            newClients = "Nouveaux clients"
            opportunities = "Opportunités créées"
            wonDeals = "Affaires gagnées"
            lostDeals = "Affaires perdues"
            totalRevenue = "Chiffre d'affaires"
            avgDealSize = "Taille moyenne des affaires"
            salesCycle = "Cycle de vente moyen"
            winRate = "Taux de succès"
        }
    }

    # Conserver les anciennes clés pour compatibilité
    crmDashboard = @{
        title = "Tableau de bord CRM"
        stats = @{
            totalClients = "Total clients"
            activeOpportunities = "Opportunités actives"
            pipelineValue = "Valeur du pipeline"
            conversionRate = "Taux de conversion"
        }
        pipeline = @{
            title = "Pipeline des ventes"
            deals = "affaires"
            avgDeal = "Affaire moy."
        }
        revenue = @{
            title = "Évolution du chiffre d'affaires"
            total = "Total ce mois"
        }
        recentOpportunities = @{
            title = "Opportunités récentes"
        }
        recentOp = "Opportunités récentes"
        recentActions = @{
            title = "Actions récentes"
        }
        recentAct = "Activités récentes"
        topClients = @{
            title = "Meilleurs clients"
            t = "Meilleurs clients"
            noClients = "Aucun client pour le moment"
        }
        quickActions = "Actions rapides"
        overdue = "en retard"
        pending = "en attente"
        actions = @{
            newClient = "Nouveau client"
            newOpportunity = "Nouvelle opportunité"
            newAction = "Nouvelle action"
        }
    }

    clientsManagement = @{
        title = "Gestion des clients"
        clients = "Clients"
        contacts = "Contacts"
        addClient = "Ajouter un client"
        addContact = "Ajouter un contact"
    }
}

Write-Host "✅ Structure CRM FR créée" -ForegroundColor Green
Write-Host "   📦 Mise à jour de fr.json..." -ForegroundColor Cyan

# Charger fr.json
$frJson = Get-JsonContent "src/i18n/locales/fr.json"
$frJson.crm = $newCrmFr

# Sauvegarder fr.json
Set-JsonContent -Object $frJson -Path "src/i18n/locales/fr.json"

Write-Host "✅ fr.json mis à jour!" -ForegroundColor Green
Write-Host ""
Write-Host "Résumé des traductions ajoutées:" -ForegroundColor Yellow
Write-Host "  • Section dashboard complète" -ForegroundColor White
Write-Host "  • Section clients complète" -ForegroundColor White
Write-Host "  • Section opportunities complète" -ForegroundColor White
Write-Host "  • Section actions complète" -ForegroundColor White
Write-Host "  • Section reports complète" -ForegroundColor White
