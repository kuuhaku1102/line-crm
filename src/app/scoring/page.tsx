'use client'

import { useState, useEffect } from 'react'

interface ScoringRule {
  id: string
  eventType: string
  eventValue?: string
  points: number
  description?: string
  isActive: boolean
  createdAt: string
}

interface RankingUser {
  id: string
  lineUserId: string
  displayName?: string
  score: number
  followedAt: string
}

const EVENT_TYPES = [
  { value: 'message_sent', label: 'メッセージ受信' },
  { value: 'link_click', label: 'リンククリック' },
  { value: 'form_submit', label: 'フォーム提出' },
  { value: 'tag_added', label: 'タグ追加' },
  { value: 'video_view', label: 'ビデオ視聴' },
]

export default function ScoringPage() {
  const [rules, setRules] = useState<ScoringRule[]>([])
  const [ranking, setRanking] = useState<RankingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [newRuleEventType, setNewRuleEventType] = useState('message_sent')
  const [newRulePoints, setNewRulePoints] = useState(10)
  const [newRuleDescription, setNewRuleDescription] = useState('')

  useEffect(() => {
    fetchRulesAndRanking()
  }, [])

  async function fetchRulesAndRanking() {
    try {
      const [rulesRes, rankingRes] = await Promise.all([
        fetch('/api/scoring'),
        fetch('/api/scoring/ranking'),
      ])

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json()
        setRules(rulesData)
      }

      if (rankingRes.ok) {
        const rankingData = await rankingRes.json()
        setRanking(rankingData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createRule() {
    if (newRulePoints === undefined) {
      alert('ポイントを入力してください')
      return
    }

    try {
      const res = await fetch('/api/scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: newRuleEventType,
          points: newRulePoints,
          description: newRuleDescription || null,
        }),
      })

      if (res.ok) {
        setNewRuleEventType('message_sent')
        setNewRulePoints(10)
        setNewRuleDescription('')
        fetchRulesAndRanking()
      }
    } catch (error) {
      console.error('Failed to create rule:', error)
    }
  }

  async function deleteRule(id: string) {
    if (!confirm('このルールを削除しますか？')) return

    try {
      const res = await fetch(`/api/scoring?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchRulesAndRanking()
      }
    } catch (error) {
      console.error('Failed to delete rule:', error)
    }
  }

  if (loading) {
    return <div className="p-6">読み込み中...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">⭐ スコアリング</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Rules Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-700 mb-4">
            スコアリングルール
          </h2>

          <div className="space-y-4 mb-6">
            <select
              value={newRuleEventType}
              onChange={(e) => setNewRuleEventType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="ポイント"
              value={newRulePoints}
              onChange={(e) => setNewRulePoints(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
            />
            <input
              type="text"
              placeholder="説明（オプション）"
              value={newRuleDescription}
              onChange={(e) => setNewRuleDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
            />
            <button
              onClick={createRule}
              className="w-full px-4 py-2 bg-line-green text-white rounded hover:bg-green-600 transition"
            >
              ルール作成
            </button>
          </div>

          <div className="space-y-2">
            {rules.length === 0 ? (
              <p className="text-gray-500">ルールがありません</p>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {
                        EVENT_TYPES.find((t) => t.value === rule.eventType)
                          ?.label
                      }
                    </p>
                    <p className="text-sm text-gray-600">
                      + {rule.points} ポイント
                    </p>
                    {rule.description && (
                      <p className="text-xs text-gray-500">
                        {rule.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    削除
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Ranking Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-700 mb-4">
            スコアランキング
          </h2>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {ranking.length === 0 ? (
              <p className="text-gray-500">データがありません</p>
            ) : (
              ranking.map((user, idx) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-line-green/5 to-transparent rounded"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-line-green text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {user.displayName || 'ユーザー'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.lineUserId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-line-green">
                      {user.score}
                    </p>
                    <p className="text-xs text-gray-500">点</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
