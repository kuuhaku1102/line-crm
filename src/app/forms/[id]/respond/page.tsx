'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

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
  fields: FormField[]
}

export default function FormRespondPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lineUserId = searchParams.get('lineUserId')

  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!lineUserId) {
      alert('lineUserId is required')
      return
    }

    fetchForm()
  }, [lineUserId])

  async function fetchForm() {
    try {
      const res = await fetch(`/api/forms/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setForm(data)

        // Initialize formData with empty strings
        const initialData: Record<string, string> = {}
        data.fields.forEach((field: FormField) => {
          initialData[field.id] = ''
        })
        setFormData(initialData)
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch form:', error)
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lineUserId) return

    setSubmitting(true)

    try {
      // Get user by lineUserId
      const userRes = await fetch(
        `/api/customers?lineUserId=${lineUserId}`
      )
      let userId: string | null = null

      if (userRes.ok) {
        const users = await userRes.json()
        if (users.length > 0) {
          userId = users[0].id
        }
      }

      if (!userId) {
        alert('User not found')
        setSubmitting(false)
        return
      }

      const res = await fetch(`/api/forms/${params.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          data: formData,
        }),
      })

      if (res.ok) {
        alert('フォームを送信しました')
        // Redirect to LINE or show success message
        window.location.href = 'https://line.me/'
      } else {
        alert('フォーム送信に失敗しました')
      }
    } catch (error) {
      console.error('Failed to submit form:', error)
      alert('エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (!lineUserId) {
    return (
      <div className="p-6 text-center text-red-600">
        エラー: lineUserId が指定されていません
      </div>
    )
  }

  if (loading) {
    return <div className="p-6 text-center">読み込み中...</div>
  }

  if (!form) {
    return (
      <div className="p-6 text-center text-red-600">
        フォームが見つかりません
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-line-green to-green-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-line-green text-white p-6">
          <h1 className="text-2xl font-bold">{form.name}</h1>
          {form.description && (
            <p className="text-sm text-green-100 mt-2">{form.description}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {form.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block font-medium text-gray-800">
                {field.label}
                {field.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>

              {field.fieldType === 'text' && (
                <input
                  type="text"
                  value={formData[field.id] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [field.id]: e.target.value,
                    })
                  }
                  required={field.required}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
                />
              )}

              {field.fieldType === 'email' && (
                <input
                  type="email"
                  value={formData[field.id] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [field.id]: e.target.value,
                    })
                  }
                  required={field.required}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
                />
              )}

              {field.fieldType === 'tel' && (
                <input
                  type="tel"
                  value={formData[field.id] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [field.id]: e.target.value,
                    })
                  }
                  required={field.required}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
                />
              )}

              {field.fieldType === 'textarea' && (
                <textarea
                  value={formData[field.id] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [field.id]: e.target.value,
                    })
                  }
                  required={field.required}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
                  rows={3}
                ></textarea>
              )}

              {field.fieldType === 'select' && (
                <select
                  value={formData[field.id] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [field.id]: e.target.value,
                    })
                  }
                  required={field.required}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-line-green"
                >
                  <option value="">選択してください</option>
                  {field.options &&
                    JSON.parse(field.options).map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                </select>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-line-green text-white font-bold rounded hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '送信中...' : '送信'}
          </button>
        </form>
      </div>
    </div>
  )
}
