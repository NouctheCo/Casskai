#!/usr/bin/env node

/**
 * Script de nettoyage des données navigateur pour CassKai
 * 
 * Ce script génère les commandes nécessaires pour nettoyer:
 * - localStorage (données d'onboarding en cache)
 * - sessionStorage 
 * - cookies liés à l'authentification
 * - cache du navigateur
 * 
 * Usage: node scripts/cleanup-browser-data.js
 */

console.log(`
🧹 NETTOYAGE DES DONNÉES NAVIGATEUR - CassKai
=============================================

Ce script vous guide pour nettoyer toutes les données navigateur
liées aux tests d'onboarding et à l'authentification.

📋 ÉTAPES À SUIVRE:

1️⃣  OUVRIR LES OUTILS DE DÉVELOPPEMENT
   - Appuyez sur F12 (ou Cmd+Option+I sur Mac)
   - Ou clic droit → "Inspecter l'élément"

2️⃣  NETTOYER LE LOCALSTORAGE
   - Aller dans l'onglet "Application" (Chrome) ou "Storage" (Firefox)
   - Sélectionner "Local Storage" → votre domaine
   - Supprimer toutes les clés commençant par "casskai_"
   
   OU exécuter dans la Console:
`);

console.log(`   localStorage.clear(); // Supprime tout le localStorage`);
console.log(`   
   OU pour supprimer seulement les clés CassKai:
`);
console.log(`   Object.keys(localStorage)
     .filter(key => key.startsWith('casskai_') || key.startsWith('supabase.'))
     .forEach(key => localStorage.removeItem(key));`);

console.log(`
3️⃣  NETTOYER LE SESSIONSTORAGE
   - Dans "Session Storage" → votre domaine  
   - Supprimer toutes les entrées
   
   OU exécuter dans la Console:
`);
console.log(`   sessionStorage.clear();`);

console.log(`
4️⃣  SUPPRIMER LES COOKIES D'AUTHENTIFICATION
   - Dans "Cookies" → votre domaine
   - Supprimer notamment:
     * sb-access-token
     * sb-refresh-token
     * supabase-auth-token
     * casskai-session
   
   OU exécuter dans la Console:
`);
console.log(`   document.cookie.split(";").forEach(function(c) { 
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
   });`);

console.log(`
5️⃣  VIDER LE CACHE DU NAVIGATEUR
   - Ctrl+Shift+Delete (ou Cmd+Shift+Delete sur Mac)
   - OU dans DevTools → onglet Network → clic droit "Clear browser cache"
   - OU clic droit sur l'icône de refresh → "Empty cache and hard reload"

6️⃣  FERMER TOUS LES ONGLETS DE L'APPLICATION
   - Fermer complètement le navigateur pour être sûr
   - Relancer le navigateur

📱 NETTOYAGE MOBILE (si applicable):
   - Safari iOS: Réglages → Safari → Effacer historique et données
   - Chrome Android: Menu → Historique → Effacer les données de navigation

🔍 VÉRIFICATION:
   Une fois l'application relancée, vérifiez que:
   - ✅ La page d'accueil s'affiche (pas de redirection automatique)
   - ✅ Aucune données d'entreprise en mémoire
   - ✅ L'onboarding recommence depuis le début
   - ✅ Aucun message d'erreur d'authentification

⚡ SCRIPT TOUT-EN-UN POUR LA CONSOLE:
   Copiez-collez ce bloc dans la console du navigateur:
`);

const cleanupScript = `
// 🧹 CassKai - Script de nettoyage complet
console.log('🚀 Début du nettoyage CassKai...');

// Nettoyer localStorage
let localStorageCount = 0;
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('casskai_') || 
      key.startsWith('supabase.') || 
      key.startsWith('sb-') ||
      key.includes('onboarding') ||
      key.includes('auth-token')) {
    localStorage.removeItem(key);
    localStorageCount++;
  }
});

// Nettoyer sessionStorage  
let sessionStorageCount = sessionStorage.length;
sessionStorage.clear();

// Nettoyer les cookies
let cookiesCleared = 0;
document.cookie.split(";").forEach(function(c) { 
  let cookieName = c.replace(/^ +/, "").replace(/=.*/, "");
  if (cookieName.includes('sb-') || 
      cookieName.includes('supabase') || 
      cookieName.includes('casskai') ||
      cookieName.includes('auth')) {
    document.cookie = cookieName + "=;expires=" + new Date(0).toUTCString() + ";path=/";
    document.cookie = cookieName + "=;expires=" + new Date(0).toUTCString() + ";path=/;domain=" + location.hostname;
    cookiesCleared++;
  }
});

console.log(\`✅ Nettoyage terminé:
- \${localStorageCount} clés localStorage supprimées
- \${sessionStorageCount} clés sessionStorage supprimées  
- \${cookiesCleared} cookies supprimés\`);

console.log('🔄 Rechargez la page pour voir les changements');
console.log('📍 Vous devriez maintenant voir la page d\\'accueil ou de connexion');
`;

