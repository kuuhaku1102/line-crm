import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET messages
export async function GET(_req: NextRequest) {
  try {
    const messages = await prisma.message.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { message: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST create message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, content, type } = body

    if (!title || !content || !type) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        title,
        content,
        type,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Failed to create message:', error)
    return NextResponse.json(
      { message: 'Failed to create message' },
      { status: 500 }
    )
  }
}
