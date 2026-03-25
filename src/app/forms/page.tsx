'use client'

import { useState, useEffect } from 'react'

interface FormField {
  id: string
  label: string
  fieldType: string
  options?: string
  required: boolean
  sortOrder: number
}

interface Form {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  fields: FormField[]
  _count: { submissions: number }
}

const FIELD_TYPES = [
  { value: 'text', label: 'テキスト' },
  { value: 'email', label: 'メール' },
  { value: 'tel', label: '電話番号' },
  { value: 'select', label: 'セレクト' },
  { value: 'textarea', label: 'テキストエリア' },
]

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [newFormName, setNewFormName] = useState('')
  const [newFormDesc, setNewFormDesc] = useState('')
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState('text')
  const [newFieldRequired, setNewFieldRequired] = useState(false)

  useEffect(() => {
    fetchForms()
  }, [])

  async function fetchForms() {
    try {
      const res = await fetch('/api/forms')
      const data = await res.json()
      setForms(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch forms:', error)
      setLoading(false)
    }
  }

  async function createForm() {
    if (!newFormName.trim()) {
      alert('フォーム名を入力してください')
      return
    }

    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFormName,
          description: newFormDesc || null,
        }),
      })

      if (res.ok) {
        setNewFormName('')
        setNewFormDesc('')
        fetchForms()
      }
    } catch (error) {
      console.error('Failed to create form:', error)
    }
  }

  async function deleteForm(id: string) {
    if (!confirm('このフォームを削除しますか？')) return

    try {
      const res = await fetch(`/api/forms?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchForms()
      }
    } catch (error) {
      console.error('Failed to delete form:', error)
    }
  }

  async function addField(formId: string) {
    if (!newFieldLabel.trim()) {
      alert('フィールド名を入力してください')
      return
    }

    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newFieldLabel,
          fieldType: newFieldType,
          required: newFieldRequired,
        }),
      })

      if (res.ok) {
        setNewFieldLabel('')
        setNewFieldType('text')
        setNewFieldRequired(false)
        fetchForms()
      }
    } catch (error) {
      console.error('Failed to add field:', error)
    }
  }

  async function deleteField(formId: string, fieldId: string) {
    if (!confirm('このフィールドを削除しますか？')) return

    try {
      const res = await fetch(`/api/forms/${formId}?fieldId=${fieldId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchForms()
      }
    } catch (error) {
      console.error('Failed to delete field:', error)
    }
  }

  if (loading) {
    return <div className="p-6">読み込み中...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📝 フォーム</h1>

      {/* Create Form Section */}
      <section className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-xl font-bold text-gray-700 mb-4">
          新しいフォームを作成
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="フォーム名"
            value={newFormName}
            onChange={(e) => setNewFormName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
          />
          <textarea
            placeholder="説明（オプション）"
            value={newFormDesc}
            onChange={(e) => setNewFormDesc(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
            rows={2}
          ></textarea>
          <button
            onClick={createForm}
            className="w-full px-6 py-2 bg-line-green text-white rounded hover:bg-green-600 transition"
          >
            フォーム作成
          </button>
        </div>
      </section>

      {/* Forms List */}
      <section className="space-y-4">
        {forms.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            フォームがありません
          </div>
        ) : (
          forms.map((form) => (
            <div key={form.id} className="bg-white rounded-lg shadow">
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition"
                onClick={() =>
                  setExpandedFormId(expandedFormId === form.id ? null : form.id)
                }
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {form.name}
                    </h3>
                    {form.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {form.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      回答数: {form._count.submissions} | フィールド:{' '}
                      {form.fields.length} 個
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      フォームURL: /forms/{form.id}/respond?lineUserId=USER_ID
                    </p>
                  </div>
                  <div className="text-2xl">
                    {expandedFormId === form.id ? '▼' : '▶'}
                  </div>
                </div>
              </div>

              {expandedFormId === form.id && (
                <div className="bg-gray-50 border-t border-gray-200 p-6">
                  {/* Fields List */}
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-700 mb-3">フィールド</h4>
                    {form.fields.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        フィールドはありません
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {form.fields.map((field, idx) => (
                          <div
                            key={field.id}
                            className="bg-white p-3 rounded border-l-4 border-line-green"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-mono text-gray-600">
                                  #{idx + 1}
                                </p>
                                <p className="font-semibold text-gray-800">
                                  {field.label}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {
                                    FIELD_TYPES.find(
                                      (f) => f.value === field.fieldType
                                    )?.label
                                  }
                                  {field.required && (
                                    <span className="ml-2 text-red-500">
                                      (必須)
                                    </span>
                                  )}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  deleteField(form.id, field.id)
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

                  {/* Add Field Form */}
                  <div className="border-t pt-6">
                    <h4 className="font-bold text-gray-700 mb-3">
                      フィールドを追加
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="フィールド名"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        className="col-span-2 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
                      />
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newFieldRequired}
                          onChange={(e) =>
                            setNewFieldRequired(e.target.checked)
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm">必須</span>
                      </label>
                      <button
                        onClick={() => addField(form.id)}
                        className="col-span-2 px-4 py-2 bg-line-green text-white rounded hover:bg-green-600 transition"
                      >
                        フィールド追加
                      </button>
                    </div>
                  </div>

                  {/* Delete Form */}
                  <div className="border-t pt-6 mt-6">
                    <button
                      onClick={() => deleteForm(form.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      フォーム削除
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
