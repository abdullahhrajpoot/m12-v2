import { NextResponse } from 'next/server'

/**
 * Test endpoint to verify Railway logs are working
 * Visit: https://bippity.boo/api/test-logs
 */
export async function GET() {
  const timestamp = new Date().toISOString()
  
  // Test various log types
  console.log('✅ TEST LOG: API route hit at', timestamp)
  console.error('✅ TEST ERROR LOG: This is a test error at', timestamp)
  console.warn('✅ TEST WARN LOG: This is a test warning at', timestamp)
  
  // Log to stderr directly
  process.stderr.write(`[${timestamp}] Direct stderr write test\n`)
  
  return NextResponse.json({ 
    message: 'Check Railway logs for test messages',
    timestamp,
    instructions: 'Look for logs starting with ✅ TEST'
  })
}
