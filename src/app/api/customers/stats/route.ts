import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const total = await prisma.user.count()
    const active = await prisma.user.count({
      where: { isBlocked: false, unfollowedAt: null },
    })
    const blocked = await prisma.user.count({
      where: { isBlocked: true },
    })
    const unfollowed = await prisma.user.count({
      where: { unfollowedAt: { not: null } },
    })

    return NextResponse.json(
      { total, active, blocked, unfollowed },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to fetch customer stats:', error)
    return NextResponse.json(
      { message: 'Failed to fetch customer stats' },
      { status: 500 }
    )
  }
}
