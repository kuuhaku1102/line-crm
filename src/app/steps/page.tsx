'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface StepMessage {
  id: string
  dayOffset: number
  hour: number
  title: string
  content: string
  messageType: string
  sortOrder: number
}

interface StepSequence {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  steps: StepMessage[]
  _count: { users: number }
}

export default function StepsPage() {
  const router = useRouter()
  const [sequences, setSequences] = useState<StepSequence[]>([])
  const [loading, setLoading] = useState(true)
  const [newSeqName, setNewSeqName] = useState('')
  const [newSeqDesc, setNewSeqDesc] = useState('')
  const [expandedSeqId, setExpandedSeqId] = useState<string | null>(null)
  const [newMessageData, setNewMessageData] = useState<{
    dayOffset: number
    hour: number
    title: string
    content: string
  }>({
    dayOffset: 0,
    hour: 10,
    title: '',
    content: '',
  })

  useEffect(() => {
    fetchSequences()
  }, [])

  async function fetchSequences() {
    try {
      const res = await fetch('/api/steps')
      const data = await res.json()
      setSequences(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch sequences:', error)
      setLoading(false)
    }
  }

  async function createSequence() {
    if (!newSeqName.trim()) {
      alert('シーケンス名を入力してください')
      return
    }

    try {
      const res = await fetch('/api/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSeqName,
          description: newSeqDesc || null,
        }),
      })

      if (res.ok) {
        setNewSeqName('')
        setNewSeqDesc('')
        fetchSequences()
      }
    } catch (error) {
      console.error('Failed to create sequence:', error)
    }
  }

  async function addMessage(sequenceId: string) {
    if (!newMessageData.title || !newMessageData.content) {
      alert('タイトルと内容を入力してください')
      return
    }

    try {
      const res = await fetch(`/api/steps/${sequenceId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessageData),
      })

      if (res.ok) {
        setNewMessageData({
          dayOffset: 0,
          hour: 10,
          title: '',
          content: '',
        })
        fetchSequences()
      }
    } catch (error) {
      console.error('Failed to add message:', error)
    }
  }

  async function deleteMessage(sequenceId: string, messageId: string) {
    if (!confirm('メッセージを削除しますか？')) return

    try {
      const res = await fetch(
        `/api/steps/${sequenceId}/messages?messageId=${messageId}`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        fetchSequences()
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  async function toggleSequence(sequenceId: string, currentStatus: boolean) {
    // Note: This would require an API endpoint to update sequence status
    // For now, just log the action
    console.log('Toggle sequence:', sequenceId, !currentStatus)
  }

  if (loading) {
    return <div className="p-6">読み込み中...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📋 ステップ配信</h1>

      {/* Create Sequence Section */}
      <section className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-xl font-bold text-gray-700 mb-4">
          新しいシーケンスを作成
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="シーケンス名"
            value={newSeqName}
            onChange={(e) => setNewSeqName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
          />
          <textarea
            placeholder="説明（オプション）"
            value={newSeqDesc}
            onChange={(e) => setNewSeqDesc(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
            rows={3}
          ></textarea>
          <button
            onClick={createSequence}
            className="px-6 py-2 bg-line-green text-white rounded hover:bg-green-600 transition"
          >
            シーケンス作成
          </button>
        </div>
      </section>

      {/* Sequences List */}
      <section className="space-y-4">
        {sequences.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            シーケンスがありません
          </div>
        ) : (
          sequences.map((seq) => (
            <div key={seq.id} className="bg-white rounded-lg shadow">
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition"
                onClick={() =>
                  setExpandedSeqId(expandedSeqId === seq.id ? null : seq.id)
                }
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {seq.name}
                    </h3>
                    {seq.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {seq.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      登録者: {seq._count.users} 人 | メッセージ:{' '}
                      {seq.steps.length} 件
                    </p>
                  </div>
                  <div className="text-2xl">
                    {expandedSeqId === seq.id ? '▼' : '▶'}
                  </div>
                </div>
              </div>

              {expandedSeqId === seq.id && (
                <div className="bg-gray-50 border-t border-gray-200 p-6">
                  {/* Messages List */}
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-700 mb-3">メッセージ</h4>
                    {seq.steps.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        メッセージはありません
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {seq.steps.map((msg, idx) => (
                          <div
                            key={msg.id}
                            className="bg-white p-3 rounded border-l-4 border-line-green"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-mono text-gray-600">
                                  {msg.dayOffset}日目 {msg.hour}:00
                                </p>
                                <p className="font-semibold text-gray-800">
                                  {msg.title}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {msg.content.substring(0, 100)}
                                  {msg.content.length > 100 ? '...' : ''}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  deleteMessage(seq.id, msg.id)
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

                  {/* Add Message Form */}
                  <div className="border-t pt-6">
                    <h4 className="font-bold text-gray-700 mb-3">
                      メッセージを追加
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        placeholder="日数オフセット"
                        value={newMessageData.dayOffset}
                        onChange={(e) =>
                          setNewMessageData({
                            ...newMessageData,
                            dayOffset: parseInt(e.target.value),
                          })
                        }
                        className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
                      />
                      <input
                        type="number"
                        placeholder="時刻 (0-23)"
                        min="0"
                        max="23"
                        value={newMessageData.hour}
                        onChange={(e) =>
                          setNewMessageData({
                            ...newMessageData,
                            hour: parseInt(e.target.value),
                          })
                        }
                        className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
                      />
                      <input
                        type="text"
                        placeholder="タイトル"
                        value={newMessageData.title}
                        onChange={(e) =>
                          setNewMessageData({
                            ...newMessageData,
                            title: e.target.value,
                          })
                        }
                        className="col-span-2 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
                      />
                      <textarea
                        placeholder="内容"
                        value={newMessageData.content}
                        onChange={(e) =>
                          setNewMessageData({
                            ...newMessageData,
                            content: e.target.value,
                          })
                        }
                        className="col-span-2 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
                        rows={3}
                      ></textarea>
                      <button
                        onClick={() => addMessage(seq.id)}
                        className="col-span-2 px-4 py-2 bg-line-green text-white rounded hover:bg-green-600 transition"
                      >
                        メッセージ追加
                      </button>
                    </div>
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
