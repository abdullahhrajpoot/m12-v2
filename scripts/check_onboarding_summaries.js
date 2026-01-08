// Script to check onboarding_summaries table in Supabase
// Usage: node scripts/check_onboarding_summaries.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkOnboardingSummaries() {
  try {
    console.log('Querying onboarding_summaries table...\n')
    
    const { data, error } = await supabase
      .from('onboarding_summaries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error querying database:', error)
      return
    }

    if (!data || data.length === 0) {
      console.log('No onboarding summaries found in the database.')
      return
    }

    console.log(`Found ${data.length} onboarding summary record(s):\n`)
    
    data.forEach((record, index) => {
      console.log(`--- Record ${index + 1} ---`)
      console.log(`ID: ${record.id}`)
      console.log(`User ID: ${record.user_id}`)
      console.log(`Status: ${record.status}`)
      console.log(`Created: ${record.created_at}`)
      console.log(`Updated: ${record.updated_at}`)
      console.log(`Summary Sentences: ${JSON.stringify(record.summary_sentences, null, 2)}`)
      console.log(`Children: ${JSON.stringify(record.children, null, 2)}`)
      console.log(`Emails Analyzed: ${record.emails_analyzed_count || 'null'}`)
      console.log('')
    })

    // Check for the most recent run's user ID
    const userId = '8ac8bfee-c53a-4c35-b2d0-f92b0906b146' // From the execution data
    const userRecords = data.filter(r => r.user_id === userId)
    
    if (userRecords.length > 0) {
      console.log(`\nFound ${userRecords.length} record(s) for user ${userId}:`)
      userRecords.forEach((record, index) => {
        console.log(`\nRecord ${index + 1}:`)
        console.log(`  ID: ${record.id}`)
        console.log(`  Status: ${record.status}`)
        console.log(`  Summary Sentences Count: ${record.summary_sentences?.length || 0}`)
        console.log(`  Summary Sentences: ${JSON.stringify(record.summary_sentences, null, 2)}`)
      })
    } else {
      console.log(`\nNo records found for user ${userId}`)
    }

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

checkOnboardingSummaries()





