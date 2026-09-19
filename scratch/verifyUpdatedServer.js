const http = require('http');

async function testEndpoint(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        let summary = '';
        try {
          const j = JSON.parse(data);
          if (j.features && j.features[0]) {
            summary = j.features[0].properties.formatted || j.features[0].properties.name;
          } else if (j.status) {
            summary = `${j.provider || j.status} (${j.reverseKey ? 'Reverse: ' + j.reverseKey.slice(0, 6) + '...' : ''} ${j.autocompleteKey ? 'Auto: ' + j.autocompleteKey.slice(0, 6) + '...' : ''})`;
          }
        } catch(e) {
          summary = data.slice(0, 40);
        }
        resolve({ url, status: res.statusCode, ok: res.statusCode === 200, summary });
      });
    }).on('error', (err) => resolve({ url, status: 'ERR', ok: false, error: err.message }));
  });
}

async function verifyAll() {
  const list = [
    'http://localhost:3000/',
    'http://localhost:3000/api/maps/config',
    'http://localhost:3000/api/geocode/reverse?lat=37.7855&lon=-122.4015',
    'http://localhost:3000/api/geocode/autocomplete?text=Market%20Street&limit=2',
    'http://localhost:3000/api/geocode/search?text=Civic%20Center&limit=2',
    'http://localhost:3000/api/featherless/status'
  ];

  console.log('Testing updated server endpoints:');
  for (const u of list) {
    const r = await testEndpoint(u);
    console.log(`[${r.ok ? 'PASS' : 'FAIL'}] ${u} -> ${r.status} | ${r.summary}`);
  }
}

verifyAll();
