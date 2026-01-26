import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!url || !anonKey || !serviceKey) {
  console.error('Missing env vars VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const anonClient = createClient(url, anonKey, { auth: { persistSession: false } });

async function run() {
  const testEmail = `seed.user+${Date.now()}@example.com`;
  const testPassword = 'Test123456!';
  console.log('Creating test user:', testEmail);
  try {
    // Create user via admin
    // @ts-ignore
    const { data: user, error: createErr } = await admin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });
    if (createErr) {
      console.error('Failed to create auth user:', createErr);
      process.exit(1);
    }
    const userId = user?.id;
    console.log('Created user id:', userId);
    // Add profile
    const { data: profile } = await admin.from('user_profiles').insert({ id: userId, email: testEmail, first_name: 'Seed', last_name: 'User' }).select('*').single();
    console.log('Created profile:', profile?.id);
    // Link to company: find any company created by seed (name like Dev Test Company)
    const { data: companies } = await admin.from('companies').select('*').ilike('name', 'Dev Test Company%').limit(1);
    const company = companies && companies[0];
    if (!company) {
      console.error('No seeded company found to link user to');
      process.exit(1);
    }
    await admin.from('user_companies').insert({ user_id: userId, company_id: company.id, role: 'owner' });
    console.log('Linked user to company:', company.id);

    // Now sign in with anon client
    console.log('Signing in as test user (anon client)...');
    const signIn = await anonClient.auth.signInWithPassword({ email: testEmail, password: testPassword });
    if (signIn.error) {
      console.error('Sign-in failed:', signIn.error);
      process.exit(1);
    }
    console.log('Signed in, session present:', !!signIn.data.session);

    // Update existing entries to be owned by this user so RLS allows viewing
    const signedInUserId = signIn.data.user?.id;
    console.log('Signed-in user id:', signedInUserId);
        if (signedInUserId) {
          // Remove any placeholder null user_company rows for this company, then insert correct mapping
          await admin.from('user_companies').delete().eq('company_id', company.id).is('user_id', null);
          const { error: upsertUcErr } = await admin.from('user_companies').upsert({ user_id: signedInUserId, company_id: company.id, role: 'owner' }, { onConflict: ['user_id', 'company_id'] });
          if (upsertUcErr) {
            console.error('Failed to ensure user_companies mapping:', upsertUcErr);
          } else {
            console.log('Ensured user_companies mapping for signed-in user.');
          }

          const { error: updateErr } = await admin.from('journal_entries').update({ created_by: signedInUserId }).eq('company_id', company.id);
          if (updateErr) {
            console.error('Failed to set created_by on existing entries:', updateErr);
          } else {
            console.log('Updated existing entries to set created_by for visibility.');
          }
    }

    // Query journal entries as this user
    const { data: entries, error: entriesErr } = await anonClient
      .from('journal_entries')
      .select('id, entry_number, entry_date, description, status, company_id')
      .eq('company_id', company.id)
      .order('entry_date', { ascending: false });
    if (entriesErr) {
      console.error('Error fetching entries as user:', entriesErr);
      process.exit(1);
    }
    console.log('Entries visible to user:', entries?.length ?? 0);
    console.dir(entries, { depth: 2 });
    process.exit(0);
  } catch (e) {
    console.error('verify script failed:', e);
    process.exit(1);
  }
}

run();
