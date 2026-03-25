import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    // Get statistics by source
    const users = await prisma.user.findMany({
      select: {
        source: true,
        score: true,
        followedAt: true,
        unfollowedAt: true,
      },
    })

    const sourceStats: Record<
      string,
      {
        count: number
        activeCount: number
        totalScore: number
      }
    > = {}

    users.forEach((user) => {
      const source = user.source || '直接登録'
      if (!sourceStats[source]) {
        sourceStats[source] = {
          count: 0,
          activeCount: 0,
          totalScore: 0,
        }
      }

      sourceStats[source].count++
      sourceStats[source].totalScore += user.score

      // Count as active if not unfollowed
      if (!user.unfollowedAt) {
        sourceStats[source].activeCount++
      }
    })

    // Convert to array and sort
    const stats = Object.entries(sourceStats)
      .map(([source, data]) => ({
        source,
        ...data,
        avgScore: Math.round(data.totalScore / data.count),
        conversionRate: Number(
          ((data.activeCount / data.count) * 100).toFixed(1)
        ),
      }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      total: users.length,
      stats,
    })
  } catch (error) {
    console.error('Error fetching source stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
