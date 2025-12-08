#!/usr/bin/env node
/**
 * Script pour fusionner les traductions CRM complètes dans FR, EN, ES
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Fusion des traductions CRM...\n');

// Nouvelle structure CRM complète
const newCrmStructure = {
  fr: {
    title: "Ventes & CRM",
    subtitle: "Gérez vos clients, opportunités et actions commerciales",
    refresh: "Actualiser",
    exportReport: "Rapport Complet",
    integratedWithSupabase: "Intégré Supabase",

    tabs: {
      dashboard: "Tableau de bord",
      clients: "Clients",
      opportunities: "Opportunités",
      actions: "Actions"
    },

    dashboard: {
      title: "Tableau de bord CRM",

      stats: {
        totalClients: "Total Clients",
        activeOpportunities: "Opportunités Actives",
        pipelineValue: "Valeur Pipeline",
        conversionRate: "Taux de Conversion",
        wonThisMonth: "Gagnées ce mois",
        lostThisMonth: "Perdues ce mois",
        vsLastMonth: "vs mois dernier"
      },

      pipeline: {
        title: "Pipeline de Ventes",
        deals: "affaires",
        deal: "affaire",
        totalValue: "Valeur totale",
        avgDeal: "Valeur moyenne",
        stages: {
          prospection: "Prospection",
          qualification: "Qualification",
          proposal: "Proposition",
          negotiation: "Négociation",
          closing: "Finalisation",
          won: "Gagnée",
          lost: "Perdue"
        }
      },

      revenue: {
        title: "Évolution du Chiffre d'Affaires",
        total: "Total",
        monthly: "CA Mensuel",
        cumulative: "CA Cumulé"
      },

      recentOpportunities: {
        title: "Opportunités Récentes",
        noOpportunities: "Aucune opportunité récente",
        viewAll: "Voir toutes"
      },

      recentActions: {
        title: "Actions Récentes",
        noActions: "Aucune action récente",
        viewAll: "Voir toutes"
      },

      topClients: {
        title: "Meilleurs Clients",
        t: "Meilleurs Clients",
        noClients: "Aucun client",
        viewAll: "Voir tous",
        revenue: "CA"
      },

      quickActions: "Actions Rapides",
      overdue: "en retard",
      pending: "en attente",
      completed: "terminées",

      actions: {
        newClient: "Nouveau Client",
        newOpportunity: "Nouvelle Opportunité",
        newAction: "Nouvelle Action",
        newTask: "Nouvelle Tâche"
      }
    },

    clients: {
      title: "Gestion des Clients",
      subtitle: "clients",
      count: "{count} clients",
      search: "Rechercher un client...",
      addClient: "Ajouter un client",
      editClient: "Modifier le client",
      deleteClient: "Supprimer le client",
      viewClient: "Voir le client",
      noClients: "Aucun client",
      noClientsDesc: "Commencez par ajouter votre premier client",
      openModule: "Ouvrir la Gestion des Clients",

      fields: {
        name: "Nom",
        email: "Email",
        phone: "Téléphone",
        company: "Société",
        address: "Adresse",
        city: "Ville",
        country: "Pays",
        type: "Type",
        status: "Statut",
        createdAt: "Créé le",
        totalRevenue: "CA Total",
        lastContact: "Dernier contact"
      },

      types: {
        prospect: "Prospect",
        client: "Client",
        former: "Ancien client",
        lead: "Lead"
      },

      statuses: {
        active: "Actif",
        inactive: "Inactif",
        blocked: "Bloqué"
      }
    },

    opportunities: {
      title: "Gestion des Opportunités",
      subtitle: "opportunités",
      count: "{count} opportunités",
      pipelineValue: "Pipeline: {value}",
      search: "Rechercher une opportunité...",
      addOpportunity: "Nouvelle opportunité",
      editOpportunity: "Modifier l'opportunité",
      deleteOpportunity: "Supprimer l'opportunité",
      noOpportunities: "Aucune opportunité",
      noOpportunitiesDesc: "Créez votre première opportunité commerciale",
      openPipeline: "Ouvrir le Pipeline",

      fields: {
        name: "Nom de l'opportunité",
        client: "Client",
        value: "Valeur",
        probability: "Probabilité",
        stage: "Étape",
        expectedCloseDate: "Date de closing prévue",
        assignedTo: "Assigné à",
        source: "Source",
        notes: "Notes"
      },

      stages: {
        lead: "Lead",
        prospection: "Prospection",
        qualified: "Qualifié",
        qualification: "Qualification",
        proposal: "Proposition",
        negotiation: "Négociation",
        closing: "Finalisation",
        won: "Gagnée",
        lost: "Perdue"
      },

      sources: {
        website: "Site web",
        referral: "Recommandation",
        linkedin: "LinkedIn",
        coldCall: "Appel à froid",
        event: "Événement",
        other: "Autre"
      }
    },

    actions: {
      title: "Actions Commerciales",
      subtitle: "actions",
      count: "{count} actions",
      search: "Rechercher une action...",
      addAction: "Nouvelle action",
      editAction: "Modifier l'action",
      deleteAction: "Supprimer l'action",
      noActions: "Aucune action",
      noActionsDesc: "Planifiez vos prochaines actions commerciales",
      openActions: "Ouvrir les Actions",

      fields: {
        type: "Type",
        subject: "Sujet",
        client: "Client",
        opportunity: "Opportunité",
        dueDate: "Date d'échéance",
        dueTime: "Heure",
        status: "Statut",
        priority: "Priorité",
        assignedTo: "Assigné à",
        notes: "Notes",
        result: "Résultat"
      },

      types: {
        call: "Appel",
        email: "Email",
        meeting: "Rendez-vous",
        task: "Tâche",
        followup: "Relance",
        demo: "Démonstration",
        proposal: "Envoi proposition"
      },

      statuses: {
        planned: "Planifiée",
        inProgress: "En cours",
        completed: "Terminée",
        cancelled: "Annulée",
        overdue: "En retard"
      },

      priorities: {
        low: "Basse",
        medium: "Moyenne",
        high: "Haute",
        urgent: "Urgente"
      }
    },

    reports: {
      title: "Rapport CRM Complet",
      generating: "Génération en cours...",
      generated: "Rapport généré avec succès",
      error: "Erreur lors de la génération",
      download: "Télécharger",
      period: "Période",
      summary: "Résumé",

      sections: {
        overview: "Vue d'ensemble",
        clients: "Analyse Clients",
        pipeline: "Analyse Pipeline",
        actions: "Analyse Actions",
        forecast: "Prévisions"
      },

      metrics: {
        newClients: "Nouveaux clients",
        opportunities: "Opportunités créées",
        wonDeals: "Affaires gagnées",
        lostDeals: "Affaires perdues",
        totalRevenue: "Chiffre d'affaires",
        avgDealSize: "Taille moyenne des affaires",
        salesCycle: "Cycle de vente moyen",
        winRate: "Taux de succès"
      }
    }
  },

  en: {
    title: "Sales & CRM",
    subtitle: "Manage your clients, opportunities and sales actions",
    refresh: "Refresh",
    exportReport: "Full Report",
    integratedWithSupabase: "Integrated with Supabase",

    tabs: {
      dashboard: "Dashboard",
      clients: "Clients",
      opportunities: "Opportunities",
      actions: "Actions"
    },

    dashboard: {
      title: "CRM Dashboard",

      stats: {
        totalClients: "Total Clients",
        activeOpportunities: "Active Opportunities",
        pipelineValue: "Pipeline Value",
        conversionRate: "Conversion Rate",
        wonThisMonth: "Won This Month",
        lostThisMonth: "Lost This Month",
        vsLastMonth: "vs last month"
      },

      pipeline: {
        title: "Sales Pipeline",
        deals: "deals",
        deal: "deal",
        totalValue: "Total value",
        avgDeal: "Average value",
        stages: {
          prospection: "Prospecting",
          qualification: "Qualification",
          proposal: "Proposal",
          negotiation: "Negotiation",
          closing: "Closing",
          won: "Won",
          lost: "Lost"
        }
      },

      revenue: {
        title: "Revenue Evolution",
        total: "Total",
        monthly: "Monthly Revenue",
        cumulative: "Cumulative Revenue"
      },

      recentOpportunities: {
        title: "Recent Opportunities",
        noOpportunities: "No recent opportunities",
        viewAll: "View all"
      },

      recentActions: {
        title: "Recent Actions",
        noActions: "No recent actions",
        viewAll: "View all"
      },

      topClients: {
        title: "Top Clients",
        t: "Top Clients",
        noClients: "No clients",
        viewAll: "View all",
        revenue: "Revenue"
      },

      quickActions: "Quick Actions",
      overdue: "overdue",
      pending: "pending",
      completed: "completed",

      actions: {
        newClient: "New Client",
        newOpportunity: "New Opportunity",
        newAction: "New Action",
        newTask: "New Task"
      }
    },

    clients: {
      title: "Client Management",
      subtitle: "clients",
      count: "{count} clients",
      search: "Search for a client...",
      addClient: "Add client",
      editClient: "Edit client",
      deleteClient: "Delete client",
      viewClient: "View client",
      noClients: "No clients",
      noClientsDesc: "Start by adding your first client",
      openModule: "Open Client Management",

      fields: {
        name: "Name",
        email: "Email",
        phone: "Phone",
        company: "Company",
        address: "Address",
        city: "City",
        country: "Country",
        type: "Type",
        status: "Status",
        createdAt: "Created",
        totalRevenue: "Total Revenue",
        lastContact: "Last contact"
      },

      types: {
        prospect: "Prospect",
        client: "Client",
        former: "Former client",
        lead: "Lead"
      },

      statuses: {
        active: "Active",
        inactive: "Inactive",
        blocked: "Blocked"
      }
    },

    opportunities: {
      title: "Opportunity Management",
      subtitle: "opportunities",
      count: "{count} opportunities",
      pipelineValue: "Pipeline: {value}",
      search: "Search for an opportunity...",
      addOpportunity: "New opportunity",
      editOpportunity: "Edit opportunity",
      deleteOpportunity: "Delete opportunity",
      noOpportunities: "No opportunities",
      noOpportunitiesDesc: "Create your first sales opportunity",
      openPipeline: "Open Pipeline",

      fields: {
        name: "Opportunity name",
        client: "Client",
        value: "Value",
        probability: "Probability",
        stage: "Stage",
        expectedCloseDate: "Expected close date",
        assignedTo: "Assigned to",
        source: "Source",
        notes: "Notes"
      },

      stages: {
        lead: "Lead",
        prospection: "Prospecting",
        qualified: "Qualified",
        qualification: "Qualification",
        proposal: "Proposal",
        negotiation: "Negotiation",
        closing: "Closing",
        won: "Won",
        lost: "Lost"
      },

      sources: {
        website: "Website",
        referral: "Referral",
        linkedin: "LinkedIn",
        coldCall: "Cold call",
        event: "Event",
        other: "Other"
      }
    },

    actions: {
      title: "Sales Actions",
      subtitle: "actions",
      count: "{count} actions",
      search: "Search for an action...",
      addAction: "New action",
      editAction: "Edit action",
      deleteAction: "Delete action",
      noActions: "No actions",
      noActionsDesc: "Plan your next sales activities",
      openActions: "Open Actions",

      fields: {
        type: "Type",
        subject: "Subject",
        client: "Client",
        opportunity: "Opportunity",
        dueDate: "Due date",
        dueTime: "Time",
        status: "Status",
        priority: "Priority",
        assignedTo: "Assigned to",
        notes: "Notes",
        result: "Result"
      },

      types: {
        call: "Call",
        email: "Email",
        meeting: "Meeting",
        task: "Task",
        followup: "Follow-up",
        demo: "Demo",
        proposal: "Send proposal"
      },

      statuses: {
        planned: "Planned",
        inProgress: "In Progress",
        completed: "Completed",
        cancelled: "Cancelled",
        overdue: "Overdue"
      },

      priorities: {
        low: "Low",
        medium: "Medium",
        high: "High",
        urgent: "Urgent"
      }
    },

    reports: {
      title: "Full CRM Report",
      generating: "Generating...",
      generated: "Report generated successfully",
      error: "Error generating report",
      download: "Download",
      period: "Period",
      summary: "Summary",

      sections: {
        overview: "Overview",
        clients: "Client Analysis",
        pipeline: "Pipeline Analysis",
        actions: "Action Analysis",
        forecast: "Forecast"
      },

      metrics: {
        newClients: "New clients",
        opportunities: "Opportunities created",
        wonDeals: "Won deals",
        lostDeals: "Lost deals",
        totalRevenue: "Total revenue",
        avgDealSize: "Average deal size",
        salesCycle: "Average sales cycle",
        winRate: "Win rate"
      }
    }
  },

  es: {
    title: "Ventas y CRM",
    subtitle: "Gestione sus clientes, oportunidades y acciones comerciales",
    refresh: "Actualizar",
    exportReport: "Informe Completo",
    integratedWithSupabase: "Integrado con Supabase",

    tabs: {
      dashboard: "Panel de Control",
      clients: "Clientes",
      opportunities: "Oportunidades",
      actions: "Acciones"
    },

    dashboard: {
      title: "Panel de Control CRM",

      stats: {
        totalClients: "Total Clientes",
        activeOpportunities: "Oportunidades Activas",
        pipelineValue: "Valor del Pipeline",
        conversionRate: "Tasa de Conversión",
        wonThisMonth: "Ganadas este mes",
        lostThisMonth: "Perdidas este mes",
        vsLastMonth: "vs mes anterior"
      },

      pipeline: {
        title: "Pipeline de Ventas",
        deals: "negocios",
        deal: "negocio",
        totalValue: "Valor total",
        avgDeal: "Valor promedio",
        stages: {
          prospection: "Prospección",
          qualification: "Calificación",
          proposal: "Propuesta",
          negotiation: "Negociación",
          closing: "Cierre",
          won: "Ganada",
          lost: "Perdida"
        }
      },

      revenue: {
        title: "Evolución de Ingresos",
        total: "Total",
        monthly: "Ingresos Mensuales",
        cumulative: "Ingresos Acumulados"
      },

      recentOpportunities: {
        title: "Oportunidades Recientes",
        noOpportunities: "Sin oportunidades recientes",
        viewAll: "Ver todas"
      },

      recentActions: {
        title: "Acciones Recientes",
        noActions: "Sin acciones recientes",
        viewAll: "Ver todas"
      },

      topClients: {
        title: "Mejores Clientes",
        t: "Mejores Clientes",
        noClients: "Sin clientes",
        viewAll: "Ver todos",
        revenue: "Ingresos"
      },

      quickActions: "Acciones Rápidas",
      overdue: "vencidas",
      pending: "pendientes",
      completed: "completadas",

      actions: {
        newClient: "Nuevo Cliente",
        newOpportunity: "Nueva Oportunidad",
        newAction: "Nueva Acción",
        newTask: "Nueva Tarea"
      }
    },

    clients: {
      title: "Gestión de Clientes",
      subtitle: "clientes",
      count: "{count} clientes",
      search: "Buscar un cliente...",
      addClient: "Añadir cliente",
      editClient: "Editar cliente",
      deleteClient: "Eliminar cliente",
      viewClient: "Ver cliente",
      noClients: "Sin clientes",
      noClientsDesc: "Comience añadiendo su primer cliente",
      openModule: "Abrir Gestión de Clientes",

      fields: {
        name: "Nombre",
        email: "Email",
        phone: "Teléfono",
        company: "Empresa",
        address: "Dirección",
        city: "Ciudad",
        country: "País",
        type: "Tipo",
        status: "Estado",
        createdAt: "Creado",
        totalRevenue: "Ingresos Totales",
        lastContact: "Último contacto"
      },

      types: {
        prospect: "Prospecto",
        client: "Cliente",
        former: "Ex cliente",
        lead: "Lead"
      },

      statuses: {
        active: "Activo",
        inactive: "Inactivo",
        blocked: "Bloqueado"
      }
    },

    opportunities: {
      title: "Gestión de Oportunidades",
      subtitle: "oportunidades",
      count: "{count} oportunidades",
      pipelineValue: "Pipeline: {value}",
      search: "Buscar una oportunidad...",
      addOpportunity: "Nueva oportunidad",
      editOpportunity: "Editar oportunidad",
      deleteOpportunity: "Eliminar oportunidad",
      noOpportunities: "Sin oportunidades",
      noOpportunitiesDesc: "Cree su primera oportunidad de venta",
      openPipeline: "Abrir Pipeline",

      fields: {
        name: "Nombre de la oportunidad",
        client: "Cliente",
        value: "Valor",
        probability: "Probabilidad",
        stage: "Etapa",
        expectedCloseDate: "Fecha de cierre prevista",
        assignedTo: "Asignado a",
        source: "Origen",
        notes: "Notas"
      },

      stages: {
        lead: "Lead",
        prospection: "Prospección",
        qualified: "Calificado",
        qualification: "Calificación",
        proposal: "Propuesta",
        negotiation: "Negociación",
        closing: "Cierre",
        won: "Ganada",
        lost: "Perdida"
      },

      sources: {
        website: "Sitio web",
        referral: "Referencia",
        linkedin: "LinkedIn",
        coldCall: "Llamada en frío",
        event: "Evento",
        other: "Otro"
      }
    },

    actions: {
      title: "Acciones Comerciales",
      subtitle: "acciones",
      count: "{count} acciones",
      search: "Buscar una acción...",
      addAction: "Nueva acción",
      editAction: "Editar acción",
      deleteAction: "Eliminar acción",
      noActions: "Sin acciones",
      noActionsDesc: "Planifique sus próximas actividades comerciales",
      openActions: "Abrir Acciones",

      fields: {
        type: "Tipo",
        subject: "Asunto",
        client: "Cliente",
        opportunity: "Oportunidad",
        dueDate: "Fecha límite",
        dueTime: "Hora",
        status: "Estado",
        priority: "Prioridad",
        assignedTo: "Asignado a",
        notes: "Notas",
        result: "Resultado"
      },

      types: {
        call: "Llamada",
        email: "Email",
        meeting: "Reunión",
        task: "Tarea",
        followup: "Seguimiento",
        demo: "Demostración",
        proposal: "Enviar propuesta"
      },

      statuses: {
        planned: "Planificada",
        inProgress: "En Progreso",
        completed: "Completada",
        cancelled: "Cancelada",
        overdue: "Vencida"
      },

      priorities: {
        low: "Baja",
        medium: "Media",
        high: "Alta",
        urgent: "Urgente"
      }
    },

    reports: {
      title: "Informe CRM Completo",
      generating: "Generando...",
      generated: "Informe generado con éxito",
      error: "Error al generar el informe",
      download: "Descargar",
      period: "Período",
      summary: "Resumen",

      sections: {
        overview: "Visión General",
        clients: "Análisis de Clientes",
        pipeline: "Análisis del Pipeline",
        actions: "Análisis de Acciones",
        forecast: "Pronóstico"
      },

      metrics: {
        newClients: "Nuevos clientes",
        opportunities: "Oportunidades creadas",
        wonDeals: "Negocios ganados",
        lostDeals: "Negocios perdidos",
        totalRevenue: "Ingresos totales",
        avgDealSize: "Tamaño promedio del negocio",
        salesCycle: "Ciclo de venta promedio",
        winRate: "Tasa de éxito"
      }
    }
  }
};

// Fonction pour fusionner en profondeur deux objets
function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Traiter chaque langue
['fr', 'en', 'es'].forEach(lang => {
  const filePath = path.join(__dirname, 'src', 'i18n', 'locales', `${lang}.json`);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${lang}.json n'existe pas - création...`);
    fs.writeFileSync(filePath, JSON.stringify({ crm: newCrmStructure[lang] }, null, 2), 'utf8');
    console.log(`✅ ${lang}.json créé avec section CRM complète`);
    return;
  }

  // Charger le fichier existant
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Fusionner la nouvelle structure CRM
  if (!data.crm) {
    data.crm = newCrmStructure[lang];
  } else {
    data.crm = deepMerge(data.crm, newCrmStructure[lang]);
  }

  // Sauvegarder
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ ${lang}.json mis à jour avec section CRM complète`);
});

console.log('\n🎉 Fusion terminée!\n');
console.log('Résumé des ajouts:');
console.log('  • crm.dashboard.* - Statistiques et widgets dashboard');
console.log('  • crm.clients.* - Gestion clients complète');
console.log('  • crm.opportunities.* - Gestion opportunités');
console.log('  • crm.actions.* - Gestion actions commerciales');
console.log('  • crm.reports.* - Rapports CRM');
console.log('\n📊 Total: ~150 nouvelles clés de traduction par langue');
