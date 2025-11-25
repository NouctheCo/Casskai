#!/usr/bin/env python3
"""
Replace company creation with atomic PostgreSQL function call
"""

# Read the file
with open('src/contexts/OnboardingContextNew.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find start and end lines to replace (492-571)
start_line = 491  # 0-indexed, so line 492
end_line = 571    # 0-indexed, so line 572

# New code to insert
new_code = '''    devLogger.log('📤 [OnboardingContextNew] Company data to insert via Supabase:', companyData);

    // FIX: Use PostgreSQL function to create company and user_companies atomically
    // This bypasses RLS issues by using SECURITY DEFINER
    try {
      const { data: result, error: rpcError } = await supabase.rpc('create_company_with_user', {
        p_company_id: companyId,
        p_user_id: user.id,
        p_company_data: companyData
      });

      if (rpcError) {
        devLogger.error('❌ [OnboardingContextNew] RPC error:', rpcError);
        throw new Error(`Failed to create company: ${rpcError.message}`);
      }

      if (!result || result.success !== true) {
        const errorMsg = result?.error || 'Unknown error from database function';
        devLogger.error('❌ [OnboardingContextNew] Function returned error:', errorMsg);
        throw new Error(`Failed to create company: ${errorMsg}`);
      }

      devLogger.log('✅ Company and user_companies created successfully:', companyId);
    } catch (err: any) {
      devLogger.error('❌ [OnboardingContextNew] Company creation failed:', err);
      throw new Error(`Failed to create company: ${err.message}`);
    }

    // Use the company data we prepared (we already have all the fields including ID)
    const company = companyData;

'''

# Replace lines
new_lines = lines[:start_line] + [new_code] + lines[end_line:]

# Write back
with open('src/contexts/OnboardingContextNew.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("OK Successfully updated OnboardingContextNew.tsx")
print("OK Replaced company creation with atomic PostgreSQL function")
print("OK Company and user_companies will now be created atomically")
