-- Migration des données par défaut CassKai
-- Fichier: /supabase/migrations/002_default_data.sql

-- ============================================================================
-- 1. DEVISES SUPPORTÉES
-- ============================================================================

INSERT INTO currencies (code, name, symbol, decimal_places) VALUES
-- Devises principales
('EUR', 'Euro', '€', 2),
('USD', 'US Dollar', '$', 2),
('CAD', 'Canadian Dollar', 'C$', 2),
('GBP', 'British Pound', '£', 2),

-- Devises africaines (FCFA)
('XOF', 'CFA Franc BCEAO', 'CFA', 0), -- Afrique de l'Ouest
('XAF', 'CFA Franc BEAC', 'FCFA', 0), -- Afrique Centrale
('MAD', 'Moroccan Dirham', 'DH', 2),
('TND', 'Tunisian Dinar', 'TND', 3),
('EGP', 'Egyptian Pound', 'E£', 2)

ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. TAUX DE CHANGE FIXES DE BASE
-- ============================================================================

-- Taux fixes EUR-FCFA (taux officiel de parité)
INSERT INTO exchange_rates (from_currency, to_currency, rate, date, source) VALUES
('EUR', 'XOF', 655.957, CURRENT_DATE, 'fixed'),
('XOF', 'EUR', 0.001524, CURRENT_DATE, 'fixed'),
('EUR', 'XAF', 655.957, CURRENT_DATE, 'fixed'),
('XAF', 'EUR', 0.001524, CURRENT_DATE, 'fixed'),

-- Autres taux indicatifs (à actualiser via API)
('EUR', 'USD', 1.08, CURRENT_DATE, 'api'),
('USD', 'EUR', 0.926, CURRENT_DATE, 'api'),
('EUR', 'CAD', 1.45, CURRENT_DATE, 'api'),
('CAD', 'EUR', 0.690, CURRENT_DATE, 'api'),
('EUR', 'MAD', 10.5, CURRENT_DATE, 'api'),
('MAD', 'EUR', 0.095, CURRENT_DATE, 'api')

ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

-- ============================================================================
-- 3. PERMISSIONS SYSTÈME
-- ============================================================================

INSERT INTO permissions (name, description, module) VALUES
-- Dashboard
('view_dashboard', 'Voir le tableau de bord', 'dashboard'),
('manage_dashboard', 'Gérer le tableau de bord', 'dashboard'),

-- Comptabilité
('view_accounting', 'Voir la comptabilité', 'accounting'),
('manage_accounting', 'Gérer la comptabilité', 'accounting'),
('create_journal_entries', 'Créer des écritures', 'accounting'),
('validate_journal_entries', 'Valider des écritures', 'accounting'),
('manage_chart_of_accounts', 'Gérer le plan comptable', 'accounting'),
('import_fec', 'Importer FEC', 'accounting'),

-- Banking
('view_banking', 'Voir les comptes bancaires', 'banking'),
('manage_banking', 'Gérer les comptes bancaires', 'banking'),
('reconcile_transactions', 'Rapprocher les transactions', 'banking'),

-- Reports
('view_reports', 'Voir les rapports', 'reports'),
('export_reports', 'Exporter les rapports', 'reports'),

-- Forecasting
('view_forecasting', 'Voir les prévisions', 'forecasting'),
('manage_forecasting', 'Gérer les prévisions', 'forecasting'),

-- Third parties
('view_third_parties', 'Voir les tiers', 'third_parties'),
('manage_third_parties', 'Gérer les tiers', 'third_parties'),

-- Administration
('manage_company_settings', 'Gérer les paramètres entreprise', 'settings'),
('manage_company_users', 'Gérer les utilisateurs', 'settings'),
('manage_company_roles', 'Gérer les rôles', 'settings'),
('view_audit_logs', 'Voir les logs d\'audit', 'settings')

ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 4. RÔLES SYSTÈME PAR DÉFAUT
-- ============================================================================

-- Insérer les rôles système (sans company_id pour être globaux)
INSERT INTO roles (name, description, is_system_role) VALUES
('super_admin', 'Super administrateur système', true),
('admin', 'Administrateur d''entreprise', true),
('accountant', 'Comptable', true),
('user', 'Utilisateur standard', true),
('viewer', 'Consultation uniquement', true)
ON CONFLICT (name, company_id) DO NOTHING;

-- ============================================================================
-- 5. ATTRIBUTION DES PERMISSIONS AUX RÔLES SYSTÈME
-- ============================================================================

-- Super Admin : toutes les permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin' AND r.is_system_role = true;

-- Admin : toutes les permissions sauf système
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND r.is_system_role = true
  AND p.name NOT LIKE '%system%';

