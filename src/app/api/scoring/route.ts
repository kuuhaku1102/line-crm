import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const rules = await prisma.scoringRule.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error('Error fetching scoring rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { eventType, eventValue, points, description } = body

    if (!eventType || points === undefined) {
      return NextResponse.json(
        { error: 'eventType and points are required' },
        { status: 400 }
      )
    }

    const rule = await prisma.scoringRule.create({
      data: {
        eventType,
        eventValue: eventValue || null,
        points,
        description: description || null,
      },
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    console.error('Error creating scoring rule:', error)
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    await prisma.scoringRule.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Rule deleted' })
  } catch (error) {
    console.error('Error deleting scoring rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete rule' },
      { status: 500 }
    )
  }
}
