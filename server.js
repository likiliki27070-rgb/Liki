const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = __dirname;
const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY || 'rc_21e8c10fa68cdfab4a710d21b6d2048bd4ab444a15f9e5b081383b316682b941';
const DEFAULT_FEATHERLESS_MODEL = 'Qwen/Qwen2.5-7B-Instruct';
const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || 'b5a852f6b97e420ab0850cc32c31c9d9';
const GEOAPIFY_ROUTING_KEY = process.env.GEOAPIFY_ROUTING_KEY || 'b5a852f6b97e420ab0850cc32c31c9d9';
const GEOAPIFY_ISOLINE_KEY = process.env.GEOAPIFY_ISOLINE_KEY || '2378af2a2bf64130bef3abbcf70865d5';
const GEOAPIFY_PLACES_KEY = process.env.GEOAPIFY_PLACES_KEY || 'c5191509836e498095c57bf059ac791f';
const GEOAPIFY_PLACE_DETAILS_KEY = process.env.GEOAPIFY_PLACE_DETAILS_KEY || '83ae1c36bd23478598f4501c4d9f114d';
const GEOAPIFY_IP_GEO_KEY = process.env.GEOAPIFY_IP_GEO_KEY || '0ae0a18aa62240379014c7b7d7e08c28';
const GEOAPIFY_MAP_MATCHING_KEY = process.env.GEOAPIFY_MAP_MATCHING_KEY || '8fca0f76ccf44e46b3cd9a3cac47e6ff';
const GEOAPIFY_GEOCODING_KEY = process.env.GEOAPIFY_GEOCODING_KEY || 'b5a852f6b97e420ab0850cc32c31c9d9';
const GEOAPIFY_REVERSE_KEY = process.env.GEOAPIFY_REVERSE_KEY || 'b9a95414ae8a4dd3b9d2f97ae2fc0546';
const GEOAPIFY_AUTOCOMPLETE_KEY = process.env.GEOAPIFY_AUTOCOMPLETE_KEY || '509e607576bb4c1d94ee7f92dce287da';

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.ts': 'application/javascript; charset=UTF-8',
  '.jsx': 'application/javascript; charset=UTF-8',
  '.tsx': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.woff': 'application/font-woff',
  '.woff2': 'font/woff2',
  '.ttf': 'application/font-ttf'
};

