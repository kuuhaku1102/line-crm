import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// GET all tags
export async function GET(_req: NextRequest) {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Failed to fetch tags:', error)
    return NextResponse.json(
      { message: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

// POST create tag
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, color } = body

    if (!name) {
      return NextResponse.json(
        { message: 'Missing required field: name' },
        { status: 400 }
      )
    }

    // Check if tag already exists
    const existingTag = await prisma.tag.findUnique({
      where: { name },
    })

    if (existingTag) {
      return NextResponse.json(
        { message: 'Tag already exists' },
        { status: 400 }
      )
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || '#999999',
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Failed to create tag:', error)
    return NextResponse.json(
      { message: 'Failed to create tag' },
      { status: 500 }
    )
  }
}
