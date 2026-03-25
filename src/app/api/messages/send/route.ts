import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { lineClient } from '@/lib/line'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messageId, tagFilters } = body

    if (!messageId) {
      return NextResponse.json(
        { message: 'Missing messageId' },
        { status: 400 }
      )
    }

    // Fetch the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return NextResponse.json(
        { message: 'Message not found' },
        { status: 404 }
      )
    }

    // Build user query based on tag filters
    let userQuery: any = {
      where: {
        isBlocked: false,
        unfollowedAt: null,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    }

    // If tag filters are provided, only include users with those tags
    if (tagFilters && Array.isArray(tagFilters) && tagFilters.length > 0) {
      userQuery.where.tags = {
        some: {
          tag: {
            name: {
              in: tagFilters,
            },
          },
        },
      }
    }

    // Get target users
    const users = await prisma.user.findMany(userQuery)

    if (users.length === 0) {
      return NextResponse.json(
        { message: 'No users found matching criteria' },
        { status: 400 }
      )
    }

    // Parse message content based on type
    let messages: any[] = []

    if (message.type === 'FLEX') {
      try {
        messages = [JSON.parse(message.content)]
      } catch (e) {
        console.error('Failed to parse FLEX message:', e)
        return NextResponse.json(
          { message: 'Invalid FLEX message format' },
          { status: 400 }
        )
      }
    } else if (message.type === 'TEXT') {
      messages = [
        {
          type: 'text',
          text: message.content,
        },
      ]
    } else if (message.type === 'IMAGE') {
      try {
        messages = [JSON.parse(message.content)]
      } catch (e) {
        console.error('Failed to parse IMAGE message:', e)
        return NextResponse.json(
          { message: 'Invalid IMAGE message format' },
          { status: 400 }
        )
      }
    }

    // Send messages to all target users
    let successCount = 0
    const errors: string[] = []

    for (const user of users) {
      try {
        await lineClient.pushMessage({
          to: user.lineUserId,
          messages,
        })
        successCount++
      } catch (error) {
        console.error(`Failed to send to ${user.lineUserId}:`, error)
        errors.push(`Failed to send to ${user.lineUserId}`)
      }
    }

    // Update message with sent info
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        sentAt: new Date(),
        sentCount: successCount,
      },
    })

    return NextResponse.json(
      {
        message: 'Message sent successfully',
        sentCount: successCount,
        totalUsers: users.length,
        errors: errors.length > 0 ? errors : undefined,
        updatedMessage,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { message: 'Failed to send message', error: String(error) },
      { status: 500 }
    )
  }
}
