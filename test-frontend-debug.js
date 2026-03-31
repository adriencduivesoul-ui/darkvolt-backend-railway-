import https from 'https';

// Test si le hook useStreamApi est bien dans le JS
const options = {
  hostname: 'darkvolt.cuda9641.odns.fr',
  port: 443,
  path: '/assets/index-Crsfb1l--1774616311794.js',
  method: 'GET',
  rejectUnauthorized: false
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('🔍 Recherche des hooks dans le JS...');
    
    // Vérifier les hooks essentiels
    const hooks = [
      'useStreamApi',
      'useStreamApi()',
      'fetchStatus',
      'useEffect',
      'HomeAuditeur'
    ];
    
    hooks.forEach(hook => {
      if (data.includes(hook)) {
        console.log(`✅ ${hook} trouvé`);
      } else {
        console.log(`❌ ${hook} PAS trouvé`);
      }
    });
    
    // Chercher les appels API spécifiques
    if (data.includes('/api/stream/status')) {
      console.log('✅ /api/stream/status trouvé');
    } else {
      console.log('❌ /api/stream/status PAS trouvé');
    }
    
    // Vérifier s'il y a des erreurs dans le code
    if (data.includes('error') || data.includes('Error') || data.includes('catch')) {
      console.log('⚠️  Gestion d\'erreurs détectée');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();
