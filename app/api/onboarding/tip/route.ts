import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * API endpoint to fetch a random onboarding tip/message
 * 
 * Returns a random active message from the onboarding_tips table.
 * No authentication required - public endpoint.
 * 
 * Usage:
 * GET /api/onboarding/tip
 */
export async function GET() {
  try {
    // Use anon key for public access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get all active tips and select a random one
    const { data: tips, error } = await supabase
      .from('onboarding_tips')
      .select('message, category')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching tips:', error)
      // Return fallback message if database error
      return NextResponse.json({
        message: 'We search for specific keywords like school, elementary, soccer, and ballet to find only what matters to your family.',
        category: 'tip'
      })
    }

    if (!tips || tips.length === 0) {
      // Return fallback message if no tips found
      return NextResponse.json({
        message: 'We search for specific keywords like school, elementary, soccer, and ballet to find only what matters to your family.',
        category: 'tip'
      })
    }

    // Select random tip
    const randomTip = tips[Math.floor(Math.random() * tips.length)]

    return NextResponse.json(randomTip)

  } catch (error) {
    console.error('Error in tip endpoint:', error)
    // Return fallback message on error
    return NextResponse.json({
      message: 'We search for specific keywords like school, elementary, soccer, and ballet to find only what matters to your family.',
      category: 'tip'
    })
  }
}

