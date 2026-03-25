import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const scenarios = await prisma.scenario.findMany({
      include: {
        actions: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(scenarios)
  } catch (error) {
    console.error('Error fetching scenarios:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, triggerType, triggerValue } = body

    if (!name || !triggerType) {
      return NextResponse.json(
        { error: 'name and triggerType are required' },
        { status: 400 }
      )
    }

    const scenario = await prisma.scenario.create({
      data: {
        name,
        description: description || null,
        triggerType,
        triggerValue: triggerValue || null,
      },
    })

    return NextResponse.json(scenario, { status: 201 })
  } catch (error) {
    console.error('Error creating scenario:', error)
    return NextResponse.json(
      { error: 'Failed to create scenario' },
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

    await prisma.scenario.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Scenario deleted' })
  } catch (error) {
    console.error('Error deleting scenario:', error)
    return NextResponse.json(
      { error: 'Failed to delete scenario' },
      { status: 500 }
    )
  }
}
