'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface User {
  id: string
  lineUserId: string
  displayName: string | null
  pictureUrl: string | null
  statusMessage: string | null
  followedAt: string
  unfollowedAt: string | null
  isBlocked: boolean
  tags: Array<{
    id: string
    tag: {
      id: string
      name: string
      color: string
    }
  }>
}

interface Tag {
  id: string
  name: string
  color: string
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTagForm, setShowAddTagForm] = useState(false)
  const [selectedTagId, setSelectedTagId] = useState<string>('')
  const [showSendMessageForm, setShowSendMessageForm] = useState(false)
  const [messageForm, setMessageForm] = useState({
    messageType: 'text',
    content: '',
  })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchUser()
    fetchTags()
  }, [userId])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/customers/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      } else {
        alert('ユーザーが見つかりません')
        router.push('/customers')
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      alert('ユーザー情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTagId || !user) return

    try {
      const response = await fetch(`/api/customers/${user.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: selectedTagId }),
      })

      if (response.ok) {
        setSelectedTagId('')
        setShowAddTagForm(false)
        await fetchUser()
      } else {
        const error = await response.json()
        alert(`タグの追加に失敗しました: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to add tag:', error)
      alert('タグの追加に失敗しました')
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    if (!user) return
    if (!confirm('このタグを削除してもよろしいですか？')) return

    try {
      const response = await fetch(`/api/customers/${user.id}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      })

      if (response.ok) {
        await fetchUser()
      } else {
        const error = await response.json()
        alert(`タグの削除に失敗しました: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to remove tag:', error)
      alert('タグの削除に失敗しました')
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !messageForm.content) return

    setSending(true)
    try {
      const response = await fetch(`/api/customers/${user.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType: messageForm.messageType,
          content: messageForm.content,
        }),
      })

      if (response.ok) {
        setMessageForm({ messageType: 'text', content: '' })
        setShowSendMessageForm(false)
        alert('メッセージを送信しました')
      } else {
        const error = await response.json()
        alert(`メッセージ送信に失敗しました: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('メッセージ送信に失敗しました')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">ユーザーが見つかりません</div>
      </div>
    )
  }

  const userTags = user.tags || []
  const availableTags = tags.filter(
    (tag) => !userTags.some((ut) => ut.tag.id === tag.id)
  )

  return (
    <div className="p-8">
      <button
        onClick={() => router.push('/customers')}
        className="mb-6 text-line-green hover:underline font-medium text-sm"
      >
        ← 顧客一覧に戻る
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 mb-4">基本情報</h2>

          {user.pictureUrl && (
            <img
              src={user.pictureUrl}
              alt={user.displayName || 'User'}
              className="w-full h-auto rounded-lg mb-4 object-cover aspect-square"
            />
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                名前
              </label>
              <p className="text-lg font-bold text-gray-900">
                {user.displayName || '未設定'}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                LINE ID
              </label>
              <p className="text-sm text-gray-600 font-mono break-all">
                {user.lineUserId}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                ステータスメッセージ
              </label>
              <p className="text-sm text-gray-600">
                {user.statusMessage || '未設定'}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                フォロー日
              </label>
              <p className="text-sm text-gray-600">
                {new Date(user.followedAt).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {user.unfollowedAt && (
              <div className="p-3 bg-red-50 rounded border border-red-200">
                <label className="text-xs font-medium text-red-600 uppercase">
                  フォロー解除日
                </label>
                <p className="text-sm text-red-700 font-medium">
                  {new Date(user.unfollowedAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase block mb-2">
                ステータス
              </label>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  user.isBlocked
                    ? 'bg-red-100 text-red-800'
                    : user.unfollowedAt
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-line-green bg-opacity-10 text-line-green'
                }`}
              >
                {user.isBlocked
                  ? 'ブロック中'
                  : user.unfollowedAt
                  ? 'フォロー解除'
                  : 'アクティブ'}
              </span>
            </div>
          </div>
        </div>

        {/* Tags & Message Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tags Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">タグ</h2>
              {availableTags.length > 0 && (
                <button
                  onClick={() => setShowAddTagForm(!showAddTagForm)}
                  className="px-3 py-1 bg-line-green text-white rounded text-sm font-medium hover:bg-opacity-90 transition"
                >
                  {showAddTagForm ? 'キャンセル' : 'タグを追加'}
                </button>
              )}
            </div>

            {showAddTagForm && availableTags.length > 0 && (
              <form onSubmit={handleAddTag} className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                <select
                  value={selectedTagId}
                  onChange={(e) => setSelectedTagId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-3"
                  required
                >
                  <option value="">タグを選択</option>
                  {availableTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="w-full px-3 py-2 bg-line-green text-white rounded text-sm font-medium hover:bg-opacity-90 transition"
                >
                  追加
                </button>
              </form>
            )}

            {userTags.length === 0 ? (
              <p className="text-gray-500 text-sm">タグが割り当てられていません</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userTags.map((ut) => (
                  <div
                    key={ut.id}
                    className="flex items-center gap-2 px-3 py-1 rounded text-sm font-medium text-white"
                    style={{ backgroundColor: ut.tag.color }}
                  >
                    {ut.tag.name}
                    <button
                      onClick={() => handleRemoveTag(ut.tag.id)}
                      className="ml-1 hover:opacity-70 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Send Message Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                直接メッセージ送信
              </h2>
              {!showSendMessageForm && (
                <button
                  onClick={() => setShowSendMessageForm(true)}
                  className="px-3 py-1 bg-line-green text-white rounded text-sm font-medium hover:bg-opacity-90 transition"
                >
                  メッセージを送信
                </button>
              )}
            </div>

            {showSendMessageForm && (
              <form onSubmit={handleSendMessage} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メッセージタイプ
                  </label>
                  <select
                    value={messageForm.messageType}
                    onChange={(e) =>
                      setMessageForm({
                        ...messageForm,
                        messageType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="text">テキスト</option>
                    <option value="flex">Flex Message</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メッセージ内容
                  </label>
                  <textarea
                    value={messageForm.content}
                    onChange={(e) =>
                      setMessageForm({
                        ...messageForm,
                        content: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-line-green focus:border-transparent"
                    required
                    placeholder={
                      messageForm.messageType === 'flex'
                        ? 'Flex MessageをJSON形式で入力'
                        : 'メッセージを入力'
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 px-3 py-2 bg-line-green text-white rounded text-sm font-medium hover:bg-opacity-90 transition disabled:opacity-50"
                  >
                    {sending ? '送信中...' : '送信'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSendMessageForm(false)
                      setMessageForm({ messageType: 'text', content: '' })
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