const server = http.createServer((req, res) => {
  // CORS Preflight headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = req.url.split('?')[0];

  // API Route: Featherless Status Check
  if (reqUrl === '/api/featherless/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ONLINE',
      provider: 'Featherless AI',
      model: DEFAULT_FEATHERLESS_MODEL,
      keyConfigured: !!FEATHERLESS_API_KEY,
      keyMasked: FEATHERLESS_API_KEY.slice(0, 7) + '...' + FEATHERLESS_API_KEY.slice(-6)
    }));
    return;
  }

  // API Route: Geoapify Mapping System Configuration
  if (reqUrl === '/api/maps/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ONLINE',
      provider: 'Geoapify',
      apiKey: GEOAPIFY_API_KEY,
      routingKey: GEOAPIFY_ROUTING_KEY,
      routingKeyMasked: GEOAPIFY_ROUTING_KEY.slice(0, 7) + '...' + GEOAPIFY_ROUTING_KEY.slice(-6),
      isolineKey: GEOAPIFY_ISOLINE_KEY,
      isolineKeyMasked: GEOAPIFY_ISOLINE_KEY.slice(0, 7) + '...' + GEOAPIFY_ISOLINE_KEY.slice(-6),
      placesKey: GEOAPIFY_PLACES_KEY,
      placesKeyMasked: GEOAPIFY_PLACES_KEY.slice(0, 7) + '...' + GEOAPIFY_PLACES_KEY.slice(-6),
      placeDetailsKey: GEOAPIFY_PLACE_DETAILS_KEY,
      placeDetailsKeyMasked: GEOAPIFY_PLACE_DETAILS_KEY.slice(0, 7) + '...' + GEOAPIFY_PLACE_DETAILS_KEY.slice(-6),
      ipGeoKey: GEOAPIFY_IP_GEO_KEY,
      ipGeoKeyMasked: GEOAPIFY_IP_GEO_KEY.slice(0, 7) + '...' + GEOAPIFY_IP_GEO_KEY.slice(-6),
      mapMatchingKey: GEOAPIFY_MAP_MATCHING_KEY,
      mapMatchingKeyMasked: GEOAPIFY_MAP_MATCHING_KEY.slice(0, 7) + '...' + GEOAPIFY_MAP_MATCHING_KEY.slice(-6),
      geocodingKey: GEOAPIFY_GEOCODING_KEY,
      reverseKey: GEOAPIFY_REVERSE_KEY,
      autocompleteKey: GEOAPIFY_AUTOCOMPLETE_KEY,
      reverseKeyMasked: GEOAPIFY_REVERSE_KEY.slice(0, 7) + '...' + GEOAPIFY_REVERSE_KEY.slice(-6),
      autocompleteKeyMasked: GEOAPIFY_AUTOCOMPLETE_KEY.slice(0, 7) + '...' + GEOAPIFY_AUTOCOMPLETE_KEY.slice(-6),
      styles: ['osm-bright', 'positron', 'dark-matter', 'osm-liberty', 'klokantech-basic'],
      defaultStyle: 'osm-bright',
      tileUrlTemplate: `https://maps.geoapify.com/v1/tile/{style}/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
      routingUrlTemplate: `https://api.geoapify.com/v1/routing?waypoints={waypoints}&mode={mode}&apiKey=${GEOAPIFY_ROUTING_KEY}`,
      isolineUrlTemplate: `https://api.geoapify.com/v1/isoline?lat={lat}&lon={lon}&type={type}&mode={mode}&range={range}&apiKey=${GEOAPIFY_ISOLINE_KEY}`,
      placesUrlTemplate: `https://api.geoapify.com/v2/places?categories={categories}&filter={filter}&limit={limit}&apiKey=${GEOAPIFY_PLACES_KEY}`,
      placeDetailsUrlTemplate: `https://api.geoapify.com/v2/place-details?lat={lat}&lon={lon}&apiKey=${GEOAPIFY_PLACE_DETAILS_KEY}`,
      ipGeoUrlTemplate: `https://api.geoapify.com/v1/ipinfo?apiKey=${GEOAPIFY_IP_GEO_KEY}`,
      mapMatchingUrlTemplate: `https://api.geoapify.com/v1/mapmatching?apiKey=${GEOAPIFY_MAP_MATCHING_KEY}`,
      center: [37.7855, -122.4015],
      zoom: 14
    }));
    return;
  }

  // API Route: Geoapify Turn-by-Turn Routing API Proxy (Key: b5a852f6b97e420ab0850cc32c31c9d9)
  if (reqUrl === '/api/routing' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const waypoints = urlObj.searchParams.get('waypoints') || '37.7855,-122.4015|37.7940,-122.3950';
    const mode = urlObj.searchParams.get('mode') || 'drive';
    const avoid = urlObj.searchParams.get('avoid') || '';
    const details = urlObj.searchParams.get('details') || 'instruction_details';

    let routeUrl = `https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(waypoints)}&mode=${mode}&details=${details}&apiKey=${GEOAPIFY_ROUTING_KEY}`;
    if (avoid) {
      routeUrl += `&avoid=${encodeURIComponent(avoid)}`;
    }

    https.get(routeUrl, (gRes) => {
      let b = '';
      gRes.on('data', c => b += c);
      gRes.on('end', () => {
        res.writeHead(gRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(b);
      });
    }).on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // API Route: Geoapify Reachability & Isoline API Proxy (Key: 2378af2a2bf64130bef3abbcf70865d5)
  if (reqUrl === '/api/isoline' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const lat = urlObj.searchParams.get('lat') || '37.7855';
    const lon = urlObj.searchParams.get('lon') || '-122.4015';
    const type = urlObj.searchParams.get('type') || 'time';
    const mode = urlObj.searchParams.get('mode') || 'drive';
    const range = urlObj.searchParams.get('range') || '300';

    const isoUrl = `https://api.geoapify.com/v1/isoline?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&type=${encodeURIComponent(type)}&mode=${encodeURIComponent(mode)}&range=${encodeURIComponent(range)}&apiKey=${GEOAPIFY_ISOLINE_KEY}`;

    https.get(isoUrl, (gRes) => {
      let b = '';
      gRes.on('data', c => b += c);
      gRes.on('end', () => {
        res.writeHead(gRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(b);
      });
    }).on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // API Route: Geoapify Forward Geocoding Address Search Proxy
  if (reqUrl === '/api/geocode/search' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const query = urlObj.searchParams.get('text') || 'San Francisco';
    const limit = urlObj.searchParams.get('limit') || '5';

    const geoUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&limit=${limit}&apiKey=${GEOAPIFY_GEOCODING_KEY}`;
    https.get(geoUrl, (gRes) => {
      let b = '';
      gRes.on('data', c => b += c);
      gRes.on('end', () => {
        res.writeHead(gRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(b);
      });
    }).on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // API Route: Geoapify Autocomplete API Proxy
  if (reqUrl === '/api/geocode/autocomplete' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const text = urlObj.searchParams.get('text') || 'Market';
    const limit = urlObj.searchParams.get('limit') || '6';
    const bias = urlObj.searchParams.get('bias');

    let autoUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&limit=${limit}&apiKey=${GEOAPIFY_AUTOCOMPLETE_KEY}`;
    if (bias) {
      autoUrl += `&bias=${encodeURIComponent(bias)}`;
    }

    https.get(autoUrl, (gRes) => {
      let b = '';
      gRes.on('data', c => b += c);
      gRes.on('end', () => {
        res.writeHead(gRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(b);
      });
    }).on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // API Route: Geoapify Reverse Geocoding Proxy (Coordinates -> Address)
  if (reqUrl === '/api/geocode/reverse' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const lat = urlObj.searchParams.get('lat') || '37.7855';
    const lon = urlObj.searchParams.get('lon') || '-122.4015';

    const revUrl = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_REVERSE_KEY}`;
    https.get(revUrl, (gRes) => {
      let b = '';
      gRes.on('data', c => b += c);
      gRes.on('end', () => {
        res.writeHead(gRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(b);
      });
    }).on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // API Route: Geoapify Places API Proxy (Key: c5191509836e498095c57bf059ac791f)
  if (reqUrl === '/api/places' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const categories = urlObj.searchParams.get('categories') || 'commercial,catering';
    const filter = urlObj.searchParams.get('filter') || 'circle:-122.4015,37.7855,1000';
    const limit = urlObj.searchParams.get('limit') || '10';
    const bias = urlObj.searchParams.get('bias');

    let pUrl = `https://api.geoapify.com/v2/places?categories=${encodeURIComponent(categories)}&filter=${encodeURIComponent(filter)}&limit=${limit}&apiKey=${GEOAPIFY_PLACES_KEY}`;
    if (bias) {
      pUrl += `&bias=${encodeURIComponent(bias)}`;
    }

    https.get(pUrl, (gRes) => {
      let b = '';
      gRes.on('data', c => b += c);
      gRes.on('end', () => {
        res.writeHead(gRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(b);
      });
    }).on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // API Route: Geoapify Place Details API Proxy (Key: 83ae1c36bd23478598f4501c4d9f114d)
  if (reqUrl === '/api/place-details' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const id = urlObj.searchParams.get('id');
    const lat = urlObj.searchParams.get('lat') || '37.7855';
    const lon = urlObj.searchParams.get('lon') || '-122.4015';
    const features = urlObj.searchParams.get('features');

    let pdUrl = '';
    if (id) {
      pdUrl = `https://api.geoapify.com/v2/place-details?id=${encodeURIComponent(id)}&apiKey=${GEOAPIFY_PLACE_DETAILS_KEY}`;
    } else {
      pdUrl = `https://api.geoapify.com/v2/place-details?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&apiKey=${GEOAPIFY_PLACE_DETAILS_KEY}`;
    }
    if (features) {
      pdUrl += `&features=${encodeURIComponent(features)}`;
    }

    https.get(pdUrl, (gRes) => {
      let b = '';
      gRes.on('data', c => b += c);
      gRes.on('end', () => {
        res.writeHead(gRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(b);
      });
    }).on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // API Route: Geoapify IP Geolocation API Proxy (Key: 0ae0a18aa62240379014c7b7d7e08c28)
  if (reqUrl === '/api/ipinfo' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const ip = urlObj.searchParams.get('ip');

    let ipUrl = `https://api.geoapify.com/v1/ipinfo?apiKey=${GEOAPIFY_IP_GEO_KEY}`;
    if (ip) {
      ipUrl += `&ip=${encodeURIComponent(ip)}`;
    }

    https.get(ipUrl, (gRes) => {
      let b = '';
      gRes.on('data', c => b += c);
      gRes.on('end', () => {
        res.writeHead(gRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(b);
      });
    }).on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // API Route: Geoapify Map Matching API Proxy (Key: 8fca0f76ccf44e46b3cd9a3cac47e6ff)
  if (reqUrl === '/api/mapmatching') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 1e6) req.destroy();
      });
      req.on('end', () => {
        const mmUrl = new URL(`https://api.geoapify.com/v1/mapmatching?apiKey=${GEOAPIFY_MAP_MATCHING_KEY}`);
        const postData = body || JSON.stringify({
          mode: 'drive',
          waypoints: [
            { lat: 37.7855, lon: -122.4015, timestamp: 1000 },
            { lat: 37.7865, lon: -122.4010, timestamp: 1030 }
          ]
        });

        const reqOpt = {
          hostname: mmUrl.hostname,
          path: mmUrl.pathname + mmUrl.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const mmReq = https.request(reqOpt, (gRes) => {
          let b = '';
          gRes.on('data', c => b += c);
          gRes.on('end', () => {
            res.writeHead(gRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(b);
          });
        });
        mmReq.on('error', (err) => {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });
        mmReq.write(postData);
        mmReq.end();
      });
      return;
    } else if (req.method === 'GET') {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const mode = urlObj.searchParams.get('mode') || 'drive';
      const defaultWaypoints = [
        { lat: 37.7855, lon: -122.4015, timestamp: 1000 },
        { lat: 37.7865, lon: -122.4010, timestamp: 1030 }
      ];
      let waypoints = defaultWaypoints;
      const wpParam = urlObj.searchParams.get('waypoints');
      if (wpParam) {
        try {
          waypoints = JSON.parse(wpParam);
        } catch (e) {
          waypoints = wpParam.split('|').map((pair, idx) => {
            const [lat, lon] = pair.split(',').map(Number);
            return { lat, lon, timestamp: 1000 + idx * 30 };
          });
        }
      }

      const postData = JSON.stringify({ mode, waypoints });
      const mmUrl = new URL(`https://api.geoapify.com/v1/mapmatching?apiKey=${GEOAPIFY_MAP_MATCHING_KEY}`);
      const reqOpt = {
        hostname: mmUrl.hostname,
        path: mmUrl.pathname + mmUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const mmReq = https.request(reqOpt, (gRes) => {
        let b = '';
        gRes.on('data', c => b += c);
        gRes.on('end', () => {
          res.writeHead(gRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(b);
        });
      });
      mmReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });
      mmReq.write(postData);
      mmReq.end();
      return;
    }
  }

  // API Route: Featherless AI Chat Completions Proxy
  if (reqUrl === '/api/featherless/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy(); // 1MB limit
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const model = payload.model || DEFAULT_FEATHERLESS_MODEL;
        const messages = payload.messages || [];
        const max_tokens = payload.max_tokens || 800;
        const temperature = payload.temperature !== undefined ? payload.temperature : 0.7;

        const requestData = JSON.stringify({
          model,
          messages,
          max_tokens,
          temperature
        });

        const featherlessReq = https.request('https://api.featherless.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FEATHERLESS_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestData)
          }
        }, (fRes) => {
          let responseBody = '';
          fRes.on('data', chunk => responseBody += chunk);
          fRes.on('end', () => {
            res.writeHead(fRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(responseBody);
          });
        });

        featherlessReq.on('error', (err) => {
          console.error('[Featherless Proxy Error]:', err.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: 'Failed to communicate with Featherless AI: ' + err.message } }));
        });

        featherlessReq.write(requestData);
        featherlessReq.end();
      } catch (parseErr) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Invalid JSON request payload' } }));
      }
    });
    return;
  }

  // Static File Serving
  let safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      const fallbackPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(fallbackPath, (fallbackErr, content) => {
        if (fallbackErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${readErr.code}`);
        return;
      }
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`QUANTUM TRAFFIC - Smart City Optimization Command Center`);
  console.log(`Featherless AI Endpoint: https://api.featherless.ai/v1`);
  console.log(`Featherless Model: ${DEFAULT_FEATHERLESS_MODEL}`);
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
