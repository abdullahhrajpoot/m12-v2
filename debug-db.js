
const { createClient } = require('@supabase/supabase-js');
const dt = require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('--- DB DEBUGGER ---');
    console.log('URL:', supabaseUrl);

    // 1. List recent oauth_tokens
    console.log('\nQuerying recent oauth_tokens...');
    const { data: tokens, error } = await supabase
        .from('oauth_tokens')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching tokens:', error);
    } else {
        console.log(`Found ${tokens.length} records.`);
        tokens.forEach(t => {
            console.log(`- User: ${t.user_id} | Prov: ${t.provider} | UnipileID: ${t.unipile_account_id} | Updated: ${t.updated_at}`);
        });
    }

    // 2. Check users table
    console.log('\nQuerying recent users...');
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (userError) {
        console.error('Error fetching users:', userError);
    } else {
        users.forEach(u => console.log(`- User: ${u.email} (${u.id})`));
    }

})();
