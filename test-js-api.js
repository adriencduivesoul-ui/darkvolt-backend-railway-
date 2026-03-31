import https from 'https';

const options = {
  hostname: 'darkvolt.cuda9641.odns.fr',
  port: 443,
  path: '/assets/index-Crsfb1l--1774616311794.js',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/148.0'
  },
  rejectUnauthorized: false
};

const req = https.request(options, (res) => {
  console.log(`Status JS: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    // Chercher les appels API dans le JS
    if (data.includes('api/stream/status')) {
      console.log('✅ Appel api/stream/status trouvé dans le JS');
    } else {
      console.log('❌ Pas d\'appel api/stream/status dans le JS');
    }
    
    if (data.includes('darkvolt-backend-production.up.railway.app')) {
      console.log('✅ URL Railway trouvée dans le JS');
    } else {
      console.log('❌ URL Railway pas trouvée dans le JS');
    }
    
    // Chercher fetchStatus
    if (data.includes('fetchStatus')) {
      console.log('✅ fetchStatus trouvé dans le JS');
    } else {
      console.log('❌ fetchStatus pas trouvé dans le JS');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();
