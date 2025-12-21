// app/api/cron/ping-supabase/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = createClient() // Create client instance
    
    // Simple query to keep the database active
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (error) {
      logger.log('Ping failed:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Supabase ping successful at', new Date().toISOString())
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Supabase is alive'
    })
  } catch (err) {
    logger.log('Ping error:', err)
    return NextResponse.json(
      { success: false, error: 'Unknown error' },
      { status: 500 }
    )
  }
}