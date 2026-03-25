import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { lineClient } from '@/lib/line'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const body = await req.json()
    const { messageType, content } = body

    if (!messageType || !content) {
      return NextResponse.json(
        { message: 'Missing required fields: messageType, content' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Build message
    let messages: any[] = []

    if (messageType === 'text') {
      messages = [
        {
          type: 'text',
          text: content,
        },
      ]
    } else if (messageType === 'flex') {
      try {
        messages = [JSON.parse(content)]
      } catch (e) {
        return NextResponse.json(
          { message: 'Invalid FLEX message format' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { message: 'Unsupported message type' },
        { status: 400 }
      )
    }

    // Send message
    try {
      await lineClient.pushMessage({
        to: user.lineUserId,
        messages,
      })

      // Save outgoing message to ChatLog
      await prisma.chatLog.create({
        data: {
          lineUserId: user.lineUserId,
          direction: 'OUTGOING',
          messageType,
          content: messageType === 'text' ? content : JSON.stringify(JSON.parse(content)),
        },
      })

      return NextResponse.json(
        { message: 'Message sent successfully' },
        { status: 200 }
      )
    } catch (error) {
      console.error('Failed to send message to LINE:', error)
      return NextResponse.json(
        { message: 'Failed to send message', error: String(error) },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Failed to send individual message:', error)
    return NextResponse.json(
      { message: 'Failed to send individual message', error: String(error) },
      { status: 500 }
    )
  }
}
