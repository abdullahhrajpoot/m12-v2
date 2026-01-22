/**
 * Script to clear all users and tokens from Supabase and Unipile
 * 
 * WARNING: This will delete ALL users and data. Use with caution!
 * 
 * Usage:
 *   npx tsx scripts/clear-all-users.ts
 * 
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - UNIPILE_DSN
 *   - UNIPILE_API_KEY
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const unipileDsn = process.env.UNIPILE_DSN
const unipileApiKey = process.env.UNIPILE_API_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

async function clearSupabaseUsers() {
  console.log('🗑️  Clearing Supabase users and data...')
  
  try {
    // Step 1: Get all users
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError)
      return
    }
    
    console.log(`📊 Found ${users.users.length} users to delete`)
    
    // Step 2: Delete all users
    for (const user of users.users) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      if (deleteError) {
        console.error(`❌ Error deleting user ${user.id}:`, deleteError)
      } else {
        console.log(`✅ Deleted user: ${user.email || user.id}`)
      }
    }
    
    // Step 3: Delete all OAuth tokens
    const { error: tokensError } = await supabaseAdmin
      .from('oauth_tokens')
      .delete()
      .neq('id', 0) // Delete all
    
    if (tokensError) {
      console.error('❌ Error deleting OAuth tokens:', tokensError)
    } else {
      console.log('✅ Deleted all OAuth tokens')
    }
    
    // Step 4: Delete onboarding summaries
    const { error: summariesError } = await supabaseAdmin
      .from('onboarding_summaries')
      .delete()
      .neq('id', 0)
    
    if (summariesError) {
      console.error('❌ Error deleting onboarding summaries:', summariesError)
    } else {
      console.log('✅ Deleted all onboarding summaries')
    }
    
    // Step 5: Delete unified events
    const { error: eventsError } = await supabaseAdmin
      .from('unified_events')
      .delete()
      .neq('id', 0)
    
    if (eventsError) {
      console.error('❌ Error deleting unified events:', eventsError)
    } else {
      console.log('✅ Deleted all unified events')
    }
    
    // Step 6: Delete calendar events
    const { error: calendarError } = await supabaseAdmin
      .from('calendar_events')
      .delete()
      .neq('id', 0)
    
    if (calendarError) {
      console.error('❌ Error deleting calendar events:', calendarError)
    } else {
      console.log('✅ Deleted all calendar events')
    }
    
    // Step 7: Delete tasks
    const { error: tasksError } = await supabaseAdmin
      .from('tasks')
      .delete()
      .neq('id', 0)
    
    if (tasksError) {
      console.error('❌ Error deleting tasks:', tasksError)
    } else {
      console.log('✅ Deleted all tasks')
    }
    
    // Step 8: Delete family facts
    const { error: factsError } = await supabaseAdmin
      .from('family_facts')
      .delete()
      .neq('id', 0)
    
    if (factsError) {
      console.error('❌ Error deleting family facts:', factsError)
    } else {
      console.log('✅ Deleted all family facts')
    }
    
    // Step 9: Delete family keywords
    const { error: keywordsError } = await supabaseAdmin
      .from('family_keywords')
      .delete()
      .neq('id', 0)
    
    if (keywordsError) {
      console.error('❌ Error deleting family keywords:', keywordsError)
    } else {
      console.log('✅ Deleted all family keywords')
    }
    
    // Step 10: Delete connected services
    const { error: servicesError } = await supabaseAdmin
      .from('connected_services')
      .delete()
      .neq('id', 0)
    
    if (servicesError) {
      console.error('❌ Error deleting connected services:', servicesError)
    } else {
      console.log('✅ Deleted all connected services')
    }
    
    console.log('✅ Supabase cleanup complete!')
    
  } catch (error) {
    console.error('❌ Error during Supabase cleanup:', error)
  }
}

async function clearUnipileAccounts() {
  if (!unipileDsn || !unipileApiKey) {
    console.warn('⚠️  Missing Unipile credentials - skipping Unipile cleanup')
    console.warn('Required: UNIPILE_DSN, UNIPILE_API_KEY')
    return
  }
  
  console.log('🗑️  Clearing Unipile accounts...')
  
  try {
    // Get all accounts
    const accountsResponse = await fetch(`${unipileDsn}/api/v1/accounts`, {
      headers: {
        'X-API-KEY': unipileApiKey
      }
    })
    
    if (!accountsResponse.ok) {
      console.error('❌ Error fetching Unipile accounts:', accountsResponse.status, await accountsResponse.text())
      return
    }
    
    const accountsData = await accountsResponse.json()
    const accounts = accountsData.data || accountsData.accounts || []
    
    console.log(`📊 Found ${accounts.length} Unipile accounts to delete`)
    
    // Delete each account
    for (const account of accounts) {
      const accountId = account.id || account.account_id
      if (!accountId) {
        console.warn('⚠️  Skipping account without ID:', account)
        continue
      }
      
      const deleteResponse = await fetch(`${unipileDsn}/api/v1/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'X-API-KEY': unipileApiKey
        }
      })
      
      if (!deleteResponse.ok) {
        console.error(`❌ Error deleting Unipile account ${accountId}:`, deleteResponse.status, await deleteResponse.text())
      } else {
        console.log(`✅ Deleted Unipile account: ${accountId}`)
      }
    }
    
    console.log('✅ Unipile cleanup complete!')
    
  } catch (error) {
    console.error('❌ Error during Unipile cleanup:', error)
  }
}

async function main() {
  console.log('🚨 WARNING: This will delete ALL users and data!')
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...')
  
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  console.log('\n🔄 Starting cleanup...\n')
  
  await clearSupabaseUsers()
  console.log('')
  await clearUnipileAccounts()
  
  console.log('\n✅ All cleanup complete!')
}

main().catch(console.error)