-- Comptable : permissions comptabilité, banking, reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'accountant' AND r.is_system_role = true
  AND p.module IN ('dashboard', 'accounting', 'banking', 'reports', 'third_parties');

-- Utilisateur : permissions de base
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'user' AND r.is_system_role = true
  AND p.name IN ('view_dashboard', 'view_accounting', 'view_banking', 'view_reports', 'view_third_parties');

-- Viewer : consultation uniquement
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer' AND r.is_system_role = true
  AND p.name LIKE 'view_%';

-- ============================================================================
-- 6. PLAN COMPTABLE FRANÇAIS (PCG) - BASE
-- ============================================================================

-- Fonction helper pour insérer les comptes comptables
CREATE OR REPLACE FUNCTION insert_default_french_accounts(company_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Classe 1 : Comptes de capitaux
  INSERT INTO accounts (company_id, account_number, name, type, class, currency) VALUES
  (company_uuid, '101000', 'Capital', 'EQUITY', 1, 'EUR'),
  (company_uuid, '106000', 'Réserves', 'EQUITY', 1, 'EUR'),
  (company_uuid, '110000', 'Report à nouveau (solde créditeur)', 'EQUITY', 1, 'EUR'),
  (company_uuid, '120000', 'Résultat de l''exercice (bénéfice)', 'EQUITY', 1, 'EUR'),
  (company_uuid, '129000', 'Résultat de l''exercice (perte)', 'EQUITY', 1, 'EUR');

  -- Classe 2 : Comptes d'immobilisations
  INSERT INTO accounts (company_id, account_number, name, type, class, currency) VALUES
  (company_uuid, '201000', 'Frais d''établissement', 'ASSET', 2, 'EUR'),
  (company_uuid, '205000', 'Concessions et droits similaires', 'ASSET', 2, 'EUR'),
  (company_uuid, '213000', 'Constructions', 'ASSET', 2, 'EUR'),
  (company_uuid, '218000', 'Autres immobilisations corporelles', 'ASSET', 2, 'EUR'),
  (company_uuid, '271000', 'Titres de participation', 'ASSET', 2, 'EUR');

  -- Classe 3 : Comptes de stocks et en-cours
  INSERT INTO accounts (company_id, account_number, name, type, class, currency) VALUES
  (company_uuid, '310000', 'Matières premières', 'ASSET', 3, 'EUR'),
  (company_uuid, '320000', 'Autres approvisionnements', 'ASSET', 3, 'EUR'),
  (company_uuid, '370000', 'Stocks de marchandises', 'ASSET', 3, 'EUR');

  -- Classe 4 : Comptes de tiers
  INSERT INTO accounts (company_id, account_number, name, type, class, currency) VALUES
  (company_uuid, '401000', 'Fournisseurs', 'LIABILITY', 4, 'EUR'),
  (company_uuid, '411000', 'Clients', 'ASSET', 4, 'EUR'),
  (company_uuid, '421000', 'Personnel - Rémunérations dues', 'LIABILITY', 4, 'EUR'),
  (company_uuid, '431000', 'Sécurité sociale', 'LIABILITY', 4, 'EUR'),
  (company_uuid, '441000', 'État - Subventions à recevoir', 'ASSET', 4, 'EUR'),
  (company_uuid, '445100', 'TVA à décaisser', 'LIABILITY', 4, 'EUR'),
  (company_uuid, '445620', 'TVA sur immobilisations', 'ASSET', 4, 'EUR'),
  (company_uuid, '445660', 'TVA sur autres biens et services', 'ASSET', 4, 'EUR'),
  (company_uuid, '445710', 'TVA collectée', 'LIABILITY', 4, 'EUR'),
  (company_uuid, '455000', 'Associés - Comptes courants', 'LIABILITY', 4, 'EUR'),
  (company_uuid, '467000', 'Autres comptes débiteurs ou créditeurs', 'ASSET', 4, 'EUR');

  -- Classe 5 : Comptes financiers
  INSERT INTO accounts (company_id, account_number, name, type, class, currency) VALUES
  (company_uuid, '512000', 'Banques', 'ASSET', 5, 'EUR'),
  (company_uuid, '530000', 'Caisse', 'ASSET', 5, 'EUR'),
  (company_uuid, '531000', 'Chèques postaux', 'ASSET', 5, 'EUR');

  -- Classe 6 : Comptes de charges
  INSERT INTO accounts (company_id, account_number, name, type, class, currency) VALUES
  (company_uuid, '601000', 'Achats stockés - Matières premières', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '607000', 'Achats de marchandises', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '611000', 'Sous-traitance générale', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '613000', 'Locations', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '614000', 'Charges locatives et de copropriété', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '615000', 'Entretien et réparations', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '616000', 'Primes d''assurances', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '618000', 'Autres services extérieurs', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '621000', 'Personnel extérieur à l''entreprise', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '622000', 'Rémunérations d''intermédiaires et honoraires', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '623000', 'Publicité, publications, relations publiques', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '624000', 'Transports de biens et transports collectifs du personnel', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '625000', 'Déplacements, missions et réceptions', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '626000', 'Frais postaux et de télécommunications', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '627000', 'Services bancaires et assimilés', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '628000', 'Divers', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '641000', 'Rémunérations du personnel', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '645000', 'Charges de sécurité sociale et de prévoyance', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '651000', 'Redevances pour concessions, brevets, licences', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '661000', 'Charges d''intérêts', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '671000', 'Charges exceptionnelles sur opérations de gestion', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '681000', 'Dotations aux amortissements', 'EXPENSE', 6, 'EUR'),
  (company_uuid, '695000', 'Impôts sur les bénéfices', 'EXPENSE', 6, 'EUR');

  -- Classe 7 : Comptes de produits
  INSERT INTO accounts (company_id, account_number, name, type, class, currency) VALUES
  (company_uuid, '701000', 'Ventes de produits finis', 'REVENUE', 7, 'EUR'),
  (company_uuid, '706000', 'Prestations de services', 'REVENUE', 7, 'EUR'),
  (company_uuid, '707000', 'Ventes de marchandises', 'REVENUE', 7, 'EUR'),
  (company_uuid, '708000', 'Produits des activités annexes', 'REVENUE', 7, 'EUR'),
  (company_uuid, '709000', 'Rabais, remises et ristournes accordés par l''entreprise', 'REVENUE', 7, 'EUR'),
  (company_uuid, '740000', 'Subventions d''exploitation', 'REVENUE', 7, 'EUR'),
  (company_uuid, '758000', 'Produits divers de gestion courante', 'REVENUE', 7, 'EUR'),
  (company_uuid, '761000', 'Produits financiers', 'REVENUE', 7, 'EUR'),
  (company_uuid, '771000', 'Produits exceptionnels sur opérations de gestion', 'REVENUE', 7, 'EUR'),
  (company_uuid, '781000', 'Reprises sur amortissements et provisions', 'REVENUE', 7, 'EUR');

END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. PLAN COMPTABLE SYSCOHADA - BASE
-- ============================================================================

-- Fonction helper pour insérer les comptes SYSCOHADA
CREATE OR REPLACE FUNCTION insert_default_syscohada_accounts(company_uuid UUID)
RETURNS void AS $
BEGIN
  -- Classe 1 : Comptes de ressources durables
  INSERT INTO accounts (company_id, account_number, name, type, class, currency) VALUES
  (company_uuid, '101', 'Capital social', 'EQUITY', 1, 'XOF'),
  (company_uuid, '106', 'Réserves', 'EQUITY', 1, 'XOF'),
  (company_uuid, '110', 'Report à nouveau', 'EQUITY', 1, 'XOF'),
  (company_uuid, '120', 'Résultat net de l''exercice', 'EQUITY', 1, 'XOF'),
  (company_uuid, '131', 'Subventions d''équipement', 'EQUITY', 1, 'XOF'),
  (company_uuid, '161', 'Emprunts obligataires', 'LIABILITY', 1, 'XOF'),
  (company_uuid, '162', 'Emprunts et dettes auprès des établissements de crédit', 'LIABILITY', 1, 'XOF'),
  (company_uuid, '163', 'Avances reçues de l''État', 'LIABILITY', 1, 'XOF'),
  (company_uuid, '164', 'Avances reçues et comptes courants bloqués', 'LIABILITY', 1, 'XOF'),
  (company_uuid, '165', 'Dépôts et cautionnements reçus', 'LIABILITY', 1, 'XOF'),
  (company_uuid, '166', 'Intérêts courus', 'LIABILITY', 1, 'XOF'),
  (company_uuid, '181', 'Comptes de liaison des établissements et succursales', 'EQUITY', 1, 'XOF'),
  (company_uuid, '188', 'Biens remis en consignation', 'EQUITY', 1, 'XOF');

  -- Classe 2 : Comptes d'actif immobilisé
  INSERT INTO accounts (company_id, account_number, name, type, class, currency) VALUES
  (company_uuid, '201', 'Frais d''établissement', 'ASSET', 2, 'XOF'),
  (company_uuid, '205', 'Concessions et droits similaires, brevets, licences, marques', 'ASSET', 2, 'XOF'),
  (company_uuid, '211', 'Terrains', 'ASSET', 2, 'XOF'),
  (company_uuid, '212', 'Agencements et aménagements de terrains', 'ASSET', 2, 'XOF'),
  (company_uuid, '213', 'Constructions sur sol propre', 'ASSET', 2, 'XOF'),
  (company_uuid, '214', 'Constructions sur sol d''autrui', 'ASSET', 2, 'XOF'),
  (company_uuid, '215', 'Installations techniques, matériel et outillage industriels', 'ASSET', 2, 'XOF'),
  (company_uuid, '218', 'Autres immobilisations corporelles', 'ASSET', 2, 'XOF'),
  (company_uuid, '221', 'Immobilisations corporelles en cours', 'ASSET', 2, 'XOF'),
  (company_uuid, '238', 'Avances et acomptes versés sur commandes d''immobilisations', 'ASSET', 2, 'XOF'),
  (company_uuid, '241', 'Prêts et créances sur l''État', 'ASSET', 2, 'XOF'),
  (company_uuid, '251', 'Titres de participation', 'ASSET', 2, 'XOF'),
  (company_uuid, '261', 'Titres immobilisés', 'ASSET', 2, 'XOF'),
  (company_uuid, '271', 'Prêts et créances immobilisées', 'ASSET', 2, 'XOF'),
  (company_uuid, '275', 'Dépôts et cautionnements versés', 'ASSET', 2, 'XOF');

  -- Classe 3 : Comptes de stocks
  INSERT INTO accounts (company_id, account_number, name, type, class, currency) VALUES
  (company_uuid, '31', 'Matières premières', 'ASSET', 3, 'XOF'),
  (company_uuid, '32', 'Autres approvisionnements', 'ASSET', 3, 'XOF'),
  (company_uuid, '33', 'En-cours de production de biens', 'ASSET', 3, 'XOF'),
  (company_uuid, '34', 'En-cours de production de services', 'ASSET', 3, 'XOF'),
  (company_uuid, '35', 'Stocks de produits', 'ASSET', 3, 'XOF'),
  (company_uuid, '37', 'Stocks de marchandises', 'ASSET', 3, 'XOF'),
  (company_uuid, '38', 'Stocks en cours de route, en consignation ou en dépôt', 'ASSET', 3, 'XOF');

  -- Classe 4 : Comptes de tiers
  INSERT INTO accounts (company_id, account_number, name, type, class, currency) VALUES
  (company_uuid, '401', 'Fournisseurs, dettes en compte', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '402', 'Fournisseurs, effets à payer', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '403', 'Fournisseurs, retenues de garantie', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '408', 'Fournisseurs, factures non parvenues', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '409', 'Fournisseurs débiteurs', 'ASSET', 4, 'XOF'),
  (company_uuid, '411', 'Clients', 'ASSET', 4, 'XOF'),
  (company_uuid, '412', 'Clients, effets à recevoir', 'ASSET', 4, 'XOF'),
  (company_uuid, '413', 'Clients retenues de garantie', 'ASSET', 4, 'XOF'),
  (company_uuid, '418', 'Clients, produits non encore facturés', 'ASSET', 4, 'XOF'),
  (company_uuid, '419', 'Clients créditeurs', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '421', 'Personnel, avances et acomptes', 'ASSET', 4, 'XOF'),
  (company_uuid, '422', 'Personnel, rémunérations dues', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '423', 'Personnel, opposition sur salaires', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '424', 'Personnel, œuvres sociales', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '431', 'Sécurité sociale', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '432', 'Caisse de retraite', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '433', 'Autres organismes sociaux', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '441', 'État, subventions à recevoir', 'ASSET', 4, 'XOF'),
  (company_uuid, '442', 'État, impôts et taxes recouvrables sur tiers', 'ASSET', 4, 'XOF'),
  (company_uuid, '443', 'État, TVA facturée', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '445', 'État, TVA récupérable', 'ASSET', 4, 'XOF'),
  (company_uuid, '447', 'État, impôts retenus à la source', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '448', 'État, charges fiscales sur congés à payer', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '449', 'État, créditeur', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '451', 'Groupe, comptes courants', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '452', 'Associés, comptes courants', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '453', 'Associés, opérations faites en commun', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '454', 'Associés, opérations sur le capital', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '455', 'Associés, dividendes à payer', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '456', 'Associés, cessions d''immobilisations', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '457', 'Associés, compte courant bloqué', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '458', 'Associés, versements reçus sur augmentation de capital', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '461', 'Débiteurs divers', 'ASSET', 4, 'XOF'),
  (company_uuid, '462', 'Créditeurs divers', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '464', 'Dettes sur acquisitions de valeurs mobilières de placement', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '465', 'Créances sur cessions de valeurs mobilières de placement', 'ASSET', 4, 'XOF'),
  (company_uuid, '467', 'Comptes transitoires ou d''attente', 'ASSET', 4, 'XOF'),
  (company_uuid, '471', 'Comptes d''attente', 'ASSET', 4, 'XOF'),
  (company_uuid, '472', 'Versements restant à effectuer sur titres non libérés', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '473', 'Versements restant à effectuer sur titres non libérés', 'ASSET', 4, 'XOF'),
  (company_uuid, '475', 'Créances et dettes en monnaies étrangères', 'ASSET', 4, 'XOF'),
  (company_uuid, '476', 'Différences de conversion - Actif', 'ASSET', 4, 'XOF'),
  (company_uuid, '477', 'Différences de conversion - Passif', 'LIABILITY', 4, 'XOF'),
  (company_uuid, '481', 'Charges à répartir sur plusieurs exercices', 'ASSET', 4, 'XOF'),
  (company_uuid, '486', 'Charges constatées d''avance', 'ASSET', 4, 'XOF'),
  (company_uuid, '487', 'Produits constatés d''avance', 'LIABILITY', 4, 'XOF');

  -- Classe 5 : Comptes de trésorerie
  INSERT INTO accounts (company_id, account_number, name, type, class, currency) VALUES
  (company_uuid, '501', 'Valeurs mobilières de placement', 'ASSET', 5, 'XOF'),
  (company_uuid, '502', 'Actions', 'ASSET', 5, 'XOF'),
  (company_uuid, '503', 'Obligations', 'ASSET', 5, 'XOF'),
  (company_uuid, '504', 'Bons de Trésor et bons de caisse à court terme', 'ASSET', 5, 'XOF'),
  (company_uuid, '505', 'Autres titres', 'ASSET', 5, 'XOF'),
  (company_uuid, '511', 'Chèques postaux', 'ASSET', 5, 'XOF'),
  (company_uuid, '512', 'Banques', 'ASSET', 5, 'XOF'),
  (company_uuid, '514', 'Chèques à encaisser', 'ASSET', 5, 'XOF'),
  (company_uuid, '515', 'Cartes de crédit à encaisser', 'ASSET', 5, 'XOF'),
  (company_uuid, '516', 'Virements de fonds', 'ASSET', 5, 'XOF'),
  (company_uuid, '517', 'Autres valeurs à l''encaissement', 'ASSET', 5, 'XOF'),
  (company_uuid, '518', 'Intérêts courus', 'ASSET', 5, 'XOF'),
  (company_uuid, '519', 'Concours bancaires courants', 'LIABILITY', 5, 'XOF'),
  (company_uuid, '521', 'Caisses siège social', 'ASSET', 5, 'XOF'),
  (company_uuid, '522', 'Caisses succursales', 'ASSET', 5, 'XOF'),
  (company_uuid, '523', 'Caisses en devises', 'ASSET', 5, 'XOF'),
  (company_uuid, '524', 'Caisses, timbres et valeurs', 'ASSET', 5, 'XOF'),
  (company_uuid, '531', 'Virements de fonds', 'ASSET', 5, 'XOF'),
  (company_uuid, '532', 'Chèques à payer', 'LIABILITY', 5, 'XOF'),
  (company_uuid, '533', 'Effets à payer', 'LIABILITY', 5, 'XOF');

  -- Classe 6 : Comptes de charges
  INSERT INTO accounts (company_id, account_number, name, type, class, currency) VALUES
  (company_uuid, '601', 'Achats de matières premières', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '602', 'Achats de matières et fournitures consommables', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '603', 'Variations de stocks de matières et fournitures consommables', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '604', 'Achats stockés de matières et fournitures', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '605', 'Autres achats', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '608', 'Achats d''emballages', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '609', 'Rabais, remises et ristournes obtenus sur achats', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '611', 'Sous-traitance générale', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '612', 'Redevances de crédit-bail', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '613', 'Locations', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '614', 'Charges locatives et de copropriété', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '615', 'Entretien, réparations et maintenance', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '616', 'Primes d''assurances', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '617', 'Études et recherches', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '618', 'Documentation et divers', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '619', 'Rabais, remises et ristournes obtenus sur services extérieurs', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '621', 'Personnel extérieur à l''entreprise', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '622', 'Rémunérations d''intermédiaires et honoraires', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '623', 'Publicité, publications et relations publiques', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '624', 'Transports de biens et transports collectifs du personnel', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '625', 'Déplacements, missions et réceptions', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '626', 'Frais postaux et de télécommunications', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '627', 'Services bancaires et assimilés', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '628', 'Cotisations et divers', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '631', 'Impôts, taxes et versements assimilés sur rémunérations', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '633', 'Impôts, taxes et versements assimilés sur rémunérations', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '635', 'Autres impôts, taxes et versements assimilés', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '637', 'Impôts, taxes et versements assimilés', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '641', 'Rémunérations du personnel', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '645', 'Charges sociales', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '646', 'Cotisations sociales personnelles de l''exploitant', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '647', 'Autres charges sociales', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '648', 'Autres charges de personnel', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '651', 'Redevances pour concessions, brevets, licences, procédés, logiciels, droits et valeurs similaires', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '652', 'Plus-values de cession d''éléments d''actif', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '653', 'Jetons de présence', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '654', 'Pertes sur créances irrécouvrables', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '658', 'Charges diverses de gestion courante', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '661', 'Charges d''intérêts', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '662', 'Pertes de change', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '663', 'Charges nettes sur cessions de valeurs mobilières de placement', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '664', 'Escomptes accordés', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '665', 'Autres charges financières', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '671', 'Charges exceptionnelles sur opérations de gestion', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '672', 'Moins-values de cessions d''éléments d''actif', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '673', 'Valeurs comptables des éléments d''actif cédés', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '674', 'Autres charges exceptionnelles', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '675', 'Valeurs comptables des éléments d''actif cédés', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '676', 'Différences de change', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '677', 'Pertes exceptionnelles', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '678', 'Autres charges exceptionnelles', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '681', 'Dotations aux amortissements et aux provisions - Charges d''exploitation', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '686', 'Dotations aux amortissements et aux provisions - Charges financières', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '687', 'Dotations aux amortissements et aux provisions - Charges exceptionnelles', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '691', 'Participation des salariés aux résultats', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '692', 'Participation des salariés aux fruits de l''expansion', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '693', 'Participation des salariés aux résultats', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '695', 'Impôts sur les bénéfices', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '696', 'Suppléments d''impôt sur les sociétés liés aux distributions', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '697', 'Imposition forfaitaire annuelle des sociétés', 'EXPENSE', 6, 'XOF'),
  (company_uuid, '698', 'Autres impôts sur les résultats', 'EXPENSE', 6, 'XOF');

  -- Classe 7 : Comptes de produits
  INSERT INTO accounts (company_id, account_number, name, type, class, currency) VALUES
  (company_uuid, '701', 'Ventes de produits finis', 'REVENUE', 7, 'XOF'),
  (company_uuid, '702', 'Ventes de produits intermédiaires', 'REVENUE', 7, 'XOF'),
  (company_uuid, '703', 'Ventes de produits résiduels', 'REVENUE', 7, 'XOF'),
  (company_uuid, '704', 'Travaux', 'REVENUE', 7, 'XOF'),
  (company_uuid, '705', 'Études', 'REVENUE', 7, 'XOF'),
  (company_uuid, '706', 'Autres prestations de services', 'REVENUE', 7, 'XOF'),
  (company_uuid, '707', 'Ventes de marchandises', 'REVENUE', 7, 'XOF'),
  (company_uuid, '708', 'Produits des activités annexes', 'REVENUE', 7, 'XOF'),
  (company_uuid, '709', 'Rabais, remises et ristournes accordés par l''entreprise', 'REVENUE', 7, 'XOF'),
  (company_uuid, '713', 'Variation des stocks', 'REVENUE', 7, 'XOF'),
  (company_uuid, '718', 'Autres produits d''activité', 'REVENUE', 7, 'XOF'),
  (company_uuid, '719', 'Rabais, remises et ristournes accordés par l''entreprise', 'REVENUE', 7, 'XOF'),
  (company_uuid, '721', 'Production immobilisée - Immobilisations incorporelles', 'REVENUE', 7, 'XOF'),
  (company_uuid, '722', 'Production immobilisée - Immobilisations corporelles', 'REVENUE', 7, 'XOF'),
  (company_uuid, '726', 'Pertes et profits', 'REVENUE', 7, 'XOF'),
  (company_uuid, '731', 'Subventions d''exploitation', 'REVENUE', 7, 'XOF'),
  (company_uuid, '732', 'Subventions d''équilibre', 'REVENUE', 7, 'XOF'),
  (company_uuid, '733', 'Impôts et taxes', 'REVENUE', 7, 'XOF'),
  (company_uuid, '738', 'Autres subventions d''exploitation', 'REVENUE', 7, 'XOF'),
  (company_uuid, '741', 'Produits nets de cession d''immobilisations', 'REVENUE', 7, 'XOF'),
  (company_uuid, '745', 'Écarts d''évaluation sur actif', 'REVENUE', 7, 'XOF'),
  (company_uuid, '746', 'Différences positives sur réalisations d''éléments d''actif', 'REVENUE', 7, 'XOF'),
  (company_uuid, '748', 'Autres produits divers', 'REVENUE', 7, 'XOF'),
  (company_uuid, '751', 'Redevances pour concessions, brevets, licences, marques, procédés, logiciels, droits et valeurs similaires', 'REVENUE', 7, 'XOF'),
  (company_uuid, '752', 'Revenus des participations', 'REVENUE', 7, 'XOF'),
  (company_uuid, '753', 'Revenus de créances rattachées à des participations', 'REVENUE', 7, 'XOF'),
  (company_uuid, '754', 'Revenus des titres immobilisés', 'REVENUE', 7, 'XOF'),
  (company_uuid, '755', 'Quotes-parts de résultat sur opérations faites en commun', 'REVENUE', 7, 'XOF'),
  (company_uuid, '756', 'Produits nets sur cessions de valeurs mobilières de placement', 'REVENUE', 7, 'XOF'),
  (company_uuid, '757', 'Revenus de créances', 'REVENUE', 7, 'XOF'),
  (company_uuid, '758', 'Produits divers de gestion courante', 'REVENUE', 7, 'XOF'),
  (company_uuid, '759', 'Charges transférées', 'REVENUE', 7, 'XOF'),
  (company_uuid, '761', 'Produits financiers', 'REVENUE', 7, 'XOF'),
  (company_uuid, '762', 'Gains de change', 'REVENUE', 7, 'XOF'),
  (company_uuid, '763', 'Produits nets sur cessions de valeurs mobilières de placement', 'REVENUE', 7, 'XOF'),
  (company_uuid, '764', 'Revenus des valeurs mobilières de placement', 'REVENUE', 7, 'XOF'),
  (company_uuid, '765', 'Escomptes obtenus', 'REVENUE', 7, 'XOF'),
  (company_uuid, '766', 'Gains de change', 'REVENUE', 7, 'XOF'),
  (company_uuid, '767', 'Produits nets sur cessions de valeurs mobilières de placement', 'REVENUE', 7, 'XOF'),
  (company_uuid, '768', 'Autres produits financiers', 'REVENUE', 7, 'XOF'),
  (company_uuid, '771', 'Produits exceptionnels sur opérations de gestion', 'REVENUE', 7, 'XOF'),
  (company_uuid, '772', 'Produits des cessions d''éléments d''actif', 'REVENUE', 7, 'XOF'),
  (company_uuid, '773', 'Mandats non réclamés', 'REVENUE', 7, 'XOF'),
  (company_uuid, '774', 'Autres produits exceptionnels', 'REVENUE', 7, 'XOF'),
  (company_uuid, '775', 'Produits des cessions d''éléments d''actif', 'REVENUE', 7, 'XOF'),
  (company_uuid, '776', 'Différences de change', 'REVENUE', 7, 'XOF'),
  (company_uuid, '777', 'Quote-part des subventions d''investissement virée au résultat de l''exercice', 'REVENUE', 7, 'XOF'),
  (company_uuid, '778', 'Autres produits exceptionnels', 'REVENUE', 7, 'XOF'),
  (company_uuid, '781', 'Reprises d''amortissements et de provisions', 'REVENUE', 7, 'XOF'),
  (company_uuid, '786', 'Reprises de provisions', 'REVENUE', 7, 'XOF'),
  (company_uuid, '787', 'Reprises sur provisions pour risques et charges', 'REVENUE', 7, 'XOF');

END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. JOURNAUX PAR DÉFAUT
-- ============================================================================

-- Fonction pour insérer les journaux par défaut
CREATE OR REPLACE FUNCTION insert_default_journals(company_uuid UUID, standard TEXT DEFAULT 'PCG')
RETURNS void AS $
BEGIN
  IF standard = 'SYSCOHADA' THEN
    -- Journaux SYSCOHADA
    INSERT INTO journals (company_id, code, name, type, description) VALUES
    (company_uuid, 'VE', 'Journal des ventes', 'VENTE', 'Enregistrement des ventes et prestations'),
    (company_uuid, 'AC', 'Journal des achats', 'ACHAT', 'Enregistrement des achats et charges'),
    (company_uuid, 'BQ', 'Journal de banque', 'BANQUE', 'Mouvements bancaires et virements'),
    (company_uuid, 'CA', 'Journal de caisse', 'CAISSE', 'Encaissements et décaissements espèces'),
    (company_uuid, 'OD', 'Journal des opérations diverses', 'OD', 'Écritures diverses et régularisations'),
    (company_uuid, 'AN', 'Journal des à-nouveaux', 'OD', 'Reports des soldes d''ouverture'),
    (company_uuid, 'IN', 'Journal d''inventaire', 'OD', 'Écritures d''inventaire et clôture');
  ELSE
    -- Journaux PCG français
    INSERT INTO journals (company_id, code, name, type, description) VALUES
    (company_uuid, 'VTE', 'Journal des ventes', 'VENTE', 'Factures de ventes et prestations de services'),
    (company_uuid, 'ACH', 'Journal des achats', 'ACHAT', 'Factures d''achats et charges'),
    (company_uuid, 'BAN', 'Journal de banque', 'BANQUE', 'Opérations bancaires et virements'),
    (company_uuid, 'CAI', 'Journal de caisse', 'CAISSE', 'Encaissements et paiements en espèces'),
    (company_uuid, 'OD', 'Journal des opérations diverses', 'OD', 'Écritures de régularisation et diverses'),
    (company_uuid, 'ANOUV', 'Journal des à-nouveaux', 'OD', 'Report des soldes de l''exercice précédent'),
    (company_uuid, 'INVENT', 'Journal d''inventaire', 'OD', 'Écritures d''inventaire et de clôture');
  END IF;
END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. FONCTIONS RPC POUR L'APPLICATION
-- ============================================================================

-- Fonction pour obtenir les statistiques du dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_company_id UUID)
RETURNS JSON AS $
DECLARE
  result JSON;
  revenue_total DECIMAL(15,2);
  expenses_total DECIMAL(15,2);
  profit_total DECIMAL(15,2);
  clients_count INTEGER;
