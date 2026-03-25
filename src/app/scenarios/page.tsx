'use client'

import { useState, useEffect } from 'react'

interface ScenarioAction {
  id: string
  actionType: string
  actionValue: string
  conditionType?: string
  conditionValue?: string
  sortOrder: number
}

interface Scenario {
  id: string
  name: string
  description?: string
  triggerType: string
  triggerValue?: string
  isActive: boolean
  createdAt: string
  actions: ScenarioAction[]
}

const TRIGGER_TYPES = [
  { value: 'follow', label: '友だち追加' },
  { value: 'keyword', label: 'キーワード' },
  { value: 'tag_added', label: 'タグ追加' },
  { value: 'score_reached', label: 'スコア到達' },
  { value: 'link_click', label: 'リンククリック' },
]

const ACTION_TYPES = [
  { value: 'send_message', label: 'メッセージ送信' },
  { value: 'add_tag', label: 'タグ追加' },
  { value: 'remove_tag', label: 'タグ削除' },
  { value: 'add_score', label: 'スコア加算' },
  { value: 'start_sequence', label: 'シーケンス開始' },
  { value: 'wait', label: '待機' },
]

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [newScenarioName, setNewScenarioName] = useState('')
  const [newScenarioDesc, setNewScenarioDesc] = useState('')
  const [newScenarioTrigger, setNewScenarioTrigger] = useState('follow')
  const [newScenarioTriggerValue, setNewScenarioTriggerValue] = useState('')
  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null)
  const [newActionType, setNewActionType] = useState('send_message')
  const [newActionValue, setNewActionValue] = useState('')

  useEffect(() => {
    fetchScenarios()
  }, [])

  async function fetchScenarios() {
    try {
      const res = await fetch('/api/scenarios')
      const data = await res.json()
      setScenarios(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch scenarios:', error)
      setLoading(false)
    }
  }

  async function createScenario() {
    if (!newScenarioName.trim()) {
      alert('シナリオ名を入力してください')
      return
    }

    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newScenarioName,
          description: newScenarioDesc || null,
          triggerType: newScenarioTrigger,
          triggerValue: newScenarioTriggerValue || null,
        }),
      })

      if (res.ok) {
        setNewScenarioName('')
        setNewScenarioDesc('')
        setNewScenarioTrigger('follow')
        setNewScenarioTriggerValue('')
        fetchScenarios()
      }
    } catch (error) {
      console.error('Failed to create scenario:', error)
    }
  }

  async function deleteScenario(id: string) {
    if (!confirm('このシナリオを削除しますか？')) return

    try {
      const res = await fetch(`/api/scenarios?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchScenarios()
      }
    } catch (error) {
      console.error('Failed to delete scenario:', error)
    }
  }

  async function addAction(scenarioId: string) {
    if (!newActionValue.trim()) {
      alert('アクション値を入力してください')
      return
    }

    try {
      const res = await fetch(`/api/scenarios/${scenarioId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: newActionType,
          actionValue: newActionValue,
        }),
      })

      if (res.ok) {
        setNewActionValue('')
        setNewActionType('send_message')
        fetchScenarios()
      }
    } catch (error) {
      console.error('Failed to add action:', error)
    }
  }

  async function deleteAction(scenarioId: string, actionId: string) {
    if (!confirm('このアクションを削除しますか？')) return

    try {
      const res = await fetch(
        `/api/scenarios/${scenarioId}/actions?actionId=${actionId}`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        fetchScenarios()
      }
    } catch (error) {
      console.error('Failed to delete action:', error)
    }
  }

  if (loading) {
    return <div className="p-6">読み込み中...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">🔀 シナリオ</h1>

      {/* Create Scenario Section */}
      <section className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-xl font-bold text-gray-700 mb-4">
          新しいシナリオを作成
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="シナリオ名"
            value={newScenarioName}
            onChange={(e) => setNewScenarioName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
          />
          <textarea
            placeholder="説明（オプション）"
            value={newScenarioDesc}
            onChange={(e) => setNewScenarioDesc(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
            rows={2}
          ></textarea>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                トリガータイプ
              </label>
              <select
                value={newScenarioTrigger}
                onChange={(e) => setNewScenarioTrigger(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
              >
                {TRIGGER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                トリガー値
              </label>
              <input
                type="text"
                placeholder="例: keyword"
                value={newScenarioTriggerValue}
                onChange={(e) => setNewScenarioTriggerValue(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
              />
            </div>
          </div>
          <button
            onClick={createScenario}
            className="w-full px-6 py-2 bg-line-green text-white rounded hover:bg-green-600 transition"
          >
            シナリオ作成
          </button>
        </div>
      </section>

      {/* Scenarios List */}
      <section className="space-y-4">
        {scenarios.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            シナリオがありません
          </div>
        ) : (
          scenarios.map((scenario) => (
            <div key={scenario.id} className="bg-white rounded-lg shadow">
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition"
                onClick={() =>
                  setExpandedScenarioId(
                    expandedScenarioId === scenario.id ? null : scenario.id
                  )
                }
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {scenario.name}
                    </h3>
                    {scenario.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {scenario.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      トリガー:{' '}
                      {
                        TRIGGER_TYPES.find((t) => t.value === scenario.triggerType)
                          ?.label
                      }{' '}
                      {scenario.triggerValue &&
                        `(${scenario.triggerValue})`}{' '}
                      | アクション: {scenario.actions.length} 件
                    </p>
                  </div>
                  <div className="text-2xl">
                    {expandedScenarioId === scenario.id ? '▼' : '▶'}
                  </div>
                </div>
              </div>

              {expandedScenarioId === scenario.id && (
                <div className="bg-gray-50 border-t border-gray-200 p-6">
                  {/* Actions List */}
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-700 mb-3">アクション</h4>
                    {scenario.actions.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        アクションはありません
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {scenario.actions.map((action, idx) => (
                          <div
                            key={action.id}
                            className="bg-white p-3 rounded border-l-4 border-line-green"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-mono text-gray-600">
                                  #{idx + 1}
                                </p>
                                <p className="font-semibold text-gray-800">
                                  {
                                    ACTION_TYPES.find(
                                      (a) => a.value === action.actionType
                                    )?.label
                                  }
                                </p>
                                <p className="text-sm text-gray-600">
                                  {action.actionValue.substring(0, 100)}
                                  {action.actionValue.length > 100
                                    ? '...'
                                    : ''}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  deleteAction(scenario.id, action.id)
                                }
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
                              >
                                削除
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Action Form */}
                  <div className="border-t pt-6">
                    <h4 className="font-bold text-gray-700 mb-3">
                      アクションを追加
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        value={newActionType}
                        onChange={(e) => setNewActionType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
                      >
                        {ACTION_TYPES.map((a) => (
                          <option key={a.value} value={a.value}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="アクション値"
                        value={newActionValue}
                        onChange={(e) => setNewActionValue(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
                      />
                      <button
                        onClick={() => addAction(scenario.id)}
                        className="col-span-2 px-4 py-2 bg-line-green text-white rounded hover:bg-green-600 transition"
                      >
                        アクション追加
                      </button>
                    </div>
                  </div>

                  {/* Delete Scenario */}
                  <div className="border-t pt-6 mt-6">
                    <button
                      onClick={() => deleteScenario(scenario.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      シナリオ削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  )
}
