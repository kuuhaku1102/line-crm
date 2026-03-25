'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
  _count?: { userTags: number }
}

interface AutoTagRule {
  id: string
  keyword: string
  tag: Tag
  isActive: boolean
}

export default function TagsPage() {
  const router = useRouter()
  const [tags, setTags] = useState<Tag[]>([])
  const [rules, setRules] = useState<AutoTagRule[]>([])
  const [loading, setLoading] = useState(true)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#999999')
  const [newRuleKeyword, setNewRuleKeyword] = useState('')
  const [newRuleTagId, setNewRuleTagId] = useState('')

  useEffect(() => {
    fetchTags()
    fetchRules()
  }, [])

  async function fetchTags() {
    try {
      const res = await fetch('/api/tags')
      const data = await res.json()
      setTags(data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  async function fetchRules() {
    try {
      const res = await fetch('/api/auto-tag-rules')
      const data = await res.json()
      setRules(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch rules:', error)
      setLoading(false)
    }
  }

  async function createTag() {
    if (!newTagName.trim()) {
      alert('タグ名を入力してください')
      return
    }

    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName,
          color: newTagColor,
        }),
      })

      if (res.ok) {
        setNewTagName('')
        setNewTagColor('#999999')
        fetchTags()
      } else {
        alert('タグ作成に失敗しました')
      }
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  async function deleteTag(id: string) {
    if (!confirm('このタグを削除しますか？')) return

    try {
      const res = await fetch(`/api/tags?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchTags()
      } else {
        alert('タグ削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete tag:', error)
    }
  }

  async function createRule() {
    if (!newRuleKeyword.trim() || !newRuleTagId) {
      alert('キーワードとタグを選択してください')
      return
    }

    try {
      const res = await fetch('/api/auto-tag-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: newRuleKeyword,
          tagId: newRuleTagId,
        }),
      })

      if (res.ok) {
        setNewRuleKeyword('')
        setNewRuleTagId('')
        fetchRules()
      } else {
        alert('ルール作成に失敗しました')
      }
    } catch (error) {
      console.error('Failed to create rule:', error)
    }
  }

  async function deleteRule(id: string) {
    if (!confirm('このルールを削除しますか？')) return

    try {
      const res = await fetch(`/api/auto-tag-rules?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchRules()
      } else {
        alert('ルール削除に失敗しました')
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">🏷️ タグ管理</h1>

      {/* Tags Section */}
      <section className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-xl font-bold text-gray-700 mb-4">タグ一覧</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="タグ名"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
          />
          <input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded cursor-pointer"
          />
          <button
            onClick={createTag}
            className="px-4 py-2 bg-line-green text-white rounded hover:bg-green-600 transition"
          >
            タグ作成
          </button>
        </div>

        <div className="space-y-2">
          {tags.length === 0 ? (
            <p className="text-gray-500">タグがありません</p>
          ) : (
            tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: tag.color }}
                  ></div>
                  <span className="font-medium">{tag.name}</span>
                  <span className="text-sm text-gray-500">
                    (使用数: {tag._count?.userTags || 0})
                  </span>
                </div>
                <button
                  onClick={() => deleteTag(tag.id)}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  削除
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Auto-Tag Rules Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-700 mb-4">
          自動タグルール
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="キーワード"
            value={newRuleKeyword}
            onChange={(e) => setNewRuleKeyword(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
          />
          <select
            value={newRuleTagId}
            onChange={(e) => setNewRuleTagId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
          >
            <option value="">タグを選択</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <button
            onClick={createRule}
            className="px-4 py-2 bg-line-green text-white rounded hover:bg-green-600 transition"
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
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
                    {rule.keyword}
                  </span>
                  <span className="text-gray-600">→</span>
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: rule.tag.color }}
                  ></div>
                  <span>{rule.tag.name}</span>
                  {rule.isActive ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      有効
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      無効
                    </span>
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
    </div>
  )
}
