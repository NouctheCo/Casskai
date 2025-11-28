import { EntryTemplate, TemplateAccount, VATRule, TemplateCondition, JournalEntryType } from '../types/accounting-import.types';
import { supabase } from '../lib/supabase';

/**
 * Service de gestion des templates d'écritures récurrentes
 */
export class EntryTemplatesService {

  /**
   * Templates prédéfinis par catégorie
   */
  private static readonly PREDEFINED_TEMPLATES: EntryTemplate[] = [
    {
      id: 'template_sale_invoice',
      name: 'Facture de vente avec TVA',
      description: 'Template pour facturation client avec TVA 20%',
      category: 'sale',
      isRecurring: false,
      accounts: [
        {
          id: '1',
          accountType: 'debit',
          accountNumber: '411',
          label: 'Client',
          amountFormula: '#{amountTTC}',
          isVariable: false
        },
        {
          id: '2',
          accountType: 'credit',
          accountNumber: '445',
          label: 'TVA collectée',
          amountFormula: '#{amountHT} * 0.20',
          isVariable: false
        },
        {
          id: '3',
          accountType: 'credit',
          accountNumber: '707',
          label: 'Ventes de marchandises',
          amountFormula: '#{amountHT}',
          isVariable: false
        }
      ],
      vatRules: [{
        id: 'vat_20',
        name: 'TVA 20%',
        rate: 0.20,
        type: 'standard',
        deductible: false,
        accountCredit: '445'
      }]
    },
    {
      id: 'template_purchase_invoice',
      name: 'Facture d\'achat avec TVA',
      description: 'Template pour facture fournisseur avec TVA déductible',
      category: 'purchase',
      isRecurring: false,
      accounts: [
        {
          id: '1',
          accountType: 'debit',
          accountNumber: '607',
          label: 'Achats de marchandises',
          amountFormula: '#{amountHT}',
          isVariable: false
        },
        {
          id: '2',
          accountType: 'debit',
          accountNumber: '445',
          label: 'TVA déductible',
          amountFormula: '#{amountHT} * 0.20',
          isVariable: false
        },
        {
          id: '3',
          accountType: 'credit',
          accountNumber: '401',
          label: 'Fournisseur',
          amountFormula: '#{amountTTC}',
          isVariable: false
        }
      ],
      vatRules: [{
        id: 'vat_20_deductible',
        name: 'TVA 20% déductible',
        rate: 0.20,
        type: 'standard',
        deductible: true,
        accountDebit: '445'
      }]
    },
    {
      id: 'template_bank_payment',
      name: 'Paiement fournisseur',
      description: 'Template pour règlement fournisseur par virement',
      category: 'payment',
      isRecurring: false,
      accounts: [
        {
          id: '1',
          accountType: 'debit',
          accountNumber: '401',
          label: 'Fournisseur',
          amountFormula: '#{amount}',
          isVariable: true
        },
        {
          id: '2',
          accountType: 'credit',
          accountNumber: '512',
          label: 'Banque',
          amountFormula: '#{amount}',
          isVariable: false
        }
      ]
    },
    {
      id: 'template_salary_monthly',
      name: 'Paie mensuelle',
      description: 'Template pour écriture de paie mensuelle',
      category: 'other',
      isRecurring: true,
      frequency: 'monthly',
      accounts: [
        {
          id: '1',
          accountType: 'debit',
          accountNumber: '641',
          label: 'Salaires bruts',
          amountFormula: '#{salaireBrut}',
          isVariable: true
        },
        {
          id: '2',
          accountType: 'credit',
          accountNumber: '431',
          label: 'Sécurité sociale',
          amountFormula: '#{salaireBrut} * 0.45',
          isVariable: false
        },
        {
          id: '3',
          accountType: 'credit',
          accountNumber: '421',
          label: 'Salaire net à payer',
          amountFormula: '#{salaireBrut} * 0.55',
          isVariable: false
        }
      ]
    }
  ];

  /**
   * Récupère tous les templates disponibles
   */
  static async getAllTemplates(companyId: string): Promise<EntryTemplate[]> {
    // Templates personnalisés de l'entreprise
    const customTemplates = await supabase
      .from('entry_templates')
      .select(`
        *,
        template_accounts (*),
        template_vat_rules (*)
      `)
      .eq('company_id', companyId);

    const templates = [...this.PREDEFINED_TEMPLATES];
    
    if (customTemplates.data) {
      templates.push(...customTemplates.data.map(this.mapSupabaseToTemplate));
    }

    return templates;
  }

