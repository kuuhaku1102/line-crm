import { prisma } from '@/lib/prisma'

async function getDashboardStats() {
  try {
    const totalFriends = await prisma.user.count({
      where: { isBlocked: false, unfollowedAt: null },
    })

    const newFriendsThisMonth = await prisma.user.count({
      where: {
        followedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    })

    const messagesSent = await prisma.message.count({
      where: { sentAt: { not: null } },
    })

    const totalMessageEvents = await prisma.messageEvent.count()

    return {
      totalFriends,
      newFriendsThisMonth,
      messagesSent,
      totalMessageEvents,
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return {
      totalFriends: 0,
      newFriendsThisMonth: 0,
      messagesSent: 0,
      totalMessageEvents: 0,
    }
  }
}

export default async function Dashboard() {
  const stats = await getDashboardStats()

  const deliveredRate =
    stats.totalMessageEvents > 0
      ? ((stats.messagesSent / stats.totalMessageEvents) * 100).toFixed(1)
      : '0'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-500 mt-2">
          {new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Friends */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">友だち数</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalFriends}
              </p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
          {stats.newFriendsThisMonth > 0 && (
            <p className="text-line-green text-sm font-medium mt-4">
              +{stats.newFriendsThisMonth} 今月
            </p>
          )}
        </div>

        {/* Messages Sent */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">配信数</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.messagesSent}
              </p>
            </div>
            <div className="text-4xl">💬</div>
          </div>
        </div>

        {/* Delivery Rate */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">配信率</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {deliveredRate}%
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        {/* Message Events */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">メッセージイベント</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalMessageEvents}
              </p>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">クイックアクション</h2>
        <div className="flex gap-4">
          <a
            href="/messages"
            className="px-4 py-2 bg-line-green text-white rounded font-medium hover:bg-opacity-90 transition"
          >
            メッセージを作成
          </a>
          <a
            href="/customers"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300 transition"
          >
            顧客を確認
          </a>
          <a
            href="/analytics"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300 transition"
          >
            分析を表示
          </a>
        </div>
      </div>
    </div>
  )
}
