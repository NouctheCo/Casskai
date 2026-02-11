/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

/**
 * Validation Schemas
 * Schémas Zod pour la validation des formulaires avec messages en français
 */

import { z } from 'zod';

/**
 * Schéma de validation pour l'authentification
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est obligatoire')
    .email('Adresse email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe est trop long'),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est obligatoire')
    .email('Adresse email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
  firstName: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom est trop long'),
  lastName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom est trop long'),
  companyName: z
    .string()
    .min(2, 'Le nom de l\'entreprise doit contenir au moins 2 caractères')
    .max(100, 'Le nom de l\'entreprise est trop long'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

/**
 * Schéma de validation pour les employés
 */
export const createEmployeeSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom est trop long'),
  lastName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom est trop long'),
  email: z
    .string()
    .email('Adresse email invalide')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\d\s+().-]+$/, 'Numéro de téléphone invalide')
    .optional()
    .or(z.literal('')),
  position: z
    .string()
    .min(2, 'Le poste doit contenir au moins 2 caractères')
    .max(100, 'Le poste est trop long'),
  department: z
    .string()
    .min(1, 'Le département est obligatoire'),
  employeeNumber: z
    .string()
    .min(1, 'Le matricule est obligatoire')
    .max(50, 'Le matricule est trop long'),
  hireDate: z
    .string()
    .min(1, 'La date d\'embauche est obligatoire')
    .refine((date) => !isNaN(Date.parse(date)), 'Date invalide'),
  salary: z
    .number()
    .min(0, 'Le salaire doit être positif')
    .optional(),
  contractType: z
    .enum(['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'], {
      errorMap: () => ({ message: 'Type de contrat invalide' }),
    }),
  status: z
    .enum(['active', 'inactive', 'on_leave'], {
      errorMap: () => ({ message: 'Statut invalide' }),
    })
    .default('active'),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

/**
 * Schéma de validation pour les employés (snake_case pour EmployeeFormModal)
 */
export const employeeFormSchema = z.object({
  first_name: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom est trop long'),
  last_name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom est trop long'),
  email: z
    .string()
    .email('Adresse email invalide'),
  phone: z
    .string()
    .regex(/^[\d\s+().-]+$/, 'Numéro de téléphone invalide')
    .optional()
    .or(z.literal('')),
  position: z
    .string()
    .min(2, 'Le poste doit contenir au moins 2 caractères')
    .max(100, 'Le poste est trop long'),
  department: z
    .string()
    .min(1, 'Le département est obligatoire'),
  hire_date: z
    .string()
    .min(1, 'La date d\'embauche est obligatoire')
    .refine((date) => !isNaN(Date.parse(date)), 'Date invalide'),
  salary: z
    .string()
    .optional(),
  salary_currency: z
    .string()
    .length(3, 'Le code devise doit contenir 3 lettres')
    .default('EUR'),
  contract_type: z
    .enum(['cdi', 'cdd', 'interim', 'stage', 'apprentissage', 'freelance'], {
      errorMap: () => ({ message: 'Type de contrat invalide' }),
    }),
  status: z
    .enum(['active', 'inactive', 'on_leave', 'terminated'], {
      errorMap: () => ({ message: 'Statut invalide' }),
    })
    .default('active'),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

/**
 * Schéma de validation pour les factures
 */
const invoiceSchemaBase = z.object({
  invoiceNumber: z
    .string()
    .min(1, 'Le numéro de facture est obligatoire')
    .max(50, 'Le numéro de facture est trop long'),
  clientId: z
    .string()
    .min(1, 'Le client est obligatoire'),
  issueDate: z
    .string()
    .min(1, 'La date d\'émission est obligatoire')
    .refine((date) => !isNaN(Date.parse(date)), 'Date invalide'),
  dueDate: z
    .string()
    .min(1, 'La date d\'échéance est obligatoire')
    .refine((date) => !isNaN(Date.parse(date)), 'Date invalide'),
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'La description est obligatoire'),
        quantity: z.number().min(1, 'La quantité doit être au moins 1'),
        unitPrice: z.number().min(0, 'Le prix unitaire doit être positif'),
        vatRate: z.number().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100'),
      })
    )
    .min(1, 'Au moins un article est obligatoire'),
  status: z
    .enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'], {
      errorMap: () => ({ message: 'Statut invalide' }),
    })
    .default('draft'),
  notes: z.string().optional(),
});

export const createInvoiceSchema = invoiceSchemaBase.refine(
  (data) => new Date(data.dueDate) >= new Date(data.issueDate),
  {
    message: 'La date d\'échéance doit être postérieure à la date d\'émission',
    path: ['dueDate'],
  }
);

export const updateInvoiceSchema = invoiceSchemaBase.partial();

/**
 * Schéma de validation pour les paramètres de l'entreprise
 */