console.log('```javascript');
console.log(cleanupScript);
console.log('```');

console.log(`
💡 CONSEILS:
   - Exécutez ce nettoyage avant chaque nouveau test d'onboarding
   - Si l'application reste "bloquée", essayez le mode navigation privée
   - En cas de problème, vérifiez les logs dans la console navigateur

🆘 EN CAS DE PROBLÈME:
   Si après nettoyage l'application ne fonctionne pas:
   1. Vérifiez que les variables d'environnement sont correctes
   2. Redémarrez le serveur de développement (npm run dev)
   3. Testez en navigation privée
   4. Vérifiez la connexion à Supabase dans la console

✅ NETTOYAGE TERMINÉ !
   Vous pouvez maintenant redémarrer votre test d'onboarding.
`);

// Génération d'un fichier HTML pour faciliter l'exécution
const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CassKai - Nettoyage Browser</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 0; }
        .btn:hover { background: #0056b3; }
        .success { color: green; }
        .warning { color: orange; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .step { background: #e3f2fd; padding: 15px; margin: 10px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🧹 CassKai - Nettoyage des Données Navigateur</h1>
    
    <div class="step">
        <h2>🚀 Nettoyage Automatique</h2>
        <p>Cliquez sur ce bouton pour nettoyer automatiquement localStorage, sessionStorage et cookies :</p>
        <button class="btn" onclick="cleanupCassKaiData()">Nettoyer les Données CassKai</button>
        <div id="cleanup-result"></div>
    </div>
    
    <div class="step">
        <h2>🔍 Vérification</h2>
        <button class="btn" onclick="checkCleanupStatus()">Vérifier le Statut</button>
        <div id="status-result"></div>
    </div>
    
    <div class="step">
        <h2>🔄 Actions Complémentaires</h2>
        <button class="btn" onclick="location.reload()">Recharger la Page</button>
        <button class="btn" onclick="clearAllData()">Nettoyage Complet (Attention!)</button>
    </div>

    <script>
${cleanupScript}

function cleanupCassKaiData() {
    const result = document.getElementById('cleanup-result');
    try {
        // Exécuter le script de nettoyage
        eval(cleanupScript);
        result.innerHTML = '<div class="success">✅ Nettoyage CassKai terminé avec succès!</div>';
    } catch (error) {
        result.innerHTML = '<div class="warning">⚠️ Erreur: ' + error.message + '</div>';
    }
}

function checkCleanupStatus() {
    const status = document.getElementById('status-result');
    const cassKaiKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('casskai_') || key.startsWith('supabase.') || key.startsWith('sb-')
    );
    const sessionKeys = Object.keys(sessionStorage);
    
    let html = '<h3>Statut du Nettoyage:</h3>';
    html += '<p>🔑 localStorage CassKai: ' + cassKaiKeys.length + ' clés restantes</p>';
    html += '<p>📝 sessionStorage: ' + sessionKeys.length + ' clés</p>';
    
    if (cassKaiKeys.length === 0) {
        html += '<div class="success">✅ localStorage CassKai propre</div>';
    } else {
        html += '<div class="warning">⚠️ Clés restantes: ' + cassKaiKeys.join(', ') + '</div>';
    }
    
    status.innerHTML = html;
}

function clearAllData() {
    if (confirm('⚠️ Attention: Ceci va supprimer TOUTES les données du navigateur pour ce site. Continuer?')) {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        alert('✅ Toutes les données ont été supprimées. La page va se recharger.');
        location.reload();
    }
}
    </script>
</body>
</html>`;

// Sauvegarder le fichier HTML
try {
  const fs = require('fs');
  const path = require('path');
  
  const htmlPath = path.join(__dirname, 'cleanup-browser.html');
  fs.writeFileSync(htmlPath, htmlContent);
  
  console.log(`📄 Fichier HTML généré: ${htmlPath}`);
  console.log(`   Ouvrez ce fichier dans votre navigateur pour un nettoyage interactif.`);
} catch (error) {
  console.log(`⚠️  Impossible de créer le fichier HTML: ${error.message}`);
  console.log(`   Utilisez les commandes manuelles ci-dessus.`);
}