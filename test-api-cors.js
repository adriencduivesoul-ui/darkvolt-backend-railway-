import https from 'https';

// Test depuis l'origine o2switch
const options = {
  hostname: 'darkvolt-backend-production.up.railway.app',
  port: 443,
  path: '/api/stream/status',
  method: 'GET',
  headers: {
    'Origin': 'https://darkvolt.cuda9641.odns.fr',
    'Referer': 'https://darkvolt.cuda9641.odns.fr/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/148.0',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ Response:', result);
      
      if (result.status === 'live') {
        console.log('🔴 STREAM LIVE DÉTECTÉ !');
        console.log(`📺 Titre: ${result.title}`);
        console.log(`👥 Viewers: ${result.viewer_count}`);
      } else {
        console.log('⚫ Aucun stream live');
      }
    } catch (error) {
      console.log('❌ Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();
