const https = require('https');

function testUrl(url, name) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log(`[${name}] Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`[${name}] Features count: ${json.features ? json.features.length : 0}`);
          if (json.features && json.features[0]) {
            console.log(`[${name}] First result: ${json.features[0].properties.formatted || json.features[0].properties.name}`);
          }
        } catch (e) {
          console.log(`[${name}] Body preview: ${data.slice(0, 100)}`);
        }
        resolve(res.statusCode);
      });
    }).on('error', (err) => {
      console.error(`[${name}] Error:`, err.message);
      resolve(null);
    });
  });
}

async function verifyKeys() {
  console.log("Testing user provided keys...");
  // Key 1: Reverse geocoding b9a95414ae8a4dd3b9d2f97ae2fc0546
  await testUrl(
    'https://api.geoapify.com/v1/geocode/reverse?lat=37.7855&lon=-122.4015&apiKey=b9a95414ae8a4dd3b9d2f97ae2fc0546',
    'Reverse Geocoding (b9a954...)'
  );

  // Key 2: Autocomplete 509e607576bb4c1d94ee7f92dce287da
  await testUrl(
    'https://api.geoapify.com/v1/geocode/autocomplete?text=Market%20Street&apiKey=509e607576bb4c1d94ee7f92dce287da',
    'Autocomplete API (509e60...)'
  );
}

verifyKeys();
