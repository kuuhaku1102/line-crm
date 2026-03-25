import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await prisma.stepMessage.findMany({
      where: { sequenceId: params.id },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching step messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { dayOffset, hour, title, content, messageType } = body

    if (dayOffset === undefined || !title || !content) {
      return NextResponse.json(
        { error: 'dayOffset, title, and content are required' },
        { status: 400 }
      )
    }

    // Get max sortOrder
    const lastMessage = await prisma.stepMessage.findFirst({
      where: { sequenceId: params.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const nextSortOrder = (lastMessage?.sortOrder || 0) + 1

    const message = await prisma.stepMessage.create({
      data: {
        sequenceId: params.id,
        dayOffset,
        hour: hour || 10,
        title,
        content,
        messageType: messageType || 'text',
        sortOrder: nextSortOrder,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating step message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      )
    }

    await prisma.stepMessage.delete({
      where: { id: messageId },
    })

    return NextResponse.json({ message: 'Message deleted' })
  } catch (error) {
    console.error('Error deleting step message:', error)
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}
