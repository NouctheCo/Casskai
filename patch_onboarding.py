#!/usr/bin/env python3
"""
Script pour corriger OnboardingContextNew.tsx
Remplace l'appel RPC create_company_with_user par create_company_with_setup
"""

file_path = 'src/contexts/OnboardingContextNew.tsx'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Check if already patched
if 'create_company_with_setup' in content and 'company_name_param' in content:
    print('✅ File already patched or using create_company_with_setup')
    exit(0)

# Try both apostrophe types
has_rpc_call = False
rpc_pattern = None

# Check for regular apostrophes first
if "await authedClient.rpc('create_company_with_user'" in content:
    print('✅ Found RPC call with regular apostrophes')
    has_rpc_call = True
    rpc_pattern = "await authedClient.rpc('create_company_with_user'"
# Check for curly apostrophes
elif "await authedClient.rpc('create_company_with_user'" in content:
    print('✅ Found RPC call with curly apostrophes')
    has_rpc_call = True
    rpc_pattern = "await authedClient.rpc('create_company_with_user'"

if has_rpc_call and rpc_pattern:
    # Find the start
    start_idx = content.find("const { data: result, error: rpcError } = ")
    
    if start_idx >= 0:
        print(f'✅ Found start at index {start_idx}')
        
        # Find the end: the last devLogger.info in this section about Company and user_companies created successfully
        # Search for the pattern within the context
        search_from = start_idx + 50
        
        # Look for devLogger.info('✅ Company and user_companies created successfully:
        success_idx = content.find("Company and user_companies created successfully:", search_from)
        
        if success_idx >= 0:
            print(f'✅ Found success message at index {success_idx}')
            end_idx = content.find(");", success_idx) + 2
            
            replacement = """const { data: newCompanyId, error: createError } = await supabase.rpc(
          'create_company_with_setup',
          {
            company_name_param: companyData.name,
            user_uuid_param: user.id,
            country_code_param: companyData.country || 'FR',
            currency_code_param: companyData.default_currency || 'EUR',
            accounting_standard_param: companyData.accounting_standard || null
          }
        );

        if (createError) {
          devLogger.error('❌ create_company_with_setup error:', createError);
          throw new Error(`Failed to create company: ${createError.message}`);
        }

        if (!newCompanyId) {
          throw new Error('No company ID returned from create_company_with_setup');
        }

        devLogger.info('✅ Company created successfully:', newCompanyId);"""
            
            # Replace
            new_content = content[:start_idx] + replacement + content[end_idx:]
            
            # Write back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print('✅ File patched successfully!')
            print('   - Replaced RPC call to create_company_with_user')
            print('   - Using create_company_with_setup instead')
        else:
            print('❌ Could not find success message')
            exit(1)
    else:
        print('❌ Could not find start of RPC block')
        exit(1)
else:
    print('⚠️  RPC call not found')
    # Try to find what's actually there
    if "await authedClient" in content:
        print('   Note: Found authedClient, RPC call might have different format')
    exit(0)
