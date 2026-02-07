
const { createClient } = require('@supabase/supabase-js');
const dt = require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_SESSION = '2e2518ab-f0e3-4a47-9cb8-7dfd418a7a73';
const TARGET_EMAIL = 'burnitdown5802@gmail.com';

(async () => {
    console.log('--- SESSION DEBUGGER ---');

    // 1. Check for the User
    console.log(`\n1. Searching for user: ${TARGET_EMAIL}`);
    const { data: users } = await supabase.from('users').select('*').ilike('email', TARGET_EMAIL);
    // Also check auth.users (requires admin)
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const targetAuthUser = authUsers.find(u => u.email === TARGET_EMAIL);

    if (targetAuthUser) console.log('✅ Found AUTH User:', targetAuthUser.id);
    else console.log('❌ Auth User NOT FOUND');

    if (users && users.length > 0) console.log('✅ Found PUBLIC User:', users[0].id);
    else console.log('❌ Public User NOT FOUND');

    // 2. Check for the Session Map
    console.log(`\n2. Searching for Token with unipile_account_id = ${TARGET_SESSION}`);
    const { data: tokens } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('unipile_account_id', TARGET_SESSION);

    if (tokens && tokens.length > 0) {
        console.log('✅ FOUND SESSION MAP RECORD/S:');
        console.log(JSON.stringify(tokens, null, 2));
    } else {
        console.log('❌ NO SESSION MAP FOUND.');

        // Dump raw recent tokens to see what IS there
        console.log('\nDumping 5 most recent tokens:');
        const { data: recent } = await supabase.from('oauth_tokens').select('*').order('updated_at', { ascending: false }).limit(5);
        console.log(JSON.stringify(recent, null, 2));
    }
})();
