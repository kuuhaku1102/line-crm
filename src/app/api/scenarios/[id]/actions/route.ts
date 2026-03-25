import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actions = await prisma.scenarioAction.findMany({
      where: { scenarioId: params.id },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(actions)
  } catch (error) {
    console.error('Error fetching scenario actions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch actions' },
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
    const { actionType, actionValue, conditionType, conditionValue } = body

    if (!actionType || !actionValue) {
      return NextResponse.json(
        { error: 'actionType and actionValue are required' },
        { status: 400 }
      )
    }

    // Get max sortOrder
    const lastAction = await prisma.scenarioAction.findFirst({
      where: { scenarioId: params.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const nextSortOrder = (lastAction?.sortOrder || 0) + 1

    const action = await prisma.scenarioAction.create({
      data: {
        scenarioId: params.id,
        actionType,
        actionValue,
        conditionType: conditionType || null,
        conditionValue: conditionValue || null,
        sortOrder: nextSortOrder,
      },
    })

    return NextResponse.json(action, { status: 201 })
  } catch (error) {
    console.error('Error creating scenario action:', error)
    return NextResponse.json(
      { error: 'Failed to create action' },
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
    const actionId = searchParams.get('actionId')

    if (!actionId) {
      return NextResponse.json(
        { error: 'actionId is required' },
        { status: 400 }
      )
    }

    await prisma.scenarioAction.delete({
      where: { id: actionId },
    })

    return NextResponse.json({ message: 'Action deleted' })
  } catch (error) {
    console.error('Error deleting scenario action:', error)
    return NextResponse.json(
      { error: 'Failed to delete action' },
      { status: 500 }
    )
  }
}
