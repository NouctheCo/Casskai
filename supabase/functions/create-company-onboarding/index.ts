// SOLUTION TEMPORAIRE EDGE FUNCTION POUR ONBOARDING
// À déployer comme Edge Function Supabase

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { companyData, userId } = await req.json()

    console.log('🔧 [Edge Function] Creating company with admin client:', companyData)

    // Create company directly with admin client (bypasses all RLS/triggers)
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        id: companyData.id,
        name: companyData.name,
        country: companyData.country,
        default_currency: companyData.default_currency,
        timezone: companyData.timezone,
        share_capital: companyData.share_capital,
        ceo_name: companyData.ceo_name,
        sector: companyData.sector,
        ceo_title: companyData.ceo_title,
        industry_type: companyData.industry_type,
        company_size: companyData.company_size,
        registration_date: companyData.registration_date,
        phone: companyData.phone,
        email: companyData.email,
        website: companyData.website,
        owner_id: companyData.owner_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single()

    if (companyError) {
      console.error('❌ [Edge Function] Company creation error:', companyError)
      throw companyError
    }

    // Create user-company relationship
    const { error: userCompanyError } = await supabaseAdmin
      .from('user_companies')
      .insert({
        id: crypto.randomUUID(),
        user_id: userId,
        company_id: company.id,
        role: 'owner',
        permissions: { admin: true, read: true, write: true, delete: true },
        created_at: new Date().toISOString()
      })

    if (userCompanyError) {
      console.error('❌ [Edge Function] User-company relationship error:', userCompanyError)
      throw userCompanyError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { company, user_company: true } 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ [Edge Function] Fatal error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})