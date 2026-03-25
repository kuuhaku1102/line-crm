import { NextRequest, NextResponse } from 'next/server'
import { sendConversion } from '@/lib/meta'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { eventName, userData, customData } = body

    if (!eventName) {
      return NextResponse.json(
        { error: 'eventName is required' },
        { status: 400 }
      )
    }

    const success = await sendConversion(eventName, userData || {}, customData)

    return NextResponse.json({
      success,
      message: success ? 'Event sent' : 'Failed to send event',
    })
  } catch (error) {
    console.error('Error sending Meta CAPI event:', error)
    return NextResponse.json(
      { error: 'Failed to send event' },
      { status: 500 }
    )
  }
}

export async function GET(_req: NextRequest) {
  return NextResponse.json({
    message: 'Meta CAPI endpoint. Use POST to send events.',
  })
}
