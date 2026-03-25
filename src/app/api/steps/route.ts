import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const sequences = await prisma.stepSequence.findMany({
      include: {
        steps: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(sequences)
  } catch (error) {
    console.error('Error fetching step sequences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sequences' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const sequence = await prisma.stepSequence.create({
      data: {
        name,
        description: description || null,
      },
    })

    return NextResponse.json(sequence, { status: 201 })
  } catch (error) {
    console.error('Error creating step sequence:', error)
    return NextResponse.json(
      { error: 'Failed to create sequence' },
      { status: 500 }
    )
  }
}