BEGIN
  -- Calculer le chiffre d'affaires (comptes classe 7)
  SELECT COALESCE(SUM(credit_amount - debit_amount), 0) INTO revenue_total
  FROM journal_entry_items jei
  JOIN accounts a ON jei.account_id = a.id
  WHERE jei.company_id = p_company_id 
    AND a.class = 7
    AND EXTRACT(YEAR FROM jei.created_at) = EXTRACT(YEAR FROM CURRENT_DATE);

  -- Calculer les charges (comptes classe 6)
  SELECT COALESCE(SUM(debit_amount - credit_amount), 0) INTO expenses_total
  FROM journal_entry_items jei
  JOIN accounts a ON jei.account_id = a.id
  WHERE jei.company_id = p_company_id 
    AND a.class = 6
    AND EXTRACT(YEAR FROM jei.created_at) = EXTRACT(YEAR FROM CURRENT_DATE);

  -- Calculer le profit
  profit_total := revenue_total - expenses_total;

  -- Compter les clients actifs
  SELECT COUNT(*) INTO clients_count
  FROM third_parties
  WHERE company_id = p_company_id 
    AND type IN ('CLIENT', 'BOTH')
    AND is_active = true;

  -- Construire le résultat JSON
  result := json_build_object(
    'revenue', revenue_total,
    'expenses', expenses_total,
    'profit', profit_total,
    'clients', clients_count
  );

  RETURN result;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les échéances à venir
