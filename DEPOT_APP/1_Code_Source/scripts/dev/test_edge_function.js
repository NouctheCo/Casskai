// Test script to check Edge function deployment
// Run this in browser console after loading the app

// Wait for app to load, then run:
setTimeout(async () => {
  try {
    console.warn('🧪 Testing Edge function deployment...');

    // Import supabase from the app (this assumes it's available globally)
    const { supabase } = window;

    if (!supabase) {
      console.error('❌ Supabase not found in window object');
      return;
    }

    console.warn('✅ Supabase found, testing function...');

    const result = await supabase.functions.invoke('create-checkout-session', {
      body: {
        planId: 'pro_monthly',
        userId: 'test-user-123',
        debug: true
      }
    });

    console.warn('🧪 Edge function test result:', result);

    if (result.error) {
      console.error('❌ Edge function error:', result.error);
    } else {
      console.warn('✅ Edge function success:', result.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}, 2000);