#!/usr/bin/env python3
"""
Fix onboarding RLS 403 error by removing .select().single() after company INSERT
"""

# Read the file
with open('src/contexts/OnboardingContextNew.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the problematic section
old_code = '''    // Insertion directe dans Supabase (trigger corrigé)
    let { data: company, error: companyError } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (companyError) {
      devLogger.error('❌ [OnboardingContextNew] Company creation error:', companyError);

      // Gestion spéciale des erreurs RLS/500 - tentative avec Service Role
      if (companyError.message?.includes('500') ||
          companyError.message?.includes('policy') ||
          companyError.message?.includes('RLS') ||
          companyError.message?.includes('Internal Server Error')) {

        devLogger.warn('🔄 Erreur RLS détectée - tentative de création simplifiée');

        // Tentative avec données minimales pour contourner RLS
        const minimalCompanyData = {
          id: companyId,
          name: state.data.companyProfile.name || 'Ma Société',
          country: state.data.companyProfile.country || 'FR',
          default_currency: state.data.companyProfile.currency || 'EUR',
          owner_id: user.id,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: retryCompany, error: retryError } = await supabase
          .from('companies')
          .insert(minimalCompanyData)
          .select()
          .single();

        if (retryError) {
          devLogger.error('❌ Échec de la création simplifiée aussi:', retryError);
          throw new Error(`Impossible de créer l'entreprise. Erreur: ${retryError.message}`);
        }

        // Succès avec données simplifiées
        company = retryCompany;
        devLogger.warn('✅ Entreprise créée avec données minimales');
      } else {
        throw new Error(`Failed to create company: ${companyError.message}`);
      }
    }

      if (!company) throw new Error('Failed to create company - no data returned');'''

new_code = '''    // FIX: Remove .select().single() to avoid RLS 403 error
    // Since we generate the ID client-side, we don't need to read it back
    // The SELECT policies require the company to exist in user_companies, which doesn't exist yet
    const { error: companyError } = await supabase
      .from('companies')
      .insert(companyData);

    if (companyError) {
      devLogger.error('❌ [OnboardingContextNew] Company creation error:', companyError);
      throw new Error(`Failed to create company: ${companyError.message}`);
    }

    // Use the company data we prepared (we already have all the fields including ID)
    const company = companyData;
    devLogger.log('✅ Company created successfully:', company.id);'''

if old_code in content:
    content = content.replace(old_code, new_code)
    print("OK Found and replaced the problematic code")
else:
    print("ERROR: Could not find the exact code to replace")
    print("Trying to find similar patterns...")
    if "let { data: company, error: companyError }" in content:
        print("Found the variable declaration")
    if ".select()" in content and "companies" in content:
        print("Found .select() calls")
    exit(1)

# Write back
with open('src/contexts/OnboardingContextNew.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("OK Successfully fixed OnboardingContextNew.tsx")
print("OK Removed .select().single() to avoid RLS 403 error")
print("OK Company data now used directly without reading back from database")
