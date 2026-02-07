
const dt = require('dotenv').config({ path: '.env' });
const https = require('https');

let dsn = process.env.UNIPILE_DSN || '';
let apiKey = process.env.UNIPILE_API_KEY || '';

// Sanitization
if (dsn.startsWith('"') && dsn.endsWith('"')) dsn = dsn.slice(1, -1);
if (dsn.startsWith("'") && dsn.endsWith("'")) dsn = dsn.slice(1, -1);
if (dsn && !dsn.startsWith('http')) dsn = `https://${dsn}`;
if (apiKey.startsWith('"') && apiKey.endsWith('"')) apiKey = apiKey.slice(1, -1);
if (apiKey.startsWith("'") && apiKey.endsWith("'")) apiKey = apiKey.slice(1, -1);

console.log('--- DEEP DIAGNOSTIC ---');
console.log('Target DSN:', dsn);
// ID from Step 290 (Captured via Debug Callback)
const targetId = 'uz9SxirRTPa7zseARi9aKw';

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, dsn);
        console.log(`\nFetching: ${url.toString()}`);
        const options = {
            method: 'GET',
            headers: { 'X-API-KEY': apiKey, 'accept': 'application/json' }
        };
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        req.end();
    });
}

(async () => {
    // 1. Try to fetch the specific account that was generated during auth
    console.log(`\n1. Checking specific Account ID: ${targetId}`);
    const res = await makeRequest(`/api/v1/accounts/${targetId}`);
    console.log(`Status: ${res.status}`);
    console.log('Response:', res.data.substring(0, 500)); // Print first 500 chars

    // 2. Try to list accounts again
    console.log('\n2. Listing all accounts again...');
    const list = await makeRequest('/api/v1/accounts');
    console.log(`Status: ${list.status}`);
    console.log('Response:', list.data.substring(0, 500));

})();
