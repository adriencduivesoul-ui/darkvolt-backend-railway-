import https from 'https';

const options = {
  hostname: 'darkvolt-backend-production.up.railway.app',
  port: 443,
  path: '/api/stream/status',
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
    try {
      const result = JSON.parse(data);
      console.log('🔍 Champs de la réponse API:');
      console.log('✅ id:', result.id);
      console.log('✅ streamer_id:', result.streamer_id);
      console.log('✅ title:', result.title);
      console.log('✅ status:', result.status);
      console.log('❓ streamer_name:', result.streamer_name);
      console.log('❓ stream_name:', result.stream_key);
      console.log('❓ username:', result.username);
      console.log('❓ streamer:', result.streamer);
      
      // Vérifier si le backend envoie le nom du streamer
      if (result.streamer_name) {
        console.log('✅ streamer_name trouvé');
      } else {
        console.log('❌ streamer_name MANQUANT');
      }
      
      // Chercher d'autres champs possibles
      const allKeys = Object.keys(result);
      console.log('🔍 Tous les champs:', allKeys);
      
    } catch (error) {
      console.log('❌ Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();
