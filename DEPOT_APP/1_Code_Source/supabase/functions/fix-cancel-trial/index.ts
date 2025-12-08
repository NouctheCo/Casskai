import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://smtdtgrymuzwvctattmx.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU3NjAyMywiZXhwIjoyMDcwMTUyMDIzfQ.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    })
  }

  try {
    // Execute the SQL to fix the cancel_trial function
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `CREATE OR REPLACE FUNCTION cancel_trial(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    trial_subscription_id UUID;
BEGIN
    -- Find active trial subscription
    SELECT id INTO trial_subscription_id
    FROM subscriptions
    WHERE user_id = p_user_id
    AND status = 'trialing'
    AND plan_id = 'trial';

    -- If no active trial found
    IF trial_subscription_id IS NULL THEN
        RETURN 'NO_ACTIVE_TRIAL';
    END IF;

    -- Cancel the trial
    UPDATE subscriptions
    SET status = 'canceled',
        canceled_at = NOW(),
        cancel_reason = p_reason,
        updated_at = NOW()
    WHERE id = trial_subscription_id;

    RETURN 'SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error canceling trial: %', SQLERRM;
END;
$$;`
    });

    if (error) {
      console.error('Error executing SQL:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Function error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})