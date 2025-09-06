
// Test script to verify module loading
const testModules = { dashboard: true, salesCrm: true, humanResources: true, projects: true };
localStorage.setItem('casskai_modules', JSON.stringify(testModules));
console.log('Modules saved to localStorage:', testModules);

// Test the mapping logic
const moduleKeyMapping = {
  'salesCrm': 'crm-sales',
  'humanResources': 'hr-light', 
  'projects': 'projects-management',
  'marketplace': 'marketplace'
};

const mockModules = [
  { id: 'crm-sales', name: 'CRM & Ventes', isActive: false },
  { id: 'hr-light', name: 'RH Light', isActive: false },
  { id: 'projects-management', name: 'Projets', isActive: false }
];

const updatedModules = mockModules.map(module => {
  const storageKey = Object.keys(testModules).find(key => moduleKeyMapping[key] === module.id);
  const isActiveFromStorage = storageKey ? testModules[storageKey] : false;
  return { ...module, isActive: isActiveFromStorage || module.isActive };
});

console.log('Updated modules:', updatedModules);

