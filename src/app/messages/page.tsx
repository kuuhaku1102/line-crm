'use client'

import React, { useState, useEffect } from 'react'

interface Message {
  id: string
  title: string
  content: string
  type: string
  sentAt: string | null
  sentCount: number
  createdAt: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'TEXT',
  })

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages')
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({ title: '', content: '', type: 'TEXT' })
        setShowForm(false)
        await fetchMessages()
      }
    } catch (error) {
      console.error('Failed to create message:', error)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">メッセージ管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-line-green text-white rounded font-medium hover:bg-opacity-90 transition"
        >
          {showForm ? 'キャンセル' : 'メッセージを作成'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">新規メッセージ</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイトル
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-line-green focus:border-transparent"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                内容
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-line-green focus:border-transparent"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メッセージタイプ
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-line-green focus:border-transparent"
              >
                <option value="TEXT">テキスト</option>
                <option value="FLEX">Flex Message</option>
                <option value="IMAGE">画像</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-line-green text-white rounded font-medium hover:bg-opacity-90 transition"
            >
              保存
            </button>
          </form>
        </div>
      )}

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  タイトル
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  タイプ
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  配信数
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  ステータス
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  作成日
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    読み込み中...
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    メッセージがありません
                  </td>
                </tr>
              ) : (
                messages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {message.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {message.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{message.sentCount}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          message.sentAt
                            ? 'bg-line-green bg-opacity-10 text-line-green'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {message.sentAt ? '配信済み' : '下書き'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(message.createdAt).toLocaleDateString('ja-JP')}
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
