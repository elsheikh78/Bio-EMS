const fs = require('node:fs');
const https = require('node:https');
const server = https.createServer({ pfx: fs.readFileSync(process.env.BIOEMS_TEST_SERVER_PFX), passphrase: process.env.BIOEMS_TEST_SERVER_PASSWORD }, (req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ status: 'UP' }));
});
server.listen(Number(process.env.BIOEMS_TEST_SERVER_PORT), '127.0.0.1', () => console.log('READY'));
