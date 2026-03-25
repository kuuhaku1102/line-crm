import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const ranking = await prisma.user.findMany({
      select: {
        id: true,
        lineUserId: true,
        displayName: true,
        score: true,
        followedAt: true,
      },
      orderBy: { score: 'desc' },
      take: 50,
    })

    return NextResponse.json(ranking)
  } catch (error) {
    console.error('Error fetching ranking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ranking' },
      { status: 500 }
    )
  }
}
