/**
 * Script to find the correct Supabase redirect URI for Google OAuth
 * 
 * Run with: node scripts/find_supabase_redirect_uri.js
 */

const fs = require('fs');
const path = require('path');

// Try to read from .env.local or .env
function getEnvVar(varName) {
  const envFiles = ['.env.local', '.env'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (match) {
        return match[1].trim();
      }
    }
  }
  
  // Also check process.env for runtime vars
  return process.env[varName] || null;
}

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');

if (!supabaseUrl) {
  console.error('❌ Could not find NEXT_PUBLIC_SUPABASE_URL');
  console.log('\n💡 Please set NEXT_PUBLIC_SUPABASE_URL in your .env.local file');
  console.log('   Example: NEXT_PUBLIC_SUPABASE_URL=https://fvjmzvvcyxsvstlhenex.supabase.co');
  process.exit(1);
}

// Extract project ID from Supabase URL
const projectMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!projectMatch) {
  console.error('❌ Could not parse Supabase URL:', supabaseUrl);
  console.log('\n💡 Expected format: https://[project-id].supabase.co');
  process.exit(1);
}

const projectId = projectMatch[1];
const redirectUri = `https://${projectId}.supabase.co/auth/v1/callback`;

console.log('\n✅ Found Supabase Configuration:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Project ID: ${projectId}`);
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`\n🔗 OAuth Redirect URI for Google Cloud Console:`);
console.log(`   ${redirectUri}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 Next Steps:');
console.log('1. Go to: https://console.cloud.google.com');
console.log('2. Select your project');
console.log('3. Navigate to: APIs & Services → Credentials');
console.log('4. Find your OAuth 2.0 Client ID (the one used by Supabase)');
console.log('5. Click Edit');
console.log(`6. Under "Authorized redirect URIs", add: ${redirectUri}`);
console.log('7. Save the changes');
console.log('\n💡 Also add for local development:');
console.log('   http://localhost:54321/auth/v1/callback\n');
