import { prisma } from '@/lib/prisma'

interface RecentEvent {
  id: string
  eventType: string
  createdAt: Date
  message: { title: string } | null
}

interface MessageDelivery {
  title: string
  sentCount: number
  sentAt: Date | null
}

async function getAnalytics() {
  try {
    const messageDeliveries = await prisma.messageEvent.groupBy({
      by: ['eventType'],
      _count: true,
    })

    const recentEvents = await prisma.messageEvent.findMany({
      include: {
        message: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const messageStats = await prisma.message.aggregate({
      _count: true,
      _sum: { sentCount: true },
    })

    // Get message delivery history
    const sentMessages = await prisma.message.findMany({
      where: {
        sentAt: { not: null },
      },
      select: {
        title: true,
        sentCount: true,
        sentAt: true,
      },
      orderBy: { sentAt: 'desc' },
      take: 10,
    })

    // Get friend follow trend (past 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const followTrend = await prisma.user.groupBy({
      by: [],
      where: {
        followedAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    })

    const totalActiveUsers = await prisma.user.count({
      where: {
        isBlocked: false,
        unfollowedAt: null,
      },
    })

    const totalUnfollowed = await prisma.user.count({
      where: {
        unfollowedAt: { not: null },
      },
    })

    const followRate = totalActiveUsers > 0
      ? ((totalActiveUsers / (totalActiveUsers + totalUnfollowed)) * 100).toFixed(1)
      : '0'

    return {
      messageDeliveries: Object.fromEntries(
        messageDeliveries.map((d: { eventType: string; _count: number }) => [d.eventType, d._count])
      ),
      recentEvents,
      messageStats: {
        totalMessages: messageStats._count,
        totalSent: messageStats._sum.sentCount || 0,
      },
      sentMessages: sentMessages as MessageDelivery[],
      followTrend: {
        newFollowsLast30Days: followTrend._count,
        totalActive: totalActiveUsers,
        totalUnfollowed: totalUnfollowed,
        followRate: parseFloat(followRate),
      },
    }
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return {
      messageDeliveries: {},
      recentEvents: [],
      messageStats: { totalMessages: 0, totalSent: 0 },
      sentMessages: [],
      followTrend: {
        newFollowsLast30Days: 0,
        totalActive: 0,
        totalUnfollowed: 0,
        followRate: 0,
      },
    }
  }
}

export default async function AnalyticsPage() {
  const analytics = await getAnalytics()

  const eventTypes = [
    { name: 'DELIVERED', label: '配信済み', icon: '📨' },
    { name: 'OPENED', label: '開封', icon: '👁️' },
    { name: 'CLICKED', label: 'クリック', icon: '👆' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">分析</h1>

      {/* Message Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">メッセージ統計</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">総メッセージ数</span>
              <span className="font-bold text-gray-900">
                {analytics.messageStats.totalMessages}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">総配信数</span>
              <span className="font-bold text-line-green">
                {analytics.messageStats.totalSent}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">イベント統計</h2>
          <div className="space-y-3">
            {eventTypes.map((type) => (
              <div key={type.name} className="flex justify-between items-center">
                <span className="text-gray-600">
                  {type.icon} {type.label}
                </span>
                <span className="font-bold text-gray-900">
                  {analytics.messageDeliveries[type.name] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Friend Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">友だち統計（過去30日）</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">新規フォロー</span>
              <span className="font-bold text-line-green">
                {analytics.followTrend.newFollowsLast30Days}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">アクティブ</span>
              <span className="font-bold text-gray-900">
                {analytics.followTrend.totalActive}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">フォロー解除</span>
              <span className="font-bold text-red-600">
                {analytics.followTrend.totalUnfollowed}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-100">
              <span className="text-gray-600">フォロー率</span>
              <span className="font-bold text-blue-600">
                {analytics.followTrend.followRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">配信実績</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {analytics.sentMessages.length === 0 ? (
              <p className="text-gray-500 text-sm">配信履歴がありません</p>
            ) : (
              analytics.sentMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-start text-sm pb-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{msg.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(msg.sentAt || '').toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <p className="font-bold text-line-green ml-2">{msg.sentCount}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Event Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">最近のイベント</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  メッセージ
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  イベント
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  時刻
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analytics.recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    イベントがありません
                  </td>
                </tr>
              ) : (
                analytics.recentEvents.map((event: RecentEvent) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {event.message?.title || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          event.eventType === 'DELIVERED'
                            ? 'bg-blue-100 text-blue-800'
                            : event.eventType === 'OPENED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {event.eventType === 'DELIVERED'
                          ? '配信済み'
                          : event.eventType === 'OPENED'
                          ? '開封'
                          : 'クリック'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(event.createdAt).toLocaleString('ja-JP')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
