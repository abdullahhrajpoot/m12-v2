import { createClient } from '@supabase/supabase-js'

/**
 * Ensure a user has a family membership record
 * Creates a new family if the user doesn't belong to one
 * Updates unipile_account_id if it has changed
 */
export async function ensureFamilyMembership(
  userId: string,
  email: string,
  unipileAccountId: string
): Promise<{ familyId: string; isNew: boolean }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration')
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  // Check if user already has a family membership
  const { data: existingMember, error: lookupError } = await supabaseAdmin
    .from('family_members')
    .select('family_id, unipile_account_id')
    .eq('email', email)
    .single()

  if (lookupError && lookupError.code !== 'PGRST116') {
    // PGRST116 = not found, which is expected for new users
    console.error('Error looking up family membership:', lookupError)
    throw new Error('Failed to lookup family membership')
  }

  // User already has a family membership
  if (existingMember) {
    console.log('✅ User already belongs to family:', existingMember.family_id)

    // Update unipile_account_id if it changed
    if (existingMember.unipile_account_id !== unipileAccountId) {
      const { error: updateError } = await supabaseAdmin
        .from('family_members')
        .update({
          unipile_account_id: unipileAccountId,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)

      if (updateError) {
        console.error('Error updating unipile_account_id:', updateError)
      } else {
        console.log('✅ Updated unipile_account_id for user')
      }
    }

    return {
      familyId: existingMember.family_id,
      isNew: false
    }
  }

  // User doesn't have a family - create one
  console.log('📝 Creating new family for user:', email)

  // Extract name from email (before @)
  const familyName = email.split('@')[0] + ' Family'

  // Create new family
  const { data: newFamily, error: familyError } = await supabaseAdmin
    .from('families')
    .insert({
      name: familyName
    })
    .select()
    .single()

  if (familyError || !newFamily) {
    console.error('Error creating family:', familyError)
    throw new Error('Failed to create family')
  }

  console.log('✅ Created family:', newFamily.id, 'name:', newFamily.name)

  // Create family member record
  const { data: newMember, error: memberError } = await supabaseAdmin
    .from('family_members')
    .insert({
      family_id: newFamily.id,
      email: email,
      display_name: email.split('@')[0],
      unipile_account_id: unipileAccountId,
      role: 'member'
    })
    .select()
    .single()

  if (memberError || !newMember) {
    console.error('Error creating family member:', memberError)
    throw new Error('Failed to create family member')
  }

  console.log('✅ Created family member for:', email)

  return {
    familyId: newFamily.id,
    isNew: true
  }
}

/**
 * Get family ID for a user by email
 */
export async function getFamilyIdByEmail(email: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration')
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  const { data, error } = await supabaseAdmin
    .from('family_members')
    .select('family_id')
    .eq('email', email)
    .single()

  if (error || !data) {
    return null
  }

  return data.family_id
}
