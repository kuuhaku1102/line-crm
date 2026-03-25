import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs'

function verifySignature(body: string, secret: string, signature: string): boolean {
  if (!secret || !signature) return false
  try {
    const hash = createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64')
    const hashBuffer = Buffer.from(hash, 'utf8')
    const signatureBuffer = Buffer.from(signature, 'utf8')
    if (hashBuffer.length !== signatureBuffer.length) return false
    return timingSafeEqual(hashBuffer, signatureBuffer)
  } catch {
    return false
  }
}

// POST handler for webhook
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-line-signature') || ''
    const body = await req.text()
    const channelSecret = process.env.LINE_CHANNEL_SECRET || ''

    // Verify LINE signature
    if (channelSecret) {
      const isValid = verifySignature(body, channelSecret, signature)
      if (!isValid) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
    }

    // Parse body - handle empty body for verification requests
    let events = []
    try {
      const parsed = JSON.parse(body)
      events = parsed.events || []
    } catch {
      // Body might not be valid JSON during verification
      return NextResponse.json({ message: 'OK' })
    }

    // LINE verification request sends empty events array - return 200
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ message: 'OK' })
    }

    // Process events
    for (const event of events) {
      try {
        await handleEvent(event)
      } catch (error) {
        console.error('Error handling event:', error)
      }
    }

    return NextResponse.json({ message: 'OK' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ message: 'OK' })
  }
}

async function handleEvent(event: any) {
  console.log('Processing event:', event.type)

  switch (event.type) {
    case 'follow':
      console.log('User followed:', event.source?.userId)
      break
    case 'unfollow':
      console.log('User unfollowed:', event.source?.userId)
      break
    case 'message':
      console.log('Message from user:', event.source?.userId, event.message?.type)
      break
    case 'postback':
      console.log('Postback event:', event.postback)
      break
    default:
      console.log('Unknown event type:', event.type)
  }
}

// Health check endpoint
export async function GET(_req: NextRequest) {
  return NextResponse.json({ status: 'ok' })
}
