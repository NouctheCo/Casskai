# 🔧 Corrections CRM - Résumé des changements

## 🐛 Problèmes identifiés

1. **Ordre des paramètres inversé dans getContacts()**
   - Signature actuelle : `getContacts(clientId?: string, companyId?: string)`
   - Appel dans hook : `getContacts(currentCompany.id, clientId)` ❌
   - **Correction** : Inverser la signature en `getContacts(companyId?: string, clientId?: string)`

2. **CA (Chiffre d'affaires) incorrect**
   - Calcul actuel : basé uniquement sur opportunités gagnées
   - **Correction** : Utiliser le solde du compte auxiliaire comptable (`customer_account_id`)

3. **Décompte de contacts manquant**
   - Pas de comptage des contacts par client
   - **Correction** : Ajouter `contact_count` dans l'objet Client

## ✅ Modifications appliquées

### 1. crmService.ts - Ligne 434 (getContacts)
```typescript
// AVANT
async getContacts(clientId?: string, companyId?: string): Promise<CrmServiceResponse<Contact[]>> {

// APRÈS
async getContacts(companyId?: string, clientId?: string): Promise<CrmServiceResponse<Contact[]>> {
```

### 2. crmService.ts - Lignes 118-159 (getClients - CA comptable)
```typescript
// AVANT
// Calculer le CA depuis les opportunités gagnées
const { data: wonOpportunities } = await supabase
  .from('crm_opportunities')
  .select('value, crm_stages!inner(is_closed_won)')
  .eq('client_id', client.id)
  .eq('crm_stages.is_closed_won', true);
const total_revenue = wonOpportunities?.reduce((sum, opp) => sum + (opp.value || 0), 0) || 0;

// APRÈS
// ✅ Récupérer le CA réel depuis le compte auxiliaire comptable
let total_revenue = 0;
if (client.customer_account_id) {
  const { data: accountData } = await supabase
    .from('chart_of_accounts')
    .select('current_balance')
    .eq('id', client.customer_account_id)
    .maybeSingle();
  // Le solde comptable client est généralement au débit (positif = CA)
  total_revenue = Math.abs(Number(accountData?.current_balance || 0));
} else {
  // Fallback : calculer depuis les opportunités gagnées si pas de compte auxiliaire
  const { data: wonOpportunities } = await supabase
    .from('crm_opportunities')
    .select('value, crm_stages!inner(is_closed_won)')
    .eq('client_id', client.id)
    .eq('crm_stages.is_closed_won', true);
  total_revenue = wonOpportunities?.reduce((sum, opp) => sum + (opp.value || 0), 0) || 0;
}

// Compter le nombre de contacts pour ce client
const { count: contactCount } = await supabase
  .from('crm_contacts')
  .select('*', { count: 'exact', head: true })
  .eq('client_id', client.id);
```

### 3. crmService.ts - Ligne 175 (return Client)
```typescript
return {
  id: client.id,
  enterprise_id: enterpriseId,
  company_name: client.name,
  industry: client.internal_notes || undefined,
  size: undefined,
  address: client.billing_address_line1 || client.address_line1,
  city: client.billing_city || client.city,
  postal_code: client.billing_postal_code || client.postal_code,
  country: client.billing_country || client.country,
  website: client.website,
  notes: client.notes,
  status: client.client_type === 'customer' ? 'active' : 'prospect',
  total_revenue,
  contact_count: contactCount || 0, // ✅ AJOUTÉ
  last_interaction: lastAction?.completed_date || lastAction?.due_date || null,
  created_at: client.created_at,
  updated_at: client.updated_at
};
```

### 4. crm.types.ts - Ligne 84 (type Client)
```typescript
// AVANT
total_revenue?: number;
last_interaction?: string;

// APRÈS
total_revenue?: number;
contact_count?: number; // ✅ AJOUTÉ - Nombre de contacts liés
last_interaction?: string;
```

## 🎯 Résultat attendu

✅ Les contacts créés s'affichent immédiatement dans la liste
✅ Le décompte de contacts par client est exact
✅ Le CA affiché provient du solde comptable (compte auxiliaire)
✅ Fallback sur opportunités si pas de compte comptable

## 📝 Notes techniques

- **third_parties.customer_account_id** → FK vers chart_of_accounts
- **third_parties.current_balance** → Solde actuel du compte
- Le CA comptable est prioritaire sur le CA CRM (opportunités)
- Le comptage de contacts utilise `.select('*', { count: 'exact', head: true })` pour optimiser les performances
