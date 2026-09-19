const https = require('https');

const key = 'f45cf1c920ff48c7aee949dfc6053cef';

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
        resolve({ name, status: res.statusCode, body: b.slice(0, 300) });
      });
    });
    req.on('error', (err) => resolve({ name, error: err.message }));
    if (postBody) req.write(postBody);
    req.end();
  });
}

async function run() {
  const results = await Promise.all([
    // Test 1: Standard Turn-by-Turn Routing API
    testUrl('Routing API (GET)', `https://api.geoapify.com/v1/routing?waypoints=37.7855,-122.4015|37.7940,-122.3950&mode=drive&apiKey=${key}`),
    
    // Test 2: Route Matrix API
    testUrl('Route Matrix API (POST)', `https://api.geoapify.com/v1/routematrix?apiKey=${key}`, {
      mode: 'drive',
      sources: [{ location: [-122.4015, 37.7855] }],
      targets: [{ location: [-122.3950, 37.7940] }]
    }),

    // Test 3: Route Planner API (POST)
    testUrl('Route Planner API (POST)', `https://api.geoapify.com/v1/routeplanner?apiKey=${key}`, {
      mode: 'drive',
      agents: [
        {
          start_location: [-122.4015, 37.7855],
          time_windows: [[0, 7200]]
        }
      ],
      shipments: [
        {
          id: 'order_1',
          pickup: { location: [-122.4015, 37.7855], duration: 120 },
          delivery: { location: [-122.3950, 37.7940], duration: 120 }
        }
      ]
    })
  ]);

  console.log(JSON.stringify(results, null, 2));
}

run();