  /**
   * Applique un template pour générer une écriture
   */
  static async applyTemplate(
    templateId: string,
    variables: Record<string, any>,
    companyId: string,
    journalId: string
  ): Promise<JournalEntryType> {
    const templates = await this.getAllTemplates(companyId);
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      throw new Error(`Template ${templateId} non trouvé`);
    }

    // Évaluation des conditions si présentes
    if (template.conditions) {
      const conditionsResult = this.evaluateConditions(template.conditions, variables);
      if (!conditionsResult.isValid) {
        throw new Error(`Conditions non remplies: ${conditionsResult.failedConditions.join(', ')}`);
      }
    }

    // Génération des lignes d'écriture
    const items = await this.generateEntryItems(template, variables, companyId);

    // Création de l'écriture
    const entry: JournalEntryType = {
      companyId,
      journalId,
      entryNumber: await this.generateEntryNumber(companyId, journalId),
      date: variables.date || new Date().toISOString(),
      description: this.interpolateString(template.description, variables),
      reference: variables.reference || '',
      status: 'draft',
      items,
    };

    return entry;
  }

  /**
   * Génère les lignes d'écriture à partir du template
   */
  private static async generateEntryItems(
    template: EntryTemplate,
    variables: Record<string, any>,
    companyId: string
  ): Promise<any[]> {
    const items: any[] = [];

    for (const templateAccount of template.accounts) {
      // Résolution de l'ID du compte
      const accountId = await this.resolveAccountId(templateAccount, companyId);
      
      if (!accountId) {
        throw new Error(`Compte ${templateAccount.accountNumber || templateAccount.label} non trouvé`);
      }

      // Calcul du montant
      const amount = this.calculateAmount(templateAccount.amountFormula, variables);
      
      if (amount === 0 && !templateAccount.isVariable) continue;

      // Création de la ligne
      const item = {
        accountId,
        debitAmount: templateAccount.accountType === 'debit' ? amount : 0,
        creditAmount: templateAccount.accountType === 'credit' ? amount : 0,
        description: this.interpolateString(templateAccount.label, variables),
        auxiliaryAccount: variables.auxiliaryAccount || undefined,
      };

      items.push(item);
    }

    // Application des règles TVA si présentes
    if (template.vatRules) {
      const vatItems = await this.applyVATRules(template.vatRules, variables, companyId);
      items.push(...vatItems);
    }

    return items;
  }

  /**
   * Résout l'ID d'un compte à partir de son numéro
   */
  private static async resolveAccountId(
    templateAccount: TemplateAccount,
    companyId: string
  ): Promise<string | null> {
    if (templateAccount.accountId) {
      return templateAccount.accountId;
    }

    if (templateAccount.accountNumber) {
      const account = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('company_id', companyId)
        .eq('account_number', templateAccount.accountNumber)
        .eq('is_active', true)
        .single();

      return account.data?.id || null;
    }

    return null;
  }

  /**
   * Calcule un montant à partir d'une formule
   */
  private static calculateAmount(formula: string, variables: Record<string, any>): number {
    try {
      // Remplacement des variables dans la formule
      let processedFormula = formula;
      
      // Remplace #{variable} par sa valeur
      processedFormula = processedFormula.replace(/#{(\w+)}/g, (match, varName) => {
        const value = variables[varName];
        if (value === undefined || value === null) {
          throw new Error(`Variable ${varName} non fournie`);
        }
        return value.toString();
      });

      // Évaluation sécurisée de l'expression mathématique
      const result = this.evaluateMathExpression(processedFormula);
      return Math.round(result * 100) / 100; // Arrondi à 2 décimales
    } catch (error) {
      throw new Error(`Erreur dans la formule "${formula}": ${error.message}`);
    }
  }

  /**
   * Évaluation sécurisée d'expressions mathématiques
   */
  private static evaluateMathExpression(expression: string): number {
    // Nettoyage de l'expression
    const cleanExpression = expression.replace(/[^0-9+\-*/.() ]/g, '');
    
    // Validation des caractères autorisés
    if (!/^[0-9+\-*/.() ]+$/.test(cleanExpression)) {
      throw new Error('Expression mathématique invalide');
    }

    try {
      // Utilisation de Function pour éviter eval() direct
      return new Function(`"use strict"; return (${cleanExpression})`)();
    } catch (error) {
      throw new Error(`Expression invalide: ${cleanExpression}`);
    }
  }

  /**
   * Interpolation de chaînes avec variables
   */
  private static interpolateString(template: string, variables: Record<string, any>): string {
    return template.replace(/#{(\w+)}/g, (match, varName) => {
      return variables[varName]?.toString() || match;
    });
  }

  /**
   * Évaluation des conditions
   */
  private static evaluateConditions(
    conditions: TemplateCondition[],
    variables: Record<string, any>
  ): { isValid: boolean; failedConditions: string[] } {
    const failedConditions: string[] = [];

    for (const condition of conditions) {
      const value = variables[condition.field];
      let conditionMet = false;

      switch (condition.operator) {
        case 'eq':
          conditionMet = value === condition.value;
          break;
        case 'ne':
          conditionMet = value !== condition.value;
          break;
        case 'gt':
          conditionMet = Number(value) > Number(condition.value);
          break;
        case 'lt':
          conditionMet = Number(value) < Number(condition.value);
          break;
        case 'gte':
          conditionMet = Number(value) >= Number(condition.value);
          break;
        case 'lte':
          conditionMet = Number(value) <= Number(condition.value);
          break;
        case 'contains':
          conditionMet = String(value).includes(String(condition.value));
          break;
      }

      if (!conditionMet) {
        failedConditions.push(`${condition.field} ${condition.operator} ${condition.value}`);
      }
    }

    return {
      isValid: failedConditions.length === 0,
      failedConditions
    };
  }

  /**
   * Application des règles TVA
   */
  private static async applyVATRules(
    vatRules: VATRule[],
    variables: Record<string, any>,
    companyId: string
  ): Promise<any[]> {
    const vatItems: any[] = [];

    for (const rule of vatRules) {
      const baseAmount = variables.amountHT || variables.amount || 0;
      const vatAmount = Math.round(baseAmount * rule.rate * 100) / 100;

      if (vatAmount === 0) continue;

      // Compte de TVA
      const vatAccountNumber = rule.deductible ? 
        (rule.accountDebit || '445621') : 
        (rule.accountCredit || '445711');

      const vatAccount = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('company_id', companyId)
        .eq('account_number', vatAccountNumber)
        .single();

      if (vatAccount.data) {
        vatItems.push({
          accountId: vatAccount.data.id,
          debitAmount: rule.deductible ? vatAmount : 0,
          creditAmount: rule.deductible ? 0 : vatAmount,
          description: `TVA ${rule.rate * 100}% ${rule.deductible ? 'déductible' : 'collectée'}`,
        });
      }
    }

    return vatItems;
  }

  /**
   * Génère un numéro d'écriture séquentiel
   */
  private static async generateEntryNumber(companyId: string, journalId: string): Promise<string> {
    const year = new Date().getFullYear();
    
    // Récupération du dernier numéro pour ce journal cette année
    const lastEntry = await supabase
      .from('journal_entries')
      .select('entry_number')
      .eq('company_id', companyId)
      .eq('journal_id', journalId)
      .gte('entry_date', `${year}-01-01`)
      .lte('entry_date', `${year}-12-31`)
      .order('entry_number', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastEntry.data?.entry_number) {
      const match = lastEntry.data.entry_number.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format: JRN-YYYY-00001
    const journal = await supabase
      .from('journals')
      .select('code')
      .eq('id', journalId)
      .single();

    const journalCode = journal.data?.code || 'JRN';
    return `${journalCode}-${year}-${nextNumber.toString().padStart(5, '0')}`;
  }

  /**
   * Sauvegarde d'un template personnalisé
   */
  static async saveCustomTemplate(template: EntryTemplate, companyId: string): Promise<string> {
    const { data, error } = await supabase
      .from('entry_templates')
      .insert({
        company_id: companyId,
        name: template.name,
        description: template.description,
        category: template.category,
        is_recurring: template.isRecurring,
        frequency: template.frequency,
        conditions: template.conditions,
      })
      .select('id')
      .single();

    if (error) throw error;

    const templateId = data.id;

    // Sauvegarde des comptes
    if (template.accounts.length > 0) {
      const accountsData = template.accounts.map(account => ({
        template_id: templateId,
        account_type: account.accountType,
        account_number: account.accountNumber,
        account_id: account.accountId,
        label: account.label,
        amount_formula: account.amountFormula,
        is_variable: account.isVariable,
        conditions: account.conditions,
      }));

      await supabase
        .from('template_accounts')
        .insert(accountsData);
    }

    // Sauvegarde des règles TVA
    if (template.vatRules && template.vatRules.length > 0) {
      const vatRulesData = template.vatRules.map(rule => ({
        template_id: templateId,
        name: rule.name,
        rate: rule.rate,
        type: rule.type,
        deductible: rule.deductible,
        account_debit: rule.accountDebit,
        account_credit: rule.accountCredit,
        regime: rule.regime,
      }));

      await supabase
        .from('template_vat_rules')
        .insert(vatRulesData);
    }

    return templateId;
  }

  /**
   * Traitement des écritures récurrentes
   */
  static async processRecurringEntries(companyId: string): Promise<{
    processed: number;
    errors: string[];
  }> {
    const templates = await this.getAllTemplates(companyId);
    const recurringTemplates = templates.filter(t => t.isRecurring);
    
    let processed = 0;
    const errors: string[] = [];

    for (const template of recurringTemplates) {
      try {
        if (await this.shouldProcessRecurringEntry(template, companyId)) {
          // Variables par défaut pour les écritures récurrentes
          const defaultVariables = await this.getRecurringVariables(template, companyId);
          
          // Journal par défaut pour ce type d'écriture
          const journalId = await this.getDefaultJournalForCategory(template.category, companyId);
          
          if (journalId) {
            await this.applyTemplate(template.id, defaultVariables, companyId, journalId);
            processed++;
          }
        }
      } catch (error) {
        errors.push(`Template ${template.name}: ${error.message}`);
      }
    }

    return { processed, errors };
  }

  /**
   * Détermine si une écriture récurrente doit être traitée
   */
  private static async shouldProcessRecurringEntry(
    template: EntryTemplate,
    companyId: string
  ): Promise<boolean> {
    const now = new Date();
    let checkDate: Date;

    switch (template.frequency) {
      case 'monthly':
        checkDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarterly':
        checkDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'yearly':
        checkDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return false;
    }

    // Vérifier si l'écriture a déjà été générée pour cette période
    const existing = await supabase
      .from('journal_entries')
      .select('id')
      .eq('company_id', companyId)
      .gte('entry_date', checkDate.toISOString())
      .like('description', `%${template.name}%`)
      .limit(1);

    return !existing.data || existing.data.length === 0;
  }

  /**
   * Variables par défaut pour les écritures récurrentes
   */
  private static async getRecurringVariables(
    template: EntryTemplate,
    companyId: string
  ): Promise<Record<string, any>> {
    const variables: Record<string, any> = {
      date: new Date().toISOString(),
      reference: `AUTO-${template.name}-${new Date().toISOString().slice(0, 7)}`
    };

    // Variables spécifiques par catégorie
    switch (template.category) {
      case 'other': // Paie par exemple
        // Récupération des données de paie depuis les paramètres
        const salaryData = await supabase
          .from('company_settings')
          .select('value')
          .eq('company_id', companyId)
          .eq('key', 'recurring_salary_data')
          .single();

        if (salaryData.data) {
          Object.assign(variables, JSON.parse(salaryData.data.value));
        }
        break;
    }

    return variables;
  }

  /**
   * Journal par défaut selon la catégorie
   */
  private static async getDefaultJournalForCategory(
    category: string,
    companyId: string
  ): Promise<string | null> {
    const journalTypeMap: Record<string, string> = {
      'sale': 'sales',
      'purchase': 'purchases',
      'payment': 'bank',
      'bank': 'bank',
      'other': 'miscellaneous'
    };

    const journalType = journalTypeMap[category] || 'miscellaneous';

    const journal = await supabase
      .from('journals')
      .select('id')
      .eq('company_id', companyId)
      .eq('type', journalType)
      .eq('is_active', true)
      .limit(1)
      .single();

    return journal.data?.id || null;
  }

  /**
   * Mapping des données Supabase vers template
   */
  private static mapSupabaseToTemplate(data: any): EntryTemplate {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      isRecurring: data.is_recurring,
      frequency: data.frequency,
      accounts: data.template_accounts?.map(acc => ({
        id: acc.id,
        accountType: acc.account_type,
        accountNumber: acc.account_number,
        accountId: acc.account_id,
        label: acc.label,
        amountFormula: acc.amount_formula,
        isVariable: acc.is_variable,
        conditions: acc.conditions,
      })) || [],
      vatRules: data.template_vat_rules?.map(rule => ({
        id: rule.id,
        name: rule.name,
        rate: rule.rate,
        type: rule.type,
        deductible: rule.deductible,
        accountDebit: rule.account_debit,
        accountCredit: rule.account_credit,
        regime: rule.regime,
      })) || [],
      conditions: data.conditions,
    };
  }
}
