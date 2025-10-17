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
          accountNumber: '411100',
          label: 'Clients',
          amountFormula: '#{amountTTC}',
          isVariable: false
        },
        {
          id: '2',
          accountType: 'credit',
          accountNumber: '707100',
          label: 'Ventes de marchandises',
          amountFormula: '#{amountHT}',
          isVariable: false
        },
        {
          id: '3',
          accountType: 'credit',
          accountNumber: '445710',
          label: 'TVA collectée 20%',
          amountFormula: '#{amountHT} * 0.20',
          isVariable: false
        }
      ],
      conditions: [{
        field: 'taxRate',
        operator: 'eq',
        value: 20,
        action: 'include'
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
          accountNumber: '607100',
          label: 'Achats de marchandises',
          amountFormula: '#{amountHT}',
          isVariable: false
        },
        {
          id: '2',
          accountType: 'debit',
          accountNumber: '445660',
          label: 'TVA déductible sur autres biens et services',
          amountFormula: '#{amountHT} * 0.20',
          isVariable: false
        },
        {
          id: '3',
          accountType: 'credit',
          accountNumber: '401100',
          label: 'Fournisseurs',
          amountFormula: '#{amountTTC}',
          isVariable: false
        }
      ],
      conditions: [{
        field: 'taxRate',
        operator: 'eq',
        value: 20,
        action: 'include'
      }]
    },
    {
      id: 'template_bank_payment_client',
      name: 'Paiement client par virement',
      description: 'Template pour règlement client par virement bancaire',
      category: 'payment',
      isRecurring: false,
      accounts: [
        {
          id: '1',
          accountType: 'debit',
          accountNumber: '512100',
          label: 'Banques - Compte courant',
          amountFormula: '#{amount}',
          isVariable: false
        },
        {
          id: '2',
          accountType: 'credit',
          accountNumber: '411100',
          label: 'Clients',
          amountFormula: '#{amount}',
          isVariable: false
        }
      ]
    },
    {
      id: 'template_bank_payment_supplier',
      name: 'Paiement fournisseur par virement',
      description: 'Template pour règlement fournisseur par virement bancaire',
      category: 'payment',
      isRecurring: false,
      accounts: [
        {
          id: '1',
          accountType: 'debit',
          accountNumber: '401100',
          label: 'Fournisseurs',
          amountFormula: '#{amount}',
          isVariable: false
        },
        {
          id: '2',
          accountType: 'credit',
          accountNumber: '512100',
          label: 'Banques - Compte courant',
          amountFormula: '#{amount}',
          isVariable: false
        }
      ]
    },
    {
      id: 'template_cash_receipt',
      name: 'Encaissement espèces',
      description: 'Template pour encaissement en espèces',
      category: 'payment',
      isRecurring: false,
      accounts: [
        {
          id: '1',
          accountType: 'debit',
          accountNumber: '530100',
          label: 'Caisse',
          amountFormula: '#{amount}',
          isVariable: false
        },
        {
          id: '2',
          accountType: 'credit',
          accountNumber: '411100',
          label: 'Clients',
          amountFormula: '#{amount}',
          isVariable: false
        }
      ]
    },
    {
      id: 'template_cash_payment',
      name: 'Décaissement espèces',
      description: 'Template pour décaissement en espèces',
      category: 'payment',
      isRecurring: false,
      accounts: [
        {
          id: '1',
          accountType: 'debit',
          accountNumber: '401100',
          label: 'Fournisseurs',
          amountFormula: '#{amount}',
          isVariable: false
        },
        {
          id: '2',
          accountType: 'credit',
          accountNumber: '530100',
          label: 'Caisse',
          amountFormula: '#{amount}',
          isVariable: false
        }
      ]
    },
    {
      id: 'template_salary_expense',
      name: 'Charges de personnel',
      description: 'Template pour les charges de personnel',
      category: 'other',
      isRecurring: true,
      accounts: [
        {
          id: '1',
          accountType: 'debit',
          accountNumber: '641100',
          label: 'Rémunérations du personnel',
          amountFormula: '#{grossSalary}',
          isVariable: false
        },
        {
          id: '2',
          accountType: 'debit',
          accountNumber: '645100',
          label: 'Charges de sécurité sociale',
          amountFormula: '#{socialCharges}',
          isVariable: false
        },
        {
          id: '3',
          accountType: 'credit',
          accountNumber: '421100',
          label: 'Personnel - Rémunérations dues',
          amountFormula: '#{netSalary}',
          isVariable: false
        },
        {
          id: '4',
          accountType: 'credit',
          accountNumber: '431100',
          label: 'Sécurité sociale',
          amountFormula: '#{socialCharges}',
          isVariable: false
        }
      ]
    },
    {
      id: 'template_inventory_in',
      name: 'Entrée en stock',
      description: 'Template pour les entrées en stock',
      category: 'other',
      isRecurring: false,
      accounts: [
        {
          id: '1',
          accountType: 'debit',
          accountNumber: '370000',
          label: 'Stocks de marchandises',
          amountFormula: '#{amountHT}',
          isVariable: false
        },
        {
          id: '2',
          accountType: 'debit',
          accountNumber: '445660',
          label: 'TVA déductible',
          amountFormula: '#{amountHT} * 0.20',
          isVariable: false
        },
        {
          id: '3',
          accountType: 'credit',
          accountNumber: '401100',
          label: 'Fournisseurs',
          amountFormula: '#{amountTTC}',
          isVariable: false
        }
      ]
    },
    {
      id: 'template_inventory_out',
      name: 'Sortie de stock',
      description: 'Template pour les sorties de stock',
      category: 'other',
      isRecurring: false,
      accounts: [
        {
          id: '1',
          accountType: 'debit',
          accountNumber: '607100',
          label: 'Achats de marchandises',
          amountFormula: '#{costPrice}',
          isVariable: false
        },
        {
          id: '2',
          accountType: 'credit',
          accountNumber: '370000',
          label: 'Stocks de marchandises',
          amountFormula: '#{costPrice}',
          isVariable: false
        }
      ]
    },
    {
      id: 'template_depreciation',
      name: 'Dotation aux amortissements',
      description: 'Template pour les dotations aux amortissements',
      category: 'other',
      isRecurring: true,
      accounts: [
        {
          id: '1',
          accountType: 'debit',
          accountNumber: '681100',
          label: 'Dotations aux amortissements',
          amountFormula: '#{depreciationAmount}',
          isVariable: false
        },
        {
          id: '2',
          accountType: 'credit',
          accountNumber: '281200',
          label: 'Amortissements des immobilisations',
          amountFormula: '#{depreciationAmount}',
          isVariable: false
        }
      ]
    },
    {
      id: 'template_tax_payment',
      name: 'Paiement TVA',
      description: 'Template pour le paiement de la TVA',
      category: 'other',
      isRecurring: true,
      accounts: [
        {
          id: '1',
          accountType: 'debit',
          accountNumber: '445500',
          label: 'TVA à décaisser',
          amountFormula: '#{taxAmount}',
          isVariable: false
        },
        {
          id: '2',
          accountType: 'credit',
          accountNumber: '512100',
          label: 'Banques - Compte courant',
          amountFormula: '#{taxAmount}',
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
    variables: Record<string, unknown>,
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
      date: (variables.date as string) || new Date().toISOString(),
      description: this.interpolateString(template.description, variables),
      reference: (variables.reference as string) || '',
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
    variables: Record<string, unknown>,
    companyId: string
  ): Promise<Array<{
    accountId: string;
    debitAmount: number;
    creditAmount: number;
    description: string;
    auxiliaryAccount?: string;
  }>> {
    const items: Array<{
      accountId: string;
      debitAmount: number;
      creditAmount: number;
      description: string;
      auxiliaryAccount?: string;
    }> = [];

    // Résoudre tous les IDs de comptes en parallèle
    const accountIds = await Promise.all(
      template.accounts.map(templateAccount => this.resolveAccountId(templateAccount, companyId))
    );

    for (let i = 0; i < template.accounts.length; i++) {
      const templateAccount = template.accounts[i];
      const accountId = accountIds[i];
      
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
        auxiliaryAccount: typeof variables.auxiliaryAccount === 'string' ? variables.auxiliaryAccount : undefined,
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
  private static calculateAmount(formula: string, variables: Record<string, unknown>): number {
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
      // Évaluation sécurisée de l'expression mathématique
      // Pour des raisons de sécurité, on utilise une approche plus restrictive
      const result = this.safeEvalMath(cleanExpression);
      return Math.round(result * 100) / 100; // Arrondi à 2 décimales
    } catch (_error) {
      throw new Error(`Expression invalide: ${cleanExpression}`);
    }
  }

  /**
   * Évaluation mathématique sécurisée sans eval()
   */
  private static safeEvalMath(expression: string): number {
    // Approche simplifiée pour les expressions de base
    // Supporte seulement les opérations de base sans parenthèses imbriquées
    try {
      // Remplacement des espaces
      const expr = expression.replace(/\s+/g, '');
      
      // Validation basique
      if (!/^[\d+\-*/.()]+$/.test(expr)) {
        throw new Error('Expression invalide');
      }
      
      // Pour la simplicité, on utilise une approche basique
      // En production, considérez une bibliothèque dédiée
      return this.simpleMathEval(expr);
    } catch (_error) {
      throw new Error('Erreur d\'évaluation mathématique');
    }
  }

  /**
   * Évaluation mathématique simple
   */
  private static simpleMathEval(expr: string): number {
    // Gestion basique des parenthèses
    const parenMatch = expr.match(/\(([^()]+)\)/);
    if (parenMatch) {
      const innerResult = this.simpleMathEval(parenMatch[1]);
      return this.simpleMathEval(expr.replace(parenMatch[0], innerResult.toString()));
    }
    
    // Gestion des opérateurs par priorité
    const mulDivMatch = expr.match(/([\d.]+)([*/])([\d.]+)/);
    if (mulDivMatch) {
      const a = parseFloat(mulDivMatch[1]);
      const b = parseFloat(mulDivMatch[3]);
      const result = mulDivMatch[2] === '*' ? a * b : a / b;
      return this.simpleMathEval(expr.replace(mulDivMatch[0], result.toString()));
    }
    
    const addSubMatch = expr.match(/([\d.]+)([+-])([\d.]+)/);
    if (addSubMatch) {
      const a = parseFloat(addSubMatch[1]);
      const b = parseFloat(addSubMatch[3]);
      const result = addSubMatch[2] === '+' ? a + b : a - b;
      return this.simpleMathEval(expr.replace(addSubMatch[0], result.toString()));
    }
    
    // Si c'est juste un nombre
    const num = parseFloat(expr);
    if (!isNaN(num)) {
      return num;
    }
    
    throw new Error('Expression non reconnue');
  }

  /**
   * Interpolation de chaînes avec variables
   */
  private static interpolateString(template: string, variables: Record<string, unknown>): string {
    return template.replace(/#{(\w+)}/g, (match, varName) => {
      return variables[varName]?.toString() || match;
    });
  }

  /**
   * Évaluation des conditions
   */
  private static evaluateConditions(
    conditions: TemplateCondition[],
    variables: Record<string, unknown>
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
    variables: Record<string, unknown>,
    companyId: string
  ): Promise<Array<{
    accountId: string;
    debitAmount: number;
    creditAmount: number;
    description: string;
  }>> {
    const vatItems: Array<{
      accountId: string;
      debitAmount: number;
      creditAmount: number;
      description: string;
    }> = [];

    // Calculer tous les montants et comptes en parallèle
    const vatPromises = vatRules.map(async (rule) => {
      const baseAmount = typeof variables.amountHT === 'number' ? variables.amountHT :
                        (typeof variables.amount === 'number' ? variables.amount : 0);
      const vatAmount = Math.round(baseAmount * rule.rate * 100) / 100;

      if (vatAmount === 0) return null;

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

      if (!vatAccount.data) return null;

      return {
        accountId: vatAccount.data.id,
        debitAmount: rule.deductible ? vatAmount : 0,
        creditAmount: rule.deductible ? 0 : vatAmount,
        description: `TVA ${rule.rate * 100}% ${rule.deductible ? 'déductible' : 'collectée'}`,
      };
    });

    const vatResults = await Promise.all(vatPromises);
    vatItems.push(...vatResults.filter(item => item !== null));

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
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
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
      .gte('date', checkDate.toISOString())
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
  ): Promise<Record<string, unknown>> {
    const variables: Record<string, unknown> = {
      date: new Date().toISOString(),
      reference: `AUTO-${template.name}-${new Date().toISOString().slice(0, 7)}`
    };

    // Variables spécifiques par catégorie
    switch (template.category) {
      case 'other': {// Paie par exemple
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