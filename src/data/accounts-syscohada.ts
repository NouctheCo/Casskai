// src/data/accounts-syscohada.ts
// Plan SYSCOHADA simplifié : classes 1 à 9, quelques comptes d’exemple par classe

export const SYSCOHADA_CLASSES = [
  { number: '1', name: 'Comptes de ressources durables' },
  { number: '2', name: 'Comptes d’actif immobilisé' },
  { number: '3', name: 'Comptes de stocks' },
  { number: '4', name: 'Comptes de tiers' },
  { number: '5', name: 'Comptes financiers' },
  { number: '6', name: 'Comptes de charges' },
  { number: '7', name: 'Comptes de produits' },
  { number: '8', name: 'Comptes spéciaux' },
  { number: '9', name: 'Comptes analytiques' }
];

export const SYSCOHADA_ACCOUNTS = [
  // Classe 1
  { number: '101', name: 'Capital social', class: '1' },
  { number: '151', name: 'Amortissements dérogatoires', class: '1' },
  // Classe 2
  { number: '201', name: 'Frais de développement', class: '2' },
  { number: '213', name: 'Constructions', class: '2' },
  // Classe 3
  { number: '311', name: 'Matières premières', class: '3' },
  { number: '345', name: 'Produits finis', class: '3' },
  // Classe 4
  { number: '401', name: 'Fournisseurs', class: '4' },
  { number: '411', name: 'Clients', class: '4' },
  // Classe 5
  { number: '512', name: 'Banques', class: '5' },
  { number: '531', name: 'Caisse', class: '5' },
  // Classe 6
  { number: '601', name: 'Achats de marchandises', class: '6' },
  { number: '641', name: 'Charges de personnel', class: '6' },
  // Classe 7
  { number: '701', name: 'Ventes de marchandises', class: '7' },
  { number: '755', name: 'Produits financiers', class: '7' },
  // Classe 8
  { number: '801', name: 'Comptes spéciaux', class: '8' },
  // Classe 9
  { number: '901', name: 'Comptes analytiques', class: '9' }
];
