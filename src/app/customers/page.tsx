import React from 'react'
import { prisma } from '@/lib/prisma'

async function getCustomers() {
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
    return customers
  } catch (error) {
    console.error('Failed to fetch customers:', error)
    return []
  }
}

async function getStats() {
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

    return { total, active, blocked, unfollowed }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return { total: 0, active: 0, blocked: 0, unfollowed: 0 }
  }
}

export default async function CustomersPage() {
  const customers = await getCustomers()
  const stats = await getStats()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">顧客管理</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">総数</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">アクティブ</p>
          <p className="text-2xl font-bold text-line-green">{stats.active}</p>
        </div>
        <div className="bg-white rounded p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">ブロック中</p>
          <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
        </div>
        <div className="bg-white rounded p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">フォロー解除</p>
          <p className="text-2xl font-bold text-gray-400">{stats.unfollowed}</p>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  ユーザー
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  タグ
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  ステータス
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  フォロー日
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    顧客データがありません
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {customer.pictureUrl && (
                          <img
                            src={customer.pictureUrl}
                            alt={customer.displayName || 'User'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {customer.displayName || 'No Name'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {customer.lineUserId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {customer.tags.map((ut) => (
                          <span
                            key={ut.id}
                            className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: ut.tag.color }}
                          >
                            {ut.tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          customer.isBlocked
                            ? 'bg-red-100 text-red-800'
                            : customer.unfollowedAt
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-line-green bg-opacity-10 text-line-green'
                        }`}
                      >
                        {customer.isBlocked
                          ? 'ブロック中'
                          : customer.unfollowedAt
                          ? 'フォロー解除'
                          : 'アクティブ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(customer.followedAt).toLocaleDateString('ja-JP')}
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
