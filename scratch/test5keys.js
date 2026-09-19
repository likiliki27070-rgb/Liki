const https = require('https');

function testUrl(name, url, postData = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const postBody = postData ? JSON.stringify(postData) : null;
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: postData ? 'POST' : 'GET',
      headers: postData ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      } : {}
    };
    const req = https.request(options, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        resolve({ name, status: res.statusCode, body: b.slice(0, 200) });
      });
    });
    req.on('error', (err) => resolve({ name, error: err.message }));
    if (postBody) req.write(postBody);
    req.end();
  });
}

async function checkKeys() {
  const isolineKey = '2378af2a2bf64130bef3abbcf70865d5';
  const placesKey = 'c5191509836e498095c57bf059ac791f';
  const placeDetailsKey = '83ae1c36bd23478598f4501c4d9f114d';
  const ipGeoKey = '0ae0a18aa62240379014c7b7d7e08c28';
  const mapMatchingKey = '8fca0f76ccf44e46b3cd9a3cac47e6ff';

  const results = await Promise.all([
    testUrl('Isoline API', `https://api.geoapify.com/v1/isoline?lat=37.7855&lon=-122.4015&type=time&mode=drive&range=300&apiKey=${isolineKey}`),
    testUrl('Places API', `https://api.geoapify.com/v2/places?categories=commercial,catering&filter=circle:-122.4015,37.7855,1000&limit=5&apiKey=${placesKey}`),
    testUrl('Place Details API', `https://api.geoapify.com/v2/place-details?lat=37.7855&lon=-122.4015&apiKey=${placeDetailsKey}`),
    testUrl('IP Geolocation API', `https://api.geoapify.com/v1/ipinfo?apiKey=${ipGeoKey}`),
    testUrl('Map Matching API (POST)', `https://api.geoapify.com/v1/mapmatching?apiKey=${mapMatchingKey}`, {
      mode: 'drive',
      waypoints: [
        { lat: 37.7855, lon: -122.4015, timestamp: 1000 },
        { lat: 37.7865, lon: -122.4010, timestamp: 1030 }
      ]
    })
  ]);

  console.log(JSON.stringify(results, null, 2));
}

checkKeys().catch(console.error);