export const companySettingsSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom de l\'entreprise doit contenir au moins 2 caractères')
    .max(100, 'Le nom de l\'entreprise est trop long'),
  siret: z
    .string()
    .regex(/^\d{14}$/, 'Le SIRET doit contenir 14 chiffres')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .min(5, 'L\'adresse doit contenir au moins 5 caractères')
    .max(200, 'L\'adresse est trop longue')
    .optional(),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres')
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .min(2, 'La ville doit contenir au moins 2 caractères')
    .max(100, 'La ville est trop longue')
    .optional(),
  country: z
    .string()
    .length(2, 'Le code pays doit contenir 2 lettres')
    .default('FR'),
  phone: z
    .string()
    .regex(/^[\d\s+().-]+$/, 'Numéro de téléphone invalide')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Adresse email invalide')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('URL invalide')
    .optional()
    .or(z.literal('')),
  currency: z
    .string()
    .length(3, 'Le code devise doit contenir 3 lettres')
    .default('EUR'),
  fiscalYear: z
    .enum(['calendar', 'custom'], {
      errorMap: () => ({ message: 'Exercice fiscal invalide' }),
    })
    .default('calendar'),
  taxId: z
    .string()
    .min(1, 'Le numéro de TVA intracommunautaire est obligatoire')
    .optional()
    .or(z.literal('')),
  legalForm: z
    .string()
    .min(1, 'La forme juridique est obligatoire')
    .optional(),
});

/**
 * Schéma de validation pour les clients
 */
export const createClientSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom est trop long'),
  company: z
    .string()
    .max(100, 'Le nom de l\'entreprise est trop long')
    .optional(),
  email: z
    .string()
    .email('Adresse email invalide')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\d\s+().-]+$/, 'Numéro de téléphone invalide')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(200, 'L\'adresse est trop longue')
    .optional(),
  city: z
    .string()
    .max(100, 'La ville est trop longue')
    .optional(),
  postalCode: z
    .string()
    .max(20, 'Le code postal est trop long')
    .optional(),
  country: z
    .string()
    .length(2, 'Le code pays doit contenir 2 lettres')
    .default('FR'),
  taxId: z
    .string()
    .max(50, 'Le numéro de TVA est trop long')
    .optional(),
  type: z
    .enum(['individual', 'company'], {
      errorMap: () => ({ message: 'Type de client invalide' }),
    })
    .default('individual'),
});

export const updateClientSchema = createClientSchema.partial();

/**
 * Schéma de validation pour les budgets
 */
const budgetSchemaBase = z.object({
  name: z
    .string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom est trop long'),
  description: z
    .string()
    .max(500, 'La description est trop longue')
    .optional(),
  fiscalYear: z
    .number()
    .min(2000, 'Année fiscale invalide')
    .max(2100, 'Année fiscale invalide'),
  startDate: z
    .string()
    .min(1, 'La date de début est obligatoire')
    .refine((date) => !isNaN(Date.parse(date)), 'Date invalide'),
  endDate: z
    .string()
    .min(1, 'La date de fin est obligatoire')
    .refine((date) => !isNaN(Date.parse(date)), 'Date invalide'),
  totalBudget: z
    .number()
    .min(0, 'Le budget total doit être positif'),
  status: z
    .enum(['draft', 'active', 'closed'], {
      errorMap: () => ({ message: 'Statut invalide' }),
    })
    .default('draft'),
});

export const createBudgetSchema = budgetSchemaBase.refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'La date de fin doit être postérieure à la date de début',
    path: ['endDate'],
  }
);

export const updateBudgetSchema = budgetSchemaBase.partial();

/**
 * Schéma de validation pour les écritures comptables
 */
export const createJournalEntrySchema = z.object({
  entryDate: z
    .string()
    .min(1, 'La date est obligatoire')
    .refine((date) => !isNaN(Date.parse(date)), 'Date invalide'),
  description: z
    .string()
    .min(3, 'La description doit contenir au moins 3 caractères')
    .max(500, 'La description est trop longue'),
  referenceNumber: z
    .string()
    .max(50, 'Le numéro de référence est trop long')
    .optional(),
  journalId: z
    .string()
    .min(1, 'Le journal est obligatoire'),
  items: z
    .array(
      z.object({
        accountId: z.string().min(1, 'Le compte est obligatoire'),
        label: z.string().min(1, 'Le libellé est obligatoire'),
        debit: z.number().min(0, 'Le débit doit être positif').default(0),
        credit: z.number().min(0, 'Le crédit doit être positif').default(0),
      })
    )
    .min(2, 'Au moins deux lignes sont obligatoires')
    .refine(
      (items) => {
        const totalDebit = items.reduce((sum, item) => sum + item.debit, 0);
        const totalCredit = items.reduce((sum, item) => sum + item.credit, 0);
        return Math.abs(totalDebit - totalCredit) < 0.01;
      },
      {
        message: 'Le total des débits doit être égal au total des crédits',
      }
    ),
});

export const updateJournalEntrySchema = createJournalEntrySchema.partial();

/**
 * Export de tous les schémas
 */
export const validationSchemas = {
  login: loginSchema,
  register: registerSchema,
  createEmployee: createEmployeeSchema,
  updateEmployee: updateEmployeeSchema,
  createInvoice: createInvoiceSchema,
  updateInvoice: updateInvoiceSchema,
  companySettings: companySettingsSchema,
  createClient: createClientSchema,
  updateClient: updateClientSchema,
  createBudget: createBudgetSchema,
  updateBudget: updateBudgetSchema,
  createJournalEntry: createJournalEntrySchema,
  updateJournalEntry: updateJournalEntrySchema,
};

export default validationSchemas;
