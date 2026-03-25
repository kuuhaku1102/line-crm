'use client'

import { useState, useEffect } from 'react'

interface SourceStat {
  source: string
  count: number
  activeCount: number
  totalScore: number
  avgScore: number
  conversionRate: number
}

interface StatsResponse {
  total: number
  stats: SourceStat[]
}

export default function SourcesPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/sources')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6">読み込み中...</div>
  }

  if (!stats || stats.stats.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          🔍 流入経路分析
        </h1>
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          データがありません
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...stats.stats.map((s) => s.count), 1)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        🔍 流入経路分析
      </h1>

      {/* Summary */}
      <section className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">総ユーザー数</p>
          <p className="text-3xl font-bold text-line-green mt-2">
            {stats.total}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">経路数</p>
          <p className="text-3xl font-bold text-line-green mt-2">
            {stats.stats.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">平均スコア</p>
          <p className="text-3xl font-bold text-line-green mt-2">
            {Math.round(
              stats.stats.reduce((sum, s) => sum + s.avgScore, 0) /
                stats.stats.length
            )}
          </p>
        </div>
      </section>

      {/* Charts and Details */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-700 mb-6">
          経路別ユーザー数
        </h2>

        <div className="space-y-6">
          {stats.stats.map((stat) => {
            const barWidth = (stat.count / maxCount) * 100

            return (
              <div key={stat.source}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {stat.source}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      アクティブ: {stat.activeCount} / {stat.count} (
                      {stat.conversionRate}%)
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg text-line-green">
                      {stat.count}
                    </p>
                    <p className="text-xs text-gray-500">人</p>
                  </div>
                </div>

                {/* Bar chart */}
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-line-green to-green-400 h-6 flex items-center justify-center text-white text-xs font-bold transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  >
                    {stat.count > 0 && barWidth > 20 && `${stat.count}`}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-gray-600">平均スコア</p>
                    <p className="font-semibold text-gray-800">
                      {stat.avgScore}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">CV率</p>
                    <p className="font-semibold text-gray-800">
                      {stat.conversionRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">総スコア</p>
                    <p className="font-semibold text-gray-800">
                      {stat.totalScore}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Ranking by Source */}
      <section className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-xl font-bold text-gray-700 mb-6">
          経路別ランキング
        </h2>

        <div className="space-y-3">
          {stats.stats
            .sort((a, b) => b.count - a.count)
            .map((stat, idx) => (
              <div
                key={stat.source}
                className="flex items-center justify-between p-4 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-line-green text-white rounded-full flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {stat.source}
                    </p>
                    <p className="text-sm text-gray-600">
                      {stat.count} 人 • CV率 {stat.conversionRate}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-line-green">
                    {stat.count}
                  </p>
                  <p className="text-xs text-gray-500">スコア: {stat.avgScore}</p>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  )
}
