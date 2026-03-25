import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const channelSecret = process.env.LINE_CHANNEL_SECRET || ''

// POST handler for webhook
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-line-signature') || ''
    const body = await req.text()

    // Verify signature (skip if channel secret is not set)
    if (channelSecret && !verifySignature(body, channelSecret, signature)) {
      console.error('Invalid signature')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const parsed = JSON.parse(body)
    const events = parsed.events

    // LINE verification request sends empty events array - return 200
    if (!events || !Array.isArray(events) || events.length === 0) {
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
      await handleFollow(event)
      break
    case 'unfollow':
      await handleUnfollow(event)
      break
    case 'message':
      await handleMessage(event)
      break
    case 'postback':
      await handlePostback(event)
      break
    default:
      console.log('Unknown event type:', event.type)
  }
}

async function handleFollow(event: any) {
  const lineUserId = event.source.userId
  console.log('User followed:', lineUserId)
}

async function handleUnfollow(event: any) {
  const lineUserId = event.source.userId
  console.log('User unfollowed:', lineUserId)
}

async function handleMessage(event: any) {
  const lineUserId = event.source.userId
  console.log('Message from user:', lineUserId, event.message?.type)
}

async function handlePostback(event: any) {
  console.log('Postback event:', event.postback)
}

function verifySignature(body: string, secret: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64')

  return hash === signature
}

// Health check endpoint
export async function GET(_req: NextRequest) {
  return NextResponse.json({ status: 'ok' })
}
