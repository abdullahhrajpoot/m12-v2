/**
 * Reconnect a Disconnected Unipile Account
 * 
 * Use this when an account shows "disconnected_account" error
 * 
 * Run with: npx tsx reconnect-unipile-account.ts
 */

const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY || 'YOUR_API_KEY_HERE';
const UNIPILE_DSN = process.env.UNIPILE_DSN || 'https://api27.unipile.com:15744';
const UNIPILE_BASE_URL = `${UNIPILE_DSN}/api/v1`;

// The account ID that needs reconnection
const ACCOUNT_ID = '0hfYUBUcTK-Hl6uQKIuIsw';

async function reconnectAccount() {
  console.log('🔄 Generating reconnection link...\n');

  // Generate expiration date (24 hours from now)
  const expiresOn = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  const reconnectResponse = await fetch(`${UNIPILE_BASE_URL}/hosted/accounts/link`, {
    method: 'POST',
    headers: {
      'X-API-KEY': UNIPILE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'reconnect',
      reconnect_account: ACCOUNT_ID,
      api_url: UNIPILE_DSN,
      expiresOn: expiresOn,
      success_redirect_url: 'http://localhost:3000/auth/success',
      failure_redirect_url: 'http://localhost:3000/auth/failure',
    }),
  });

  if (!reconnectResponse.ok) {
    console.error('❌ Failed to create reconnection link');
    console.error('Status:', reconnectResponse.status);
    console.error('Response:', await reconnectResponse.text());
    return;
  }

  const { url: reconnectUrl } = await reconnectResponse.json();
  
  console.log('✅ Reconnection link created!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 COPY THIS URL AND OPEN IN YOUR BROWSER:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n' + reconnectUrl + '\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('👉 Steps:');
  console.log('   1. Click the link above');
  console.log('   2. Sign in with the SAME Gmail account');
  console.log('   3. Grant permissions again');
  console.log('   4. After reconnecting, run test-unipile-signup.ts again\n');
}

// Run
if (UNIPILE_API_KEY === 'YOUR_API_KEY_HERE') {
  console.error('❌ Error: Please set UNIPILE_API_KEY environment variable');
  process.exit(1);
}

reconnectAccount().catch((error) => {
  console.error('💥 Failed:', error.message);
  console.error(error);
  process.exit(1);
});
