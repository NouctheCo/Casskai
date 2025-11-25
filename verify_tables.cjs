const { Client } = require('pg');

async function verifyTables() {
  const client = new Client({
    host: 'db.smtdtgrymuzwvctattmx.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Jcvd1960#'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check tables
    const tablesQuery = `
      SELECT table_name,
             (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name=t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
        AND table_name IN ('hr_document_templates', 'hr_generated_documents', 'hr_document_archive')
      ORDER BY table_name;
    `;

    const { rows: tables } = await client.query(tablesQuery);

    console.log('📋 Tables HR Documents:');
    if (tables.length === 0) {
      console.log('❌ Aucune table trouvée! Les migrations n\'ont peut-être pas été appliquées.');
    } else {
      tables.forEach(table => {
        console.log(`  ✅ ${table.table_name} (${table.column_count} colonnes)`);
      });
    }

    // Check functions
    console.log('\n🔧 Fonctions:');
    const functionsQuery = `
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name IN ('get_next_archive_reference', 'auto_archive_document', 'calculate_archive_retention')
      ORDER BY routine_name;
    `;

    const { rows: functions } = await client.query(functionsQuery);
    if (functions.length === 0) {
      console.log('❌ Aucune fonction trouvée!');
    } else {
      functions.forEach(func => {
        console.log(`  ✅ ${func.routine_name}()`);
      });
    }

    // Check storage bucket
    console.log('\n📦 Storage Bucket:');
    const bucketQuery = `
      SELECT id, name, public, file_size_limit
      FROM storage.buckets
      WHERE id = 'hr-documents';
    `;

    const { rows: buckets } = await client.query(bucketQuery);
    if (buckets.length === 0) {
      console.log('❌ Bucket hr-documents non trouvé!');
    } else {
      const bucket = buckets[0];
      console.log(`  ✅ ${bucket.id} (${bucket.public ? 'public' : 'privé'}, limite: ${(bucket.file_size_limit / 1024 / 1024).toFixed(2)} MB)`);
    }

    // Check RLS policies
    console.log('\n🔒 RLS Policies:');
    const rlsQuery = `
      SELECT schemaname, tablename, policyname
      FROM pg_policies
      WHERE tablename IN ('hr_document_templates', 'hr_generated_documents', 'hr_document_archive')
      ORDER BY tablename, policyname;
    `;

    const { rows: policies } = await client.query(rlsQuery);
    console.log(`  ${policies.length} policies trouvées`);
    const grouped = policies.reduce((acc, p) => {
      if (!acc[p.tablename]) acc[p.tablename] = [];
      acc[p.tablename].push(p.policyname);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([table, pols]) => {
      console.log(`  ${table}: ${pols.length} policies`);
    });

    await client.end();
    console.log('\n✅ Vérification terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

verifyTables();
