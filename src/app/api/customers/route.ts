import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const customers = await prisma.user.findMany({
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        followedAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json(customers, { status: 200 })
  } catch (error) {
    console.error('Failed to fetch customers:', error)
    return NextResponse.json(
      { message: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
