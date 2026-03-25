'use client'

import React from 'react'
import Link from 'next/link'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>LINE CRM</title>
      </head>
      <body className="bg-white">
        <div className="flex h-screen bg-gray-50">
          {/* Sidebar */}
          <nav className="w-64 bg-line-dark text-white flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <h1 className="text-xl font-bold text-line-green">LINE CRM</h1>
            </div>
            <ul className="flex-1 space-y-2 p-4">
              <li>
                <Link
                  href="/"
                  className="block px-4 py-2 rounded hover:bg-gray-700 transition"
                >
                  📊 ダッシュボード
                </Link>
              </li>
              <li>
                <Link
                  href="/customers"
                  className="block px-4 py-2 rounded hover:bg-gray-700 transition"
                >
                  👥 顧客
                </Link>
              </li>
              <li>
                <Link
                  href="/messages"
                  className="block px-4 py-2 rounded hover:bg-gray-700 transition"
                >
                  💬 メッセージ
                </Link>
              </li>
              <li>
                <Link
                  href="/analytics"
                  className="block px-4 py-2 rounded hover:bg-gray-700 transition"
                >
                  📈 分析
                </Link>
              </li>
            </ul>
            <div className="p-4 border-t border-gray-700">
              <p className="text-xs text-gray-400">v0.1.0</p>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  )
}
