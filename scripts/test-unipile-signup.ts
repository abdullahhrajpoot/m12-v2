/**
 * Simplest Unipile Sign-Up & Email Read Test
 * 
 * This tests the complete user flow:
 * 1. Generate hosted auth link
 * 2. User connects Gmail account
 * 3. Read their emails
 * 
 * Run with: npx tsx test-unipile-signup.ts
 * 
 * Prerequisites:
 * - Set UNIPILE_API_KEY in your .env or environment
 * - Have a test Gmail account ready
 */

const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY || 'YOUR_API_KEY_HERE';
const UNIPILE_DSN = process.env.UNIPILE_DSN || 'https://1api27.unipile.com:15744'; // Your custom DSN
const UNIPILE_BASE_URL = `${UNIPILE_DSN}/api/v1`;

async function testUnipileSignup() {
  console.log('🧪 Testing Unipile User Signup & Email Read\n');
  console.log('============================================\n');

  // Step 1: Create a hosted auth link for the user
  console.log('1️⃣ Creating hosted auth link for user...\n');
  
  // Generate expiration date (24 hours from now)
  const expiresOn = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  const hostedLinkResponse = await fetch(`${UNIPILE_BASE_URL}/hosted/accounts/link`, {
    method: 'POST',
    headers: {
      'X-API-KEY': UNIPILE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'create',
      providers: ['GOOGLE'], // Gmail uses GOOGLE provider
      api_url: UNIPILE_DSN,
      expiresOn: expiresOn,
      success_redirect_url: 'http://localhost:3000/auth/success',
      failure_redirect_url: 'http://localhost:3000/auth/failure',
      name: 'test-user', // Identifier for your records
    }),
  });

  if (!hostedLinkResponse.ok) {
    console.error('❌ Failed to create hosted auth link');
    console.error('Status:', hostedLinkResponse.status);
    console.error('Response:', await hostedLinkResponse.text());
    return;
  }

  const { url: authUrl } = await hostedLinkResponse.json();
  
  console.log('✅ Hosted auth link created!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 COPY THIS URL AND OPEN IN YOUR BROWSER:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n' + authUrl + '\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('👉 Steps:');
  console.log('   1. Click the link above');
  console.log('   2. Sign in with your TEST Gmail account');
  console.log('   3. Grant permissions');
  console.log('   4. After connecting, come back here\n');
  
  // Wait for user to complete OAuth
  console.log('⏳ Waiting for you to connect your account...');
  console.log('   (Press ENTER after you\'ve connected your Gmail)\n');
  
  await waitForEnter();
  
  // Step 2: List accounts to find the newly connected one
  console.log('\n2️⃣ Checking for connected accounts...\n');
  
  const accountsResponse = await fetch(`${UNIPILE_BASE_URL}/accounts`, {
    headers: {
      'X-API-KEY': UNIPILE_API_KEY,
    },
  });

  if (!accountsResponse.ok) {
    console.error('❌ Failed to fetch accounts');
    console.error('Status:', accountsResponse.status);
    console.error('Response:', await accountsResponse.text());
    return;
  }

  const accounts = await accountsResponse.json();
  
  if (!accounts.items || accounts.items.length === 0) {
    console.error('❌ No accounts found. Did you complete the OAuth flow?');
    return;
  }

  // Get the most recent account (just connected)
  const account = accounts.items[0];
  
  console.log('✅ Found connected account:');
  console.log('   Account ID:', account.id);
  console.log('   Type:', account.object || 'Account');
  console.log();

  // Step 3: Fetch recent emails
  console.log('3️⃣ Reading recent emails from connected account...\n');
  
  const emailsResponse = await fetch(
    `${UNIPILE_BASE_URL}/emails?account_id=${account.id}&limit=10`,
    {
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
      },
    }
  );

  if (!emailsResponse.ok) {
    console.error('❌ Failed to fetch emails');
    console.error('Status:', emailsResponse.status);
    console.error('Response:', await emailsResponse.text());
    return;
  }

  const emails = await emailsResponse.json();
  
  console.log(`✅ Successfully read ${emails.items?.length || 0} recent emails!\n`);
  
  if (emails.items && emails.items.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Recent Emails:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    emails.items.slice(0, 5).forEach((email: any, index: number) => {
      const fromName = email.from_attendee?.display_name || email.from_attendee?.identifier || 'Unknown';
      const bodyPreview = email.body_plain?.substring(0, 100) || email.body?.substring(0, 100) || '(no preview)';
      
      console.log(`${index + 1}. ${email.subject || '(no subject)'}`);
      console.log(`   From: ${fromName}`);
      console.log(`   Date: ${new Date(email.date).toLocaleString()}`);
      console.log(`   Preview: ${bodyPreview.replace(/\n/g, ' ')}...`);
      console.log();
    });
  }

  // Step 4: Fetch one full email with body content
  if (emails.items && emails.items.length > 0) {
    console.log('4️⃣ Fetching full content of latest email...\n');
    
    const firstEmailId = emails.items[0].id;
    const fullEmailResponse = await fetch(
      `${UNIPILE_BASE_URL}/emails/${firstEmailId}?account_id=${account.id}`,
      {
        headers: {
          'X-API-KEY': UNIPILE_API_KEY,
        },
      }
    );

    if (!fullEmailResponse.ok) {
      console.error('❌ Failed to fetch full email');
      console.error('Status:', fullEmailResponse.status);
      console.error('Response:', await fullEmailResponse.text());
    } else {
      const fullEmail = await fullEmailResponse.json();
      console.log('✅ Full email retrieved!');
      console.log('   ID:', fullEmail.id);
      console.log('   Subject:', fullEmail.subject);
      console.log('   From:', fullEmail.from_attendee?.display_name || fullEmail.from_attendee?.identifier);
      console.log('   To:', fullEmail.to_attendees?.map((t: any) => t.identifier).join(', ') || '(none)');
      console.log('   Date:', new Date(fullEmail.date).toLocaleString());
      
      // Unipile uses body_plain (plain text) and body (HTML)
      const bodyPlain = fullEmail.body_plain || '';
      const bodyHtml = fullEmail.body || '';
      
      console.log('   📊 Content Summary:');
      console.log('   ├─ Plain text length:', bodyPlain.length, 'characters');
      console.log('   ├─ HTML length:', bodyHtml.length, 'characters');
      console.log('   ├─ Has attachments:', fullEmail.has_attachments || false);
      console.log('   ├─ Attachment count:', fullEmail.attachments?.length || 0);
      console.log('   └─ Is complete:', fullEmail.is_complete);
      console.log();
      
      // Show BOTH plain text and HTML if available
      if (bodyPlain && bodyPlain.length > 0) {
        const previewLength = 1000; // Show more characters
        const preview = bodyPlain.substring(0, previewLength);
        console.log('   📧 PLAIN TEXT Body (first 1000 chars):');
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   ' + preview.replace(/\n/g, '\n   '));
        if (bodyPlain.length > previewLength) {
          console.log('   ... (truncated, FULL EMAIL HAS ' + bodyPlain.length + ' chars available via API)');
        }
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log();
      }
      
      if (bodyHtml && bodyHtml.length > 0) {
        const previewLength = 1000;
        const preview = bodyHtml.substring(0, previewLength);
        console.log('   🌐 HTML Body (first 1000 chars):');
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   ' + preview.replace(/\n/g, '\n   '));
        if (bodyHtml.length > previewLength) {
          console.log('   ... (truncated, FULL EMAIL HAS ' + bodyHtml.length + ' chars available via API)');
        }
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log();
      }
      
      if (!bodyPlain && !bodyHtml) {
        console.log('   ⚠️  No body content found in response');
        console.log('   Available fields:', Object.keys(fullEmail).join(', '));
        console.log();
      }
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ TEST COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Summary:');
  console.log(`  ✓ User connected Gmail account: ${account.provider_email}`);
  console.log(`  ✓ Read ${emails.items?.length || 0} recent emails`);
  console.log(`  ✓ Account ID: ${account.id}`);
  console.log();
  console.log('Next steps:');
  console.log('  - Store account.id in your database linked to user');
  console.log('  - Use account.id for all future API calls');
  console.log('  - Set up webhooks for real-time email notifications');
  console.log('  - Integrate into your workflows\n');
}

// Helper to wait for user input
function waitForEnter(): Promise<void> {
  return new Promise((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
}

// Run the test
console.log('Starting Unipile signup test...\n');
console.log('Make sure you have set UNIPILE_API_KEY and UNIPILE_DSN in your environment!\n');

if (UNIPILE_API_KEY === 'YOUR_API_KEY_HERE') {
  console.error('❌ Error: Please set UNIPILE_API_KEY environment variable');
  console.error('   Example: export UNIPILE_API_KEY=your_key_here');
  process.exit(1);
}

if (UNIPILE_DSN === 'https://1api27.unipile.com:15744') {
  console.warn('⚠️  Warning: Using example DSN. Set UNIPILE_DSN for your specific instance.');
  console.warn('   Example: export UNIPILE_DSN=https://YOUR_DSN.unipile.com:PORT');
  console.warn('   Find your DSN in Unipile dashboard\n');
}

testUnipileSignup().catch((error) => {
  console.error('\n💥 Test failed with error:', error.message);
  console.error(error);
  process.exit(1);
});
