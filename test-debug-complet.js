import https from 'https';

// Test complet du JS pour voir si fetchStatus est appelé
const options = {
  hostname: 'darkvolt.cuda9641.odns.fr',
  port: 443,
  path: '/assets/index-Ca-WtL1b-1774619144768.js',
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
    console.log('🔍 Recherche des appels API dans le JS...');
    
    // Vérifier les appels API
    const apiCalls = [
      'fetchStatus',
      'fetchStatus()',
      '/api/stream/status',
      'useEffect',
      'setInterval',
      '8000'  // le polling interval
    ];
    
    apiCalls.forEach(call => {
      if (data.includes(call)) {
        console.log(`✅ ${call} trouvé`);
      } else {
        console.log(`❌ ${call} PAS trouvé`);
      }
    });
    
    // Chercher les logs de debug
    if (data.includes('console.log') && data.includes('fetchStatus')) {
      console.log('✅ Logs fetchStatus trouvés');
    } else {
      console.log('❌ Pas de logs fetchStatus');
    }
    
    // Vérifier le status.isLive
    if (data.includes('status.isLive')) {
      console.log('✅ status.isLive utilisé');
    } else {
      console.log('❌ status.isLive PAS utilisé');
    }
    
    // Vérifier la logique de filtrage
    if (data.includes('filter') && data.includes('isLive')) {
      console.log('✅ Logique de filtrage trouvée');
    } else {
      console.log('❌ Logique de filtrage PAS trouvée');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();
