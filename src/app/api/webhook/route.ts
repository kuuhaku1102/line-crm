import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const channelSecret = process.env.LINE_CHANNEL_SECRET || ''

// POST handler for webhook
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-line-signature') || ''
    const body = await req.text()

    // Verify signature
    if (!verifySignature(body, channelSecret, signature)) {
      console.error('Invalid signature')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const events = JSON.parse(body).events

    if (!Array.isArray(events)) {
      return NextResponse.json({ message: 'Invalid events' }, { status: 400 })
    }

    // Process events
    await Promise.all(events.map((event) => handleEvent(event)))

    return NextResponse.json({ message: 'OK' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleEvent(event: any) {
  try {
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
  } catch (error) {
    console.error('Error handling event:', error)
  }
}

async function handleFollow(event: any) {
  const lineUserId = event.source.userId
  const timestamp = new Date(event.timestamp)

  try {
    const existingUser = await prisma.user.findUnique({
      where: { lineUserId },
    })

    if (existingUser) {
      // User was previously blocked or unfollowed, reactivate
      await prisma.user.update({
        where: { lineUserId },
        data: {
          isBlocked: false,
          unfollowedAt: null,
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          lineUserId,
          followedAt: timestamp,
        },
      })
    }

    console.log('User followed:', lineUserId)
  } catch (error) {
    console.error('Error handling follow event:', error)
  }
}

async function handleUnfollow(event: any) {
  const lineUserId = event.source.userId
  const timestamp = new Date(event.timestamp)

  try {
    await prisma.user.upsert({
      where: { lineUserId },
      create: {
        lineUserId,
        unfollowedAt: timestamp,
      },
      update: {
        unfollowedAt: timestamp,
      },
    })

    console.log('User unfollowed:', lineUserId)
  } catch (error) {
    console.error('Error handling unfollow event:', error)
  }
}

async function handleMessage(event: any) {
  const lineUserId = event.source.userId

  try {
    // Ensure user exists
    await prisma.user.upsert({
      where: { lineUserId },
      create: { lineUserId },
      update: { updatedAt: new Date() },
    })

    console.log('Message from user:', lineUserId, event.message.type)
  } catch (error) {
    console.error('Error handling message event:', error)
  }
}

async function handlePostback(event: any) {
  console.log('Postback event:', event.postback)
  // Handle postback events (button clicks, etc.)
}

function verifySignature(body: string, secret: string, signature: string): boolean {
  const crypto = require('crypto')
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64')

  return hash === signature
}

// Health check endpoint
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: 'ok' })
}
