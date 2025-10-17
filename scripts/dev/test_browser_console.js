// Test direct de getCurrentSubscription depuis la console du navigateur
// À coller dans la console du navigateur sur la page de l'app

// Attendre que Supabase soit chargé
setTimeout(async () => {
  try {
    console.log('🧪 Test direct getCurrentSubscription...');

    // Importer supabase depuis la fenêtre
    const { supabase } = window;

    if (!supabase) {
      console.error('❌ Supabase non trouvé dans window');
      return;
    }

    // Test de la requête exacte
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id, user_id, plan_id, stripe_subscription_id, stripe_customer_id, status,
        current_period_start, current_period_end, cancel_at_period_end, canceled_at,
        trial_start, trial_end, created_at, updated_at, company_id, cancel_at,
        cancel_reason, metadata,
        subscription_plans (id, name, price, currency, interval_type, billing_period, is_trial, trial_days, stripe_price_id, is_active)
      `)
      .eq('user_id', '67dbeb39-a0cf-4265-a2ec-e07571632a70')
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Erreur Supabase:', error);
    } else {
      console.log('✅ Succès:', data);
    }

  } catch (err) {
    console.error('❌ Erreur:', err);
  }
}, 2000);