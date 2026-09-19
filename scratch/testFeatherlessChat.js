const http = require('http');

const payload = JSON.stringify({
  messages: [
    { role: "system", content: "You are an AI Urban Traffic Engineer." },
    { role: "user", content: "Explain in 2 sentences how quantum QAOA reduces intersection waiting time." }
  ],
  max_tokens: 150
});

const req = http.request('http://localhost:3000/api/featherless/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Featherless Chat Response Status:', res.statusCode);
    try {
      const parsed = JSON.parse(body);
      console.log('Featherless AI message content:', parsed.choices[0].message.content);
    } catch(e) {
      console.log('Raw body:', body);
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(payload);
req.end();