CREATE OR REPLACE FUNCTION get_upcoming_deadlines(p_company_id UUID, p_days_ahead INTEGER DEFAULT 30)
RETURNS JSON AS $
DECLARE
  result JSON;
BEGIN
  -- Pour l'instant, retourner un tableau vide
  -- À développer selon les besoins métier
  result := '[]'::JSON;
  
  RETURN result;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour exécuter du SQL dynamique (pour les migrations)
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
RETURNS void AS $
BEGIN
  EXECUTE sql;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. POLITIQUES RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Activer RLS sur toutes les tables principales
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_parties ENABLE ROW LEVEL SECURITY;

-- Politique pour companies : les utilisateurs ne peuvent voir que leurs entreprises
CREATE POLICY "Users can view their companies" ON companies
  FOR ALL USING (
    id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Politique pour user_companies : les utilisateurs ne peuvent voir que leurs liaisons
CREATE POLICY "Users can view their company relationships" ON user_companies
  FOR ALL USING (user_id = auth.uid());

-- Politique générale pour les données d'entreprise
CREATE POLICY "Users can access their company data" ON accounts
  FOR ALL USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their company journals" ON journals
  FOR ALL USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their company journal entries" ON journal_entries
  FOR ALL USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their company journal entry items" ON journal_entry_items
  FOR ALL USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their company bank accounts" ON bank_accounts
  FOR ALL USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their company bank transactions" ON bank_transactions
  FOR ALL USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their company third parties" ON third_parties
  FOR ALL USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 11. FINALISATION
-- ============================================================================

-- Insérer quelques données de test si c'est un environnement de développement
DO $
BEGIN
  -- Vérifier si on est en mode développement
  IF current_setting('app.environment', true) = 'development' THEN
    
    -- Créer une entreprise de test si elle n'existe pas
    INSERT INTO companies (
      id,
      name, 
      country, 
      currency, 
      accounting_standard,
      is_setup_completed
    ) VALUES (
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      'Entreprise Test SARL',
      'FR',
      'EUR',
      'PCG',
      true
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Insérer le plan comptable français pour l'entreprise de test
    PERFORM insert_default_french_accounts('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    
    -- Insérer les journaux par défaut
    PERFORM insert_default_journals('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'PCG');
    
    RAISE NOTICE 'Données de test créées pour l''environnement de développement';
  END IF;
END $;
