const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createInventoryTables() {
  try {
    console.log('Vérification des tables existantes...');

    // Vérifier si inventory_items existe
    const { data: inventoryTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['inventory_items', 'stock_movements', 'suppliers']);

    if (checkError) {
      console.log('Impossible de vérifier les tables existantes, tentative de création...');
    }

    const existingTables = checkError ? [] : inventoryTables.map(t => t.table_name);

    // Créer inventory_items si elle n'existe pas
    if (!existingTables.includes('inventory_items')) {
      console.log('Création de la table inventory_items...');

      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE public.inventory_items (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            company_id UUID NOT NULL,
            reference TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            unit TEXT NOT NULL DEFAULT 'Pièce',
            purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
            selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
            current_stock INTEGER NOT NULL DEFAULT 0,
            min_stock INTEGER NOT NULL DEFAULT 0,
            max_stock INTEGER NOT NULL DEFAULT 100,
            location TEXT,
            supplier TEXT,
            barcode TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            last_movement TIMESTAMP WITH TIME ZONE,
            avg_cost DECIMAL(10,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE INDEX idx_inventory_items_company_id ON public.inventory_items(company_id);
          CREATE INDEX idx_inventory_items_category ON public.inventory_items(category);
          CREATE INDEX idx_inventory_items_status ON public.inventory_items(status);
        `
      });

      if (error) {
        console.log('Erreur lors de la création de inventory_items:', error.message);
        // Essayer avec une requête directe
        await createTableDirectly('inventory_items');
      } else {
        console.log('✅ Table inventory_items créée');
      }
    } else {
      console.log('✅ Table inventory_items existe déjà');
    }

    // Insérer des données de test
    console.log('Insertion de données de test...');
    const { error: insertError } = await supabase
      .from('inventory_items')
      .insert([
        {
          company_id: 'current-company',
          reference: 'LAP-001',
          name: 'Ordinateur portable Dell XPS 13',
          description: 'Laptop professionnel haute performance',
          category: 'Matériel informatique',
          unit: 'Pièce',
          purchase_price: 1200.00,
          selling_price: 1800.00,
          current_stock: 15,
          min_stock: 5,
          max_stock: 50,
          location: 'Entrepôt A - Allée 1',
          supplier: 'Dell France',
          barcode: '123456789012',
          status: 'active',
          avg_cost: 1150.00
        },
        {
          company_id: 'current-company',
          reference: 'SOU-002',
          name: 'Souris sans fil Logitech',
          description: 'Souris ergonomique sans fil',
          category: 'Accessoires',
          unit: 'Pièce',
          purchase_price: 25.00,
          selling_price: 45.00,
          current_stock: 3,
          min_stock: 10,
          max_stock: 100,
          location: 'Entrepôt A - Allée 2',
          supplier: 'Logitech International',
          barcode: '234567890123',
          status: 'low_stock',
          avg_cost: 23.50
        }
      ]);

    if (insertError) {
      console.log('Erreur lors de l\'insertion des données:', insertError.message);
    } else {
      console.log('✅ Données de test insérées');
    }

    console.log('🎉 Configuration terminée !');

  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function createTableDirectly(tableName) {
  try {
    // Essayer d'insérer une ligne factice pour créer la table implicitement
    const { error } = await supabase
      .from(tableName)
      .insert({
        company_id: 'test',
        reference: 'TEST',
        name: 'Test Item',
        category: 'Test',
        unit: 'Pièce',
        purchase_price: 0,
        selling_price: 0,
        current_stock: 0,
        min_stock: 0,
        max_stock: 100,
        status: 'active'
      });

    if (error && error.code === '42P01') {
      console.log(`Table ${tableName} n'existe pas, création nécessaire via SQL direct`);
    }
  } catch (e) {
    console.log(`Erreur lors de la création directe de ${tableName}:`, e.message);
  }
}

createInventoryTables();
