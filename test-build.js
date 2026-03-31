import https from 'https';

const options = {
  hostname: 'darkvolt.cuda9641.odns.fr',
  port: 443,
  path: '/',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/148.0'
  },
  // Ignorer les certificats auto-signés
  rejectUnauthorized: false
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    // Chercher le fichier JS utilisé
    const jsMatch = data.match(/index-[^"]*\.js/);
    if (jsMatch) {
      console.log('🔍 Fichier JS trouvé:', jsMatch[0]);
      
      // Vérifier si c'est le nouveau build
      if (jsMatch[0].includes('Crsfb1l--1774616311794')) {
        console.log('✅ NOUVEAU BUILD UTILISÉ');
      } else {
        console.log('❌ ANCIEN BUILD UTILISÉ');
      }
    } else {
      console.log('❌ Aucun fichier JS trouvé');
    }
    
    // Chercher les appels API
    if (data.includes('api/stream/status')) {
      console.log('✅ Appel api/stream/status trouvé dans le HTML');
    } else {
      console.log('❌ Pas d\'appel api/stream/status dans le HTML');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();
