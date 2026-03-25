import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// POST add tag to customer
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const body = await req.json()
    const { tagId } = body

    if (!tagId) {
      return NextResponse.json(
        { message: 'Missing required field: tagId' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    })

    if (!tag) {
      return NextResponse.json(
        { message: 'Tag not found' },
        { status: 404 }
      )
    }

    // Check if user already has this tag
    const existingUserTag = await prisma.userTag.findUnique({
      where: {
        userId_tagId: {
          userId,
          tagId,
        },
      },
    })

    if (existingUserTag) {
      return NextResponse.json(
        { message: 'User already has this tag' },
        { status: 400 }
      )
    }

    // Add tag to user
    const userTag = await prisma.userTag.create({
      data: {
        userId,
        tagId,
      },
      include: {
        tag: true,
      },
    })

    return NextResponse.json(userTag, { status: 201 })
  } catch (error) {
    console.error('Failed to add tag to user:', error)
    return NextResponse.json(
      { message: 'Failed to add tag to user' },
      { status: 500 }
    )
  }
}

// DELETE remove tag from customer
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const body = await req.json()
    const { tagId } = body

    if (!tagId) {
      return NextResponse.json(
        { message: 'Missing required field: tagId' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Remove tag from user
    const userTag = await prisma.userTag.findUnique({
      where: {
        userId_tagId: {
          userId,
          tagId,
        },
      },
    })

    if (!userTag) {
      return NextResponse.json(
        { message: 'User does not have this tag' },
        { status: 404 }
      )
    }

    await prisma.userTag.delete({
      where: {
        id: userTag.id,
      },
    })

    return NextResponse.json(
      { message: 'Tag removed from user' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to remove tag from user:', error)
    return NextResponse.json(
      { message: 'Failed to remove tag from user' },
      { status: 500 }
    )
  }
}
