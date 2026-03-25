import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const rules = await prisma.autoTagRule.findMany({
      include: {
        tag: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(rules)
  } catch (error) {
    console.error('Error fetching auto-tag rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { keyword, tagId } = body

    if (!keyword || !tagId) {
      return NextResponse.json(
        { error: 'keyword and tagId are required' },
        { status: 400 }
      )
    }

    const rule = await prisma.autoTagRule.create({
      data: {
        keyword,
        tagId,
      },
      include: {
        tag: true,
      },
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    console.error('Error creating auto-tag rule:', error)
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

    await prisma.autoTagRule.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Rule deleted' })
  } catch (error) {
    console.error('Error deleting auto-tag rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete rule' },
      { status: 500 }
    )
  }
}
