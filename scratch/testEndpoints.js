const http = require('http');

async function testEndpoint(url, expectedStatus = 200) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          ok: res.statusCode === expectedStatus,
          dataLength: data.length,
          preview: data.slice(0, 80)
        });
      });
    }).on('error', (err) => {
      resolve({ url, status: 'ERROR', ok: false, error: err.message });
    });
  });
}

async function runAll() {
  const tests = [
    'http://localhost:3000/',
    'http://localhost:3000/api/featherless/status',
    'http://localhost:3000/api/maps/config',
    'http://localhost:3000/api/geocode/search?text=Union+Square&limit=2',
    'http://localhost:3000/api/geocode/reverse?lat=37.7855&lon=-122.4015'
  ];

  console.log('Testing all server endpoints on localhost:3000:');
  for (const t of tests) {
    const res = await testEndpoint(t);
    console.log(`[${res.ok ? 'PASS' : 'FAIL'}] ${t} -> Status: ${res.status} (Length: ${res.dataLength})`);
  }
}

runAll();
