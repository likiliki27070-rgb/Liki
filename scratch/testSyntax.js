const fs = require('fs');
const https = require('https');

// Test if babel-standalone is downloaded or we can download it to verify app.js
https.get('https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.6/babel.min.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      // Evaluate babel in a sandbox / vm
      const vm = require('vm');
      const ctx = { window: {}, console: console };
      vm.createContext(ctx);
      vm.runInContext(data, ctx);
      const Babel = ctx.Babel || ctx.window.Babel;

      const appCode = fs.readFileSync('js/app.js', 'utf8');
      const transformed = Babel.transform(appCode, { presets: ['react'] });
      console.log('SUCCESS: Babel successfully transformed app.js without errors! Transformed code length:', transformed.code.length);
    } catch (e) {
      console.error('BABEL TRANSFORMATION ERROR:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('Failed to download Babel for check:', err.message);
});
